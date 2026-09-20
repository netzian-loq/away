"use server";

import { findPurchasable, priceFor, supportsExtreme } from "@/content/catalog";
import { CURRENCY } from "@/content/pricing";
import { applyDiscount, describeDiscount, findDiscount, formatAmount } from "@/lib/discounts";
import { sendTicketOrderEmail, sendTicketOrderNotification } from "@/lib/email";
import { recordOrder } from "@/lib/orders/record";
import { ticketOrderSchema } from "@/lib/validations";

export type TicketMethod = "bank-transfer" | "crypto";

export interface TicketOrderState {
  status: "idle" | "success" | "error";
  message?: string;
  /** Echoed back so the handoff screen can show what to quote in the ticket. */
  reference?: string;
  amount?: string;
  tierName?: string;
}

/**
 * Registers an order that will be paid and confirmed by hand in a Discord
 * ticket. Both manual methods run through here — bank transfer and crypto —
 * because the only thing that differs between them is the wording.
 *
 * This replaced two flows that each ended in a button the buyer pressed to
 * assert they had paid. That assertion was worth nothing: anyone could click
 * "I've sent the transfer" without sending anything, and the order landed in
 * the ledger looking exactly like a real one, so every row had to be checked
 * against the account by hand anyway. Nothing on this path can mark an order
 * paid, and nothing claims to. The row it writes is explicitly an intent to
 * pay, the owner confirms the money in the ticket, and the dashboard is where
 * it becomes paid.
 *
 * The price is still derived from the slug here — the form never carries an
 * amount, on this path or any other.
 */
export async function submitTicketOrder(
  _prevState: TicketOrderState,
  formData: FormData,
): Promise<TicketOrderState> {
  const parsed = ticketOrderSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Please check the form and try again.",
    };
  }

  const { tier: tierSlug, code, email, discord, reference, method, extreme, company } =
    parsed.data;

  // Hidden field — only a script fills it. Reporting success teaches a bot
  // nothing and the false-positive rate is ~zero.
  //
  // There is no minimum-fill-time check to go with it, deliberately. The one
  // on the old bank form discarded real orders (password-manager autofill
  // trips it) and the worst a bot can do here is put a pending row on a
  // dashboard, which is not worth losing a sale to.
  if (company) return { status: "success", reference };

  const item = findPurchasable(tierSlug);
  if (!item) {
    return { status: "error", message: "That package doesn't exist." };
  }

  const discount = findDiscount(code);
  // Upgrade first, discount second — same order as every other path, so the
  // partner takes their percentage off what the buyer actually pays.
  const upgraded = extreme && supportsExtreme(item);
  const amount = formatAmount(applyDiscount(priceFor(item, upgraded), discount));
  // The upgrade rides in the name rather than its own ledger column: it is
  // what the owner needs to see on the dashboard and in the ticket, and a
  // schema change would rewrite every historic row to say "no".
  const itemName = upgraded ? item.name + " + Extreme Windows Tuning" : item.name;
  const buyerEmail = email?.trim() ?? "";

  // Pending, always. Neither a bank nor a wallet calls us back, so commission
  // isn't owed until this is marked paid on the dashboard.
  const ledger = await recordOrder({
    id: reference,
    source: method,
    status: "pending",
    tierSlug: item.slug,
    tierName: itemName,
    amount,
    currency: CURRENCY,
    partner: discount?.partner ?? "direct",
    discountCode: discount?.code ?? null,
    buyerEmail,
    discord,
  });

  const input = {
    method,
    ...(buyerEmail ? { buyerEmail } : {}),
    tierName: itemName,
    amount,
    currency: CURRENCY,
    reference,
    partner: discount?.partner ?? "direct",
    ...(discount?.code ? { discountCode: discount.code } : {}),
    discountSummary: describeDiscount(discount),
    discord,
  };

  // Buyer receipt is best-effort and only when they gave an address: the
  // ticket is the real channel, and the handoff screen already shows them
  // everything this mail repeats.
  if (buyerEmail) {
    try {
      await sendTicketOrderEmail(input);
    } catch (error) {
      console.error("[ticket-order] buyer email failed", error);
    }
  }

  // Only fatal when the ledger write failed too — the one case where nothing
  // anywhere knows this order exists. Otherwise the buyer goes to their
  // ticket and the row is there to be found.
  try {
    await sendTicketOrderNotification(input, ledger);
  } catch (error) {
    console.error("[ticket-order] owner notification failed", error);
    if (!ledger.recorded) {
      return {
        status: "error",
        message: "We couldn't register that order. Please open a ticket on Discord instead.",
      };
    }
  }

  return {
    status: "success",
    reference,
    amount,
    tierName: itemName,
  };
}
