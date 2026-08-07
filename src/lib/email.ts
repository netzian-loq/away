import { Resend } from "resend";
import { SITE } from "@/content/site";
import { PURCHASE_THANK_YOU } from "@/lib/email-copy";

/**
 * Sender address. `onboarding@resend.dev` is Resend's shared sandbox sender —
 * it can only deliver to the account owner's own address, which is fine for
 * the contact form but NOT for buyer receipts. Set RESEND_FROM to an address
 * on a domain verified in Resend before taking real payments.
 */
const FROM = process.env.RESEND_FROM || "Away Tweaks <onboarding@resend.dev>";

export interface ContactEmailInput {
  name: string;
  discord: string;
  specs?: string;
  message: string;
}

export async function sendContactEmail(input: ContactEmailInput) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { name, discord, specs, message } = input;
  const result = await resend.emails.send({
    from: "Away Tweaks Website <onboarding@resend.dev>",
    to: "Mattiaarminante77@gmail.com",
    subject: `Away Tweaks Request — ${name}`,
    text: `Name: ${name}\nDiscord: ${discord}\nPC Specs: ${specs || "—"}\n\nMessage:\n${message}`,
  });
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result;
}

/**
 * Outcome of the buyer's receipt, reported inside the owner's notification.
 *
 * Without this a failed receipt is invisible: the buyer sees a success screen,
 * the owner sees a normal order, and nobody knows the customer was never
 * emailed. Surfacing it turns a silent failure into a to-do.
 */
export interface ReceiptDelivery {
  delivered: boolean;
  /** Address the receipt was addressed to — exactly what the customer gave. */
  to: string;
  error?: string;
}

/** Whether the order made it into the on-disk ledger behind the dashboard. */
export interface LedgerOutcome {
  recorded: boolean;
  error?: string;
}

function ledgerLines(ledger?: LedgerOutcome): string[] {
  if (!ledger || ledger.recorded) return [];
  return [
    "",
    "NOT SAVED TO THE ORDERS DASHBOARD — keep this email as the record.",
    `Reason: ${ledger.error ?? "unknown"}`,
  ];
}

function receiptLines(delivery?: ReceiptDelivery): string[] {
  if (!delivery) return [];
  if (delivery.delivered) return ["", `Receipt emailed to buyer: yes (${delivery.to})`];
  return [
    "",
    `Receipt emailed to buyer: NO — ${delivery.to} was not contacted.`,
    `Reason: ${delivery.error ?? "unknown"}`,
    "Contact them on Discord, or set RESEND_FROM to a verified domain to fix this for good.",
  ];
}

export interface PurchaseEmailInput {
  /** PayPal payer email — where the receipt goes. */
  buyerEmail: string;
  buyerName?: string;
  /** Package name, e.g. "Pro Level". */
  tierName: string;
  /** Fixed-2 amount as actually charged. */
  amount: string;
  currency: string;
  orderId: string;
  /** Partner attribution slug, e.g. "cosmo" or "direct". */
  partner: string;
  discountCode?: string;
  /** Human-readable discount line for the owner — see describeDiscount(). */
  discountSummary?: string;
  /** Buyer's Discord handle, if they gave one at checkout. */
  discord?: string;
}

export { PURCHASE_THANK_YOU };

