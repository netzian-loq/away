import type { NextRequest } from "next/server";
import { findPurchasable } from "@/content/catalog";
import { CURRENCY } from "@/content/pricing";
import { SITE } from "@/content/site";
import { applyDiscount, findDiscount } from "@/lib/discounts";
import {
  createCheckoutSession,
  StripeApiError,
  StripeConfigError,
} from "@/lib/stripe";
import { createStripeSessionSchema } from "@/lib/validations";

/**
 * Opens a Stripe hosted Checkout session for one bundle or single service.
 *
 * Same contract as the PayPal create-order route: the client sends a catalog
 * slug and an optional discount code — never a price. The amount is derived
 * here from CATALOG so a tampered request can't buy an Extreme tune for €1.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createStripeSessionSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const item = findPurchasable(parsed.data.tier);
  if (!item) {
    return Response.json({ error: "Unknown package." }, { status: 400 });
  }

  const discount = findDiscount(parsed.data.code);
  const amount = applyDiscount(item.price, discount);

  // Taken from the incoming request rather than SITE.url so that localhost and
  // preview deploys redirect back to themselves instead of to production.
  // `new URL(request.url)` rather than `request.nextUrl` — same answer, and it
  // works on a plain Request too.
  const origin = originOf(request);

  try {
    const session = await createCheckoutSession({
      amount,
      currency: CURRENCY,
      productName: `${SITE.name} — ${item.name}`,
      description: item.blurb,
      tierSlug: item.slug,
      partner: discount?.partner ?? "direct",
      discountCode: discount?.code ?? "",
      discord: parsed.data.discord ?? "",
      successUrl: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/checkout?item=${encodeURIComponent(item.slug)}${
        discount ? `&code=${encodeURIComponent(discount.code)}` : ""
      }`,
    });

    if (!session.url) {
      return Response.json({ error: "Stripe returned no checkout URL." }, { status: 502 });
    }

    return Response.json({ id: session.id, url: session.url });
  } catch (error) {
    if (error instanceof StripeConfigError) {
      return Response.json({ error: "Card payments aren't switched on yet." }, { status: 503 });
    }
    console.error("[stripe] create-session failed", error);
    const status = error instanceof StripeApiError ? 502 : 500;
    return Response.json({ error: "Could not start the Stripe checkout." }, { status });
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
