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

  // Honeypot: the field is hidden, so only a script fills it. Reporting
  // success teaches a bot nothing, and the false-positive rate is ~zero.
  if (company) return { status: "success", reference };

  // Minimum fill time is NOT treated the same way, deliberately. A human who
  // trips it — password-manager autofill, a fast typist on a slow-mounting
  // page — used to get an identical fake receipt with no order recorded and
  // no email sent to anybody, which is indistinguishable from success and
  // loses a real sale silently. It is now a flag on the owner's notification
  // instead of a discard: a suspicious order that turns out to be a bot costs
  // one email, a discarded order that turned out to be a customer costs the
  // customer.
  const suspiciouslyFast = Date.now() - startedAt < MIN_FILL_TIME_MS;

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
    ...(suspiciouslyFast
      ? { flag: "Submitted suspiciously fast — this may be a bot, not a buyer." }
      : {}),
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

  // The notification used to be treated as make-or-break, from when email was
  // the only record. It isn't any more — the ledger write above is — and
  // failing the whole submission on a mail error told the buyer their order
  // hadn't been recorded when it had, sending them off to submit it a second
  // time. It is now only fatal when the ledger ALSO failed, which is the case
  // where nothing anywhere knows about this order.
  try {
    await sendBankTransferNotification(input, delivery, ledger);
  } catch (error) {
    console.error("[bank-transfer] owner notification failed", error);
    if (!ledger.recorded) {
      console.error("[bank-transfer] ORDER LOST — ledger and notification both failed", reference);
      return {
        status: "error",
        message: "Something went wrong recording your order. Please open a ticket on Discord.",
      };
    }
  }

  return { status: "success", reference, amount, tierName: item.name };
}