function purchaseText(input: PurchaseEmailInput): string {
  return [
    `${PURCHASE_THANK_YOU}: ${SITE.discordSupportUrl}`,
    "",
    "Order summary",
    `Package: ${input.tierName}`,
    `Paid: ${input.amount} ${input.currency}`,
    input.discountCode ? `Discount code: ${input.discountCode}` : null,
    `Order ID: ${input.orderId}`,
    "",
    `— ${SITE.name}`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function purchaseHtml(input: PurchaseEmailInput): string {
  const rows = [
    ["Package", input.tierName],
    ["Paid", `${input.amount} ${input.currency}`],
    ...(input.discountCode ? [["Discount code", input.discountCode]] : []),
    ["Order ID", input.orderId],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#a9a1c4;font-size:14px">${label}</td>` +
        `<td style="padding:6px 0;color:#f3f0fa;font-size:14px;font-weight:600">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return `<div style="background:#15101f;padding:32px;font-family:Segoe UI,Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#1c1529;border:1px solid #2f2545;border-radius:16px;padding:32px">
    <h1 style="margin:0 0 16px;color:#f3f0fa;font-size:20px">Thanks for your purchase${input.buyerName ? `, ${escapeHtml(input.buyerName)}` : ""}!</h1>
    <p style="margin:0 0 24px;color:#cfc7e6;font-size:15px;line-height:1.6">
      ${PURCHASE_THANK_YOU}:
      <a href="${SITE.discordSupportUrl}" style="color:#b98bff;font-weight:600">${SITE.discordSupportUrl}</a>
    </p>
    <table style="border-collapse:collapse;width:100%">${rows}</table>
    <p style="margin:24px 0 0;color:#8f86ab;font-size:12px">${SITE.name} — ${SITE.url}</p>
  </div>
</div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Receipt to the buyer. */
export async function sendPurchaseEmail(input: PurchaseEmailInput) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({
    from: FROM,
    to: input.buyerEmail,
    subject: `Thanks for your purchase — ${SITE.name}`,
    text: purchaseText(input),
    html: purchaseHtml(input),
  });
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result;
}

export interface BankTransferEmailInput {
  buyerEmail: string;
  tierName: string;
  amount: string;
  currency: string;
  /** Payment reference the buyer quotes on the transfer. */
  reference: string;
  partner: string;
  discountCode?: string;
  /** Human-readable discount line for the owner — see describeDiscount(). */
  discountSummary?: string;
  discord: string;
}

/**
 * Bank transfer receipt. The money hasn't landed yet at this point — a
 * transfer takes hours or days and no bank calls us back — so this confirms
 * the order and tells the buyer exactly what to send, while carrying the same
 * thank-you copy as the PayPal receipt.
 */
export async function sendBankTransferEmail(input: BankTransferEmailInput) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({
    from: FROM,
    to: input.buyerEmail,
    subject: `Your ${SITE.name} order — ${input.reference}`,
    text: [
      `${PURCHASE_THANK_YOU}: ${SITE.discordSupportUrl}`,
      "",
      "To finish your order, send the transfer with these details:",
      `Amount: ${input.amount} ${input.currency}`,
      `Account holder: ${SITE.bank.accountHolder}`,
      `IBAN: ${SITE.bank.iban}`,
      `Payment reference: ${input.reference}  <- put this in the description`,
      "",
      `Package: ${input.tierName}`,
      input.discountCode ? `Discount code: ${input.discountCode}` : null,
      "",
      "We'll confirm as soon as the transfer lands. Transfers usually arrive within one business day.",
      "",
      `— ${SITE.name}`,
    ]
      .filter((line) => line !== null)
      .join("\n"),
  });
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result;
}

/** Heads-up to the owner that a transfer is inbound, so they can watch for it. */
export async function sendBankTransferNotification(
  input: BankTransferEmailInput,
  delivery?: ReceiptDelivery,
  ledger?: LedgerOutcome,
) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({
    from: FROM,
    to: SITE.email,
    replyTo: input.buyerEmail,
    subject: `Bank transfer incoming — ${input.tierName} (${input.amount} ${input.currency}) ${input.reference}`,
    text: [
      `Reference: ${input.reference}`,
      `Package: ${input.tierName}`,
      `Expecting: ${input.amount} ${input.currency}`,
      `Buyer email: ${input.buyerEmail}`,
      `Discord: ${input.discord}`,
      `Discount code used: ${input.discountSummary ?? input.discountCode ?? "none"}`,
      `Partner: ${input.partner}`,
      ...receiptLines(delivery),
      ...ledgerLines(ledger),
      "",
      "Not paid yet — confirm against the bank account, then mark it paid on the dashboard.",
    ].join("\n"),
  });
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result;
}

/** Heads-up to the owner, carrying the partner attribution for commission. */
export async function sendPurchaseNotification(
  input: PurchaseEmailInput,
  delivery?: ReceiptDelivery,
  ledger?: LedgerOutcome,
) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({
    from: FROM,
    to: SITE.email,
    ...(input.buyerEmail ? { replyTo: input.buyerEmail } : {}),
    subject: `New order — ${input.tierName} (${input.amount} ${input.currency})`,
    text: [
      `Package: ${input.tierName}`,
      `Paid: ${input.amount} ${input.currency}`,
      `Buyer: ${input.buyerName || "—"} <${input.buyerEmail || "no email from PayPal"}>`,
      `Discord: ${input.discord || "—"}`,
      `Discount code used: ${input.discountSummary ?? input.discountCode ?? "none"}`,
      `Partner: ${input.partner}`,
      `Order ID: ${input.orderId}`,
      ...receiptLines(delivery),
      ...ledgerLines(ledger),
    ].join("\n"),
  });
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result;
}
