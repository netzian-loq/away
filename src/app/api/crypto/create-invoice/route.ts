import type { NextRequest } from "next/server";
import { findPurchasable } from "@/content/catalog";
import { CURRENCY } from "@/content/pricing";
import { SITE } from "@/content/site";
import { applyDiscount, findDiscount } from "@/lib/discounts";
import { createInvoice, CryptoApiError, CryptoConfigError } from "@/lib/nowpayments";
import { recordOrder } from "@/lib/orders/record";
import { cryptoInvoiceSchema } from "@/lib/validations";

/**
 * Opens a NOWPayments hosted invoice for one bundle or single service.
 *
 * Same contract as the PayPal and Stripe routes: the client sends a catalog
 * slug and an optional discount code — never a price. The amount is derived
 * here from CATALOG so a tampered request can't buy an Extreme tune for €1.
 *
 * The order is written to the ledger as `pending` BEFORE the invoice is
 * created, so the buyer's email and Discord handle are already stored against
 * the reference when the IPN comes back. NOWPayments only echoes `order_id`,
 * so if this write were skipped a confirmed payment would arrive with no way
 * to tell who it belonged to.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = cryptoInvoiceSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const item = findPurchasable(parsed.data.tier);
  if (!item) {
    return Response.json({ error: "Unknown package." }, { status: 400 });
  }

  const discount = findDiscount(parsed.data.code);
  const amount = applyDiscount(item.price, discount);
  const reference = parsed.data.reference;
  const origin = originOf(request);

  const ledger = await recordOrder({
    id: reference,
    source: "crypto",
    status: "pending",
    tierSlug: item.slug,
    tierName: item.name,
    amount,
    currency: CURRENCY,
    partner: discount?.partner ?? "direct",
    discountCode: discount?.code ?? null,
    buyerEmail: parsed.data.email,
    discord: parsed.data.discord,
  });

  if (!ledger.recorded) {
    // Unlike the other providers, this one is fatal. recordOrder never throws
    // and the money has NOT moved yet, so failing now costs a click; letting
    // the buyer pay against an order we can't identify costs the order.
    console.error("[crypto] refusing to invoice, ledger write failed", reference, ledger.error);
    return Response.json(
      { error: "Could not start the payment. Please try again, or open a ticket on Discord." },
      { status: 503 },
    );
  }

  try {
    const invoice = await createInvoice({
      amount,
      currency: CURRENCY,
      reference,
      description: `${SITE.name} — ${item.name}`,
      // Must be publicly reachable, so it is pinned to the canonical site
      // rather than the request origin: a localhost or preview URL here means
      // NOWPayments silently never delivers the confirmation.
      ipnCallbackUrl: `${SITE.url}/api/crypto/webhook`,
      successUrl: `${origin}/checkout/success?reference=${encodeURIComponent(reference)}`,
      cancelUrl: `${origin}/checkout?item=${encodeURIComponent(item.slug)}${
        discount ? `&code=${encodeURIComponent(discount.code)}` : ""
      }`,
    });

    return Response.json({ id: invoice.id, url: invoice.invoiceUrl, reference });
  } catch (error) {
    if (error instanceof CryptoConfigError) {
      console.error("[crypto] not configured", error.message);
      return Response.json({ error: "Crypto payments aren't switched on yet." }, { status: 503 });
    }
    console.error("[crypto] create-invoice failed", error);
    const status = error instanceof CryptoApiError ? 502 : 500;
    return Response.json({ error: "Could not start the crypto payment." }, { status });
  }
}

/** Request origin, falling back to the canonical site URL if it's unparseable. */
function originOf(request: NextRequest): string {
  try {
    return new URL(request.url).origin;
  } catch {
    return SITE.url;
  }
}
