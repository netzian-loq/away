import type { NextRequest } from "next/server";
import { describeDiscount, findDiscount } from "@/lib/discounts";
import {
  sendPurchaseEmail,
  sendPurchaseNotification,
  type PurchaseEmailInput,
  type ReceiptDelivery,
} from "@/lib/email";
import {
  CryptoApiError,
  CryptoConfigError,
  normalizeIpn,
  verifyIpn,
} from "@/lib/nowpayments";
import { getOrder, setOrderStatus } from "@/lib/orders/store";

/**
 * NOWPayments' view of a crypto payment — and the ONLY thing that can mark a
 * crypto order paid.
 *
 * Nothing in the browser can reach this outcome: the success page the buyer
 * lands on is cosmetic, and a buyer who closes the invoice without paying
 * leaves a pending order. That is the whole point of routing crypto through a
 * provider rather than trusting a "I've sent it" button.
 *
 * NOWPayments retries until it gets a 2xx, so this has to be idempotent — see
 * the already-paid guard below. It also delivers intermediate states
 * (`waiting`, `confirming`), which are acknowledged and ignored.
 */
export async function POST(request: NextRequest) {
  // Raw bytes exactly as sent: parsing and re-serialising would reorder keys
  // and invalidate the signature.
  const rawBody = await request.text();

  let payload: Record<string, unknown>;
  try {
    payload = verifyIpn(rawBody, request.headers.get("x-nowpayments-sig"));
  } catch (error) {
    if (error instanceof CryptoConfigError) {
      // No IPN secret. Refusing is the only safe answer — an unverified body
      // is attacker-controlled and must never be able to mark an order paid.
      console.error("[crypto] IPN received but NOWPAYMENTS_IPN_SECRET is not set");
      return Response.json({ error: "Webhooks aren't configured." }, { status: 503 });
    }
    const message = error instanceof CryptoApiError ? error.message : "Invalid payload.";
    console.error("[crypto] IPN verification failed:", message);
    return Response.json({ error: message }, { status: 400 });
  }

  const payment = normalizeIpn(payload);

  if (!payment.reference) {
    // Acknowledge rather than 400: retrying will not conjure an order_id, and
    // a permanently failing callback is noise in their dashboard forever.
    console.error("[crypto] IPN carried no order_id", payment.paymentId);
    return Response.json({ received: true, ignored: "no order_id" });
  }

  const order = await getOrder(payment.reference).catch((error) => {
    console.error("[crypto] ledger read failed", payment.reference, error);
    return undefined;
  });

  // undefined means the read itself failed — 500 so NOWPayments retries.
  // null means there is genuinely no such order, which retrying won't fix.
  if (order === undefined) {
    return Response.json({ error: "Ledger unavailable." }, { status: 500 });
  }
  if (order === null) {
    console.error("[crypto] IPN for an unknown order", payment.reference);
    return Response.json({ received: true, ignored: "unknown order" });
  }

  if (payment.outcome === "pending") {
    return Response.json({ received: true, status: payment.status });
  }

  if (payment.outcome === "failed" || payment.outcome === "underpaid") {
    // Neither marks the order paid. Underpaid especially: the buyer did send
    // funds, just not enough, and deciding whether to honour it or refund is a
    // judgement call, not something to automate.
    console.warn(
      `[crypto] ${payment.status} for ${payment.reference} —`,
      `${payment.actuallyPaid} ${payment.payCurrency} against ${payment.amount} ${payment.currency}`,
    );
    try {
      await sendPurchaseNotification({
        ...emailInput(order, payment),
        source: `Crypto — ${payment.status.toUpperCase()}, NOT credited`,
      });
    } catch (error) {
      console.error("[crypto] owner notification failed", error);
    }
    return Response.json({ received: true, status: payment.status });
  }

  // Retried callback for an order already settled: acknowledge and send
  // nothing, or the buyer gets a second receipt every time NOWPayments retries.
  if (order.status === "paid") {
    return Response.json({ received: true, alreadyPaid: true });
  }

  const paid = await setOrderStatus(payment.reference, "paid").catch((error) => {
    console.error("[crypto] could not mark order paid", payment.reference, error);
    return undefined;
  });
  if (paid === undefined) {
    // 500 so it is retried — the money HAS moved and the ledger must catch up.
    return Response.json({ error: "Could not update the order." }, { status: 500 });
  }

  const input = emailInput(paid ?? order, payment);

  let delivery: ReceiptDelivery = { delivered: true, to: input.buyerEmail };
  if (input.buyerEmail) {
    try {
      await sendPurchaseEmail(input);
    } catch (error) {
      console.error("[crypto] buyer receipt failed", error);
      delivery = {
        delivered: false,
        to: input.buyerEmail,
        error: error instanceof Error ? error.message : "unknown error",
      };
    }
  }

  try {
    await sendPurchaseNotification(input, delivery, { recorded: true });
  } catch (error) {
    // Not fatal, and specifically NOT a retry: the order is already paid in
    // the ledger, so a 500 here would loop forever over a mail problem.
    console.error("[crypto] owner notification failed", error);
  }

  return Response.json({ received: true, status: payment.status });
}

function emailInput(
  order: { tierName: string; buyerEmail: string; discord: string; partner: string; discountCode: string | null },
  payment: { amount: string; currency: string; reference: string; payCurrency: string; actuallyPaid: string },
): PurchaseEmailInput {
  const discount = findDiscount(order.discountCode);
  return {
    buyerEmail: order.buyerEmail,
    tierName: order.tierName,
    amount: payment.amount,
    currency: payment.currency,
    orderId: payment.reference,
    partner: order.partner,
    discountCode: order.discountCode ?? undefined,
    discountSummary: describeDiscount(discount),
    discord: order.discord,
    source: `Crypto (${payment.actuallyPaid} ${payment.payCurrency} via NOWPayments)`,
  };
}
