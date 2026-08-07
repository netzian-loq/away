import type { NextRequest } from "next/server";
import { findTier } from "@/content/pricing";
import { describeDiscount, DISCOUNTS } from "@/lib/discounts";
import {
  sendPurchaseEmail,
  sendPurchaseNotification,
  type PurchaseEmailInput,
  type ReceiptDelivery,
} from "@/lib/email";
import { recordOrder } from "@/lib/orders/record";
import { capturePayPalOrder, PayPalApiError, PayPalConfigError } from "@/lib/paypal";
import { captureOrderSchema } from "@/lib/validations";

/**
 * Captures an approved PayPal order, then emails the buyer their receipt and
 * the owner a notification.
 *
 * Everything money-related is read back out of PayPal's capture response, not
 * the request body — the only thing the browser contributes is the buyer's
 * Discord handle, which is contact info.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = captureOrderSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const capture = await capturePayPalOrder(parsed.data.orderId);

    if (capture.status !== "COMPLETED") {
      return Response.json(
        { error: "The payment wasn't completed.", status: capture.status },
        { status: 402 },
      );
    }

    const tier = findTier(capture.tierSlug);
    const discount = DISCOUNTS.find((entry) => entry.partner === capture.partner) ?? null;

    const emailInput: PurchaseEmailInput = {
      buyerEmail: capture.buyerEmail,
      buyerName: capture.buyerName,
      tierName: tier?.name ?? capture.tierSlug,
      amount: capture.amount,
      currency: capture.currency,
      orderId: capture.orderId,
      partner: capture.partner,
      discountCode: discount?.code,
      discountSummary: describeDiscount(discount),
      discord: parsed.data.discord || undefined,
    };

    // The money has already moved, so no mail failure may read as a failed
    // purchase. The buyer's receipt goes first so the owner's notification can
    // report whether it actually reached them.
    let delivery: ReceiptDelivery = { delivered: true, to: capture.buyerEmail };
    try {
      if (!capture.buyerEmail) throw new Error("PayPal returned no payer email");
      await sendPurchaseEmail(emailInput);
    } catch (error) {
      console.error("[paypal] buyer receipt failed", error);
      delivery = {
        delivered: false,
        to: capture.buyerEmail || "unknown address",
        error: error instanceof Error ? error.message : "unknown error",
      };
    }

    // Captured means the money has moved, so this lands straight as paid and
    // the commission is owed immediately.
    const ledger = await recordOrder({
      id: capture.orderId,
      source: "paypal",
      status: "paid",
      tierSlug: capture.tierSlug,
      tierName: emailInput.tierName,
      amount: capture.amount,
      currency: capture.currency,
      partner: capture.partner,
      discountCode: discount?.code ?? null,
      buyerEmail: capture.buyerEmail,
      discord: parsed.data.discord || "",
    });

    try {
      await sendPurchaseNotification(emailInput, delivery, ledger);
    } catch (error) {
      console.error("[paypal] owner notification failed", error);
    }

    return Response.json({
      status: capture.status,
      orderId: capture.orderId,
      amount: capture.amount,
      currency: capture.currency,
      tierName: emailInput.tierName,
      buyerEmail: capture.buyerEmail,
    });
  } catch (error) {
    if (error instanceof PayPalConfigError) {
      return Response.json({ error: "Card payments aren't switched on yet." }, { status: 503 });
    }
    console.error("[paypal] capture-order failed", error);
    const status = error instanceof PayPalApiError ? 502 : 500;
    return Response.json({ error: "Could not confirm the payment." }, { status });
  }
}
