import type { NextRequest } from "next/server";
import { findPurchasable } from "@/content/catalog";
import { describeDiscount, findDiscount } from "@/lib/discounts";
import {
  sendPurchaseEmail,
  sendPurchaseNotification,
  type PurchaseEmailInput,
  type ReceiptDelivery,
} from "@/lib/email";
import { recordOrder } from "@/lib/orders/record";
import { listOrders } from "@/lib/orders/store";
import {
  constructWebhookEvent,
  normalizeSession,
  StripeApiError,
  StripeConfigError,
} from "@/lib/stripe";
import type Stripe from "stripe";

/**
 * Stripe's view of a completed purchase — and the only place a Stripe order is
 * recorded.
 *
 * This is deliberately not driven from the success page the way the PayPal
 * path is driven from the browser: a buyer who pays and then closes the tab
 * never loads the success page, and that order would simply vanish. Stripe
 * delivers this event regardless, and retries until it gets a 2xx.
 *
 * Because it retries, the handler has to be idempotent — see the guard below.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  // Must be the raw bytes exactly as sent: parsing and re-serialising the JSON
  // would change the payload and invalidate the signature.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(rawBody, signature);
  } catch (error) {
    if (error instanceof StripeConfigError) {
      // No signing secret configured. Refusing is the only safe answer — an
      // unverified body is attacker-controlled and must never reach the ledger.
      console.error("[stripe] webhook received but STRIPE_WEBHOOK_SECRET is not set");
      return Response.json({ error: "Webhooks aren't configured." }, { status: 503 });
    }
    const message = error instanceof StripeApiError ? error.message : "Invalid payload.";
    console.error("[stripe] webhook signature verification failed", message);
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  // Everything else (payment_intent.*, charge.*) is noise for this app.
  // Acknowledge it so Stripe stops retrying.
  if (event.type !== "checkout.session.completed") {
    return Response.json({ received: true, ignored: event.type });
  }

  const checkout = normalizeSession(event.data.object);

  // `complete` with an unpaid status happens on async methods (SEPA debit)
  // that haven't cleared. Acknowledge without recording — the money isn't in.
  if (checkout.paymentStatus !== "paid") {
    console.warn(
      `[stripe] session ${checkout.sessionId} completed but payment_status=${checkout.paymentStatus}`,
    );
    return Response.json({ received: true, pending: checkout.paymentStatus });
  }

  // Idempotency. Stripe retries on any non-2xx and can deliver the same event
  // more than once even on success. The ledger already collapses duplicate ids
  // (last write wins), so the thing actually worth guarding is the emails.
  //
  // Best-effort by design: on a host with no persistent disk (Vercel) the
  // ledger read comes back empty and a genuine retry would re-send. Returning
  // 200 promptly is what keeps that from happening in practice.
  if (await alreadyRecorded(checkout.sessionId)) {
    return Response.json({ received: true, duplicate: true });
  }

  const item = findPurchasable(checkout.tierSlug);
  const discount = findDiscount(checkout.discountCode);

  const emailInput: PurchaseEmailInput = {
    buyerEmail: checkout.buyerEmail,
    buyerName: checkout.buyerName,
    tierName: item?.name ?? checkout.tierSlug,
    amount: checkout.amount,
    currency: checkout.currency,
    orderId: checkout.sessionId,
    partner: checkout.partner,
    discountCode: discount?.code,
    discountSummary: describeDiscount(discount),
    discord: checkout.discord || undefined,
    source: "Stripe",
  };

  // The money has already moved, so no mail failure may read as a failed
  // purchase. The buyer's receipt goes first so the owner's notification can
  // report whether it actually reached them.
  let delivery: ReceiptDelivery = { delivered: true, to: checkout.buyerEmail };
  try {
    if (!checkout.buyerEmail) throw new Error("Stripe returned no customer email");
    await sendPurchaseEmail(emailInput);
  } catch (error) {
    console.error("[stripe] buyer receipt failed", error);
    delivery = {
      delivered: false,
      to: checkout.buyerEmail || "unknown address",
      error: error instanceof Error ? error.message : "unknown error",
    };
  }

  const ledger = await recordOrder({
    id: checkout.sessionId,
    source: "stripe",
    status: "paid",
    tierSlug: checkout.tierSlug,
    tierName: emailInput.tierName,
    amount: checkout.amount,
    currency: checkout.currency,
    partner: checkout.partner,
    discountCode: discount?.code ?? null,
    buyerEmail: checkout.buyerEmail,
    discord: checkout.discord,
  });

  try {
    await sendPurchaseNotification(emailInput, delivery, ledger);
  } catch (error) {
    console.error("[stripe] owner notification failed", error);
  }

  // Always 200 from here on. The payment succeeded; a retry would only produce
  // duplicate mail, and any failure above has already been logged and carried
  // into the owner's notification.
  return Response.json({ received: true });
}

/** True if this session id is already in the ledger. Never throws. */
async function alreadyRecorded(sessionId: string): Promise<boolean> {
  try {
    const orders = await listOrders();
    return orders.some((order) => order.id === sessionId);
  } catch (error) {
    console.error("[stripe] could not check the ledger for duplicates", error);
    return false;
  }
}
