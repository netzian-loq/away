"use server";

import { findPurchasable } from "@/content/catalog";
import { CURRENCY } from "@/content/pricing";
import { applyDiscount, describeDiscount, findDiscount, formatAmount } from "@/lib/discounts";
import {
  sendBankTransferEmail,
  sendBankTransferNotification,
  type BankTransferEmailInput,
  type ReceiptDelivery,
} from "@/lib/email";
import { recordOrder } from "@/lib/orders/record";
import { bankTransferSchema } from "@/lib/validations";

export interface BankTransferState {
  status: "idle" | "success" | "error";
  message?: string;
  /** Echoed back so the success panel can show what to pay. */
  reference?: string;
  amount?: string;
  tierName?: string;
}

const MIN_FILL_TIME_MS = 1500;

/**
 * Records a bank transfer order: mails the buyer what to send and the owner
 * what to watch for. The price is derived from the tier slug here, exactly as
 * in the PayPal route — the form never carries an amount.
 */
export async function submitBankTransferOrder(
  _prevState: BankTransferState,
  formData: FormData,
): Promise<BankTransferState> {
  const parsed = bankTransferSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Please check the form and try again.",
    };
  }

  const { tier: tierSlug, code, email, discord, reference, company, startedAt } = parsed.data;

  // Honeypot and minimum fill time — same bot defences as the contact form.
  // Both report success so a bot learns nothing from the response.
  if (company) return { status: "success", reference };
  if (Date.now() - startedAt < MIN_FILL_TIME_MS) return { status: "success", reference };

  const item = findPurchasable(tierSlug);
  if (!item) {
    return { status: "error", message: "That package doesn't exist." };
  }

  const discount = findDiscount(code);
  const amount = formatAmount(applyDiscount(item.price, discount));

  const input: BankTransferEmailInput = {
    buyerEmail: email,
    tierName: item.name,
    amount,
    currency: CURRENCY,
    reference,
    partner: discount?.partner ?? "direct",
    discountCode: discount?.code,
    discountSummary: describeDiscount(discount),
    discord,
  };

  // Buyer receipt first, so its outcome can be reported in the owner's
  // notification below. A failure here is never fatal — the buyer has already
  // seen the details on screen.
  let delivery: ReceiptDelivery = { delivered: true, to: email };
  try {
    await sendBankTransferEmail(input);
  } catch (error) {
    console.error("[bank-transfer] buyer email failed", error);
    delivery = {
      delivered: false,
      to: email,
      error: error instanceof Error ? error.message : "unknown error",
    };
  }

  // Pending, not paid: no bank tells us when the money lands, so commission
  // isn't owed until this is marked paid on the dashboard.
  const ledger = await recordOrder({
    id: reference,
    source: "bank-transfer",
    status: "pending",
    tierSlug: item.slug,
    tierName: item.name,
    amount,
    currency: CURRENCY,
    partner: discount?.partner ?? "direct",
    discountCode: discount?.code ?? null,
    buyerEmail: email,
    discord,
  });

  // The owner's notification is what makes the order real, so this one is
  // make-or-break: without it an order could vanish unnoticed.
  try {
    await sendBankTransferNotification(input, delivery, ledger);
  } catch (error) {
    console.error("[bank-transfer] owner notification failed", error);
    return {
      status: "error",
      message: "Something went wrong recording your order. Please open a ticket on Discord.",
    };
  }

  return { status: "success", reference, amount, tierName: item.name };
}
