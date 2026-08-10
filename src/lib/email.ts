import { Resend } from "resend";
import { SITE } from "@/content/site";
import { PURCHASE_THANK_YOU } from "@/lib/email-copy";

/**
 * Sender address. `onboarding@resend.dev` is Resend's shared sandbox sender —
 * it can only deliver to the account owner's own address, which is fine for
 * mail addressed to the owner but NOT for buyer receipts. Set RESEND_FROM to
 * an address on a domain verified in Resend before taking real payments.
 *
 * Read per call rather than captured at module load, so the value can't be
 * frozen by whatever the environment happened to look like on first import.
 */
function from(): string {
  return process.env.RESEND_FROM || `${SITE.name} <onboarding@resend.dev>`;
}

/** True once receipts can actually reach buyers, not just the owner's inbox. */
export function isSenderVerified(): boolean {
  return Boolean(process.env.RESEND_FROM);
}

/** Thrown when RESEND_API_KEY is missing, instead of Resend's opaque failure. */
export class EmailConfigError extends Error {
  constructor() {
    super("RESEND_API_KEY is not set — no mail can be sent.");
    this.name = "EmailConfigError";
  }
}

/**
 * One place that constructs the client, so a missing key fails the same
 * recognisable way everywhere rather than five subtly different ways.
 */
function client(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new EmailConfigError();
  return new Resend(key);
}

/** Sends and turns Resend's `{ error }` result into a thrown error. */
async function send(payload: Parameters<Resend["emails"]["send"]>[0]) {
  const result = await client().emails.send(payload);
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result;
}

export interface ContactEmailInput {
  name: string;
  discord: string;
  specs?: string;
  message: string;
}

export async function sendContactEmail(input: ContactEmailInput) {
  const { name, discord, specs, message } = input;
  return send({
    // Was pinned to the sandbox sender and a hardcoded recipient, so setting
    // RESEND_FROM fixed receipts but silently left the contact form behind.
    from: from(),
    to: SITE.email,
    subject: `Away Tweaks Request — ${name}`,
    text: `Name: ${name}\nDiscord: ${discord}\nPC Specs: ${specs || "—"}\n\nMessage:\n${message}`,
  });
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
  /** Payer email from the provider — where the receipt goes. */
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
  /** Which provider took the money — "PayPal" or "Stripe". Owner mail only. */
  source?: string;
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

/**
 * HTML twin of the bank transfer text body. Worth having despite the extra
 * code: this mail carries an IBAN and a payment reference the buyer has to
 * copy exactly, and a monospaced, visually separated block is far harder to
 * mis-transcribe than a line of wrapped plain text.
 */
function bankTransferHtml(input: BankTransferEmailInput): string {
  const rows = [
    ["Amount", `${input.amount} ${input.currency}`],
    ["Account holder", SITE.bank.accountHolder],
    ["IBAN", SITE.bank.iban],
    ["Payment reference", input.reference],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#a9a1c4;font-size:14px;white-space:nowrap">${label}</td>` +
        `<td style="padding:6px 0;color:#f3f0fa;font-size:14px;font-weight:600;font-family:Consolas,Menlo,monospace">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return `<div style="background:#15101f;padding:32px;font-family:Segoe UI,Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#1c1529;border:1px solid #2f2545;border-radius:16px;padding:32px">
    <h1 style="margin:0 0 16px;color:#f3f0fa;font-size:20px">Your ${escapeHtml(SITE.name)} order</h1>
    <p style="margin:0 0 24px;color:#cfc7e6;font-size:15px;line-height:1.6">
      ${PURCHASE_THANK_YOU}:
      <a href="${SITE.discordSupportUrl}" style="color:#b98bff;font-weight:600">${SITE.discordSupportUrl}</a>
    </p>
    <p style="margin:0 0 12px;color:#cfc7e6;font-size:15px">To finish your order, send the transfer with these details:</p>
    <table style="border-collapse:collapse;width:100%">${rows}</table>
    <p style="margin:16px 0 0;color:#ffcf7a;font-size:13px;line-height:1.6">
      Put <strong style="font-family:Consolas,Menlo,monospace">${escapeHtml(input.reference)}</strong>
      in the transfer description — it's how we match your payment to your order.
    </p>
    <p style="margin:20px 0 0;color:#cfc7e6;font-size:14px;line-height:1.6">
      Package: <strong style="color:#f3f0fa">${escapeHtml(input.tierName)}</strong>${
        input.discountCode
          ? `<br>Discount code: <strong style="color:#f3f0fa">${escapeHtml(input.discountCode)}</strong>`
          : ""
      }
    </p>
    <p style="margin:20px 0 0;color:#8f86ab;font-size:13px;line-height:1.6">
      We'll confirm as soon as the transfer lands. Transfers usually arrive within one business day.
    </p>
    <p style="margin:24px 0 0;color:#8f86ab;font-size:12px">${escapeHtml(SITE.name)} — ${SITE.url}</p>
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
  return send({
    from: from(),
    to: input.buyerEmail,
    subject: `Thanks for your purchase — ${SITE.name}`,
    text: purchaseText(input),
    html: purchaseHtml(input),
  });
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
  return send({
    from: from(),
    to: input.buyerEmail,
    subject: `Your ${SITE.name} order — ${input.reference}`,
    html: bankTransferHtml(input),
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
}

/** Heads-up to the owner that a transfer is inbound, so they can watch for it. */
export async function sendBankTransferNotification(
  input: BankTransferEmailInput,
  delivery?: ReceiptDelivery,
  ledger?: LedgerOutcome,
) {
  return send({
    from: from(),
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
}

/** Heads-up to the owner, carrying the partner attribution for commission. */
export async function sendPurchaseNotification(
  input: PurchaseEmailInput,
  delivery?: ReceiptDelivery,
  ledger?: LedgerOutcome,
) {
  const provider = input.source ?? "the payment provider";
  return send({
    from: from(),
    to: SITE.email,
    ...(input.buyerEmail ? { replyTo: input.buyerEmail } : {}),
    subject: `New order — ${input.tierName} (${input.amount} ${input.currency})`,
    text: [
      `Package: ${input.tierName}`,
      `Paid: ${input.amount} ${input.currency}`,
      ...(input.source ? [`Paid via: ${input.source}`] : []),
      `Buyer: ${input.buyerName || "—"} <${input.buyerEmail || `no email from ${provider}`}>`,
      `Discord: ${input.discord || "—"}`,
      `Discount code used: ${input.discountSummary ?? input.discountCode ?? "none"}`,
      `Partner: ${input.partner}`,
      `Order ID: ${input.orderId}`,
      ...receiptLines(delivery),
      ...ledgerLines(ledger),
    ].join("\n"),
  });
}
