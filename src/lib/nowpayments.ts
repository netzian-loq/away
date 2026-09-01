/**
 * NOWPayments hosted-invoice client — crypto payments that confirm themselves.
 *
 * This is the answer to the thing bank transfer gets wrong. There is no "I've
 * paid" button anywhere in this flow: the buyer is sent to NOWPayments' own
 * hosted invoice page, pays there, and the only thing that can mark the order
 * paid is a signed IPN callback from NOWPayments confirming the blockchain saw
 * the money. Nothing the browser says is trusted, so a buyer who closes the
 * window without paying simply has a pending order.
 *
 * Deliberately mirrors the shape of `stripe.ts` and `paypal.ts` so all three
 * payment paths stay symmetrical: a config error the routes turn into a 503,
 * an API error they turn into a 502, and a `normalize*` function that flattens
 * the provider's payload into the one shape the ledger and emails want.
 *
 * Credentials come from the environment and never from the browser:
 *   NOWPAYMENTS_API_KEY     Settings -> Store settings -> API key
 *   NOWPAYMENTS_IPN_SECRET  Settings -> Instant Payment Notifications
 *
 * Where the money ends up is a dashboard setting, not code: NOWPayments'
 * auto-withdrawal sends settled funds on to an external address, which is
 * where the Kraken deposit address goes. Doing it that way rather than
 * pointing customers at a Kraken deposit address directly keeps merchant
 * traffic off the exchange account — exchanges freeze accounts used for
 * merchant acquiring, and a frozen account holds your funds, not theirs.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const API = "https://api.nowpayments.io/v1";

/** Thrown when the app has no NOWPayments credentials — routes turn this into a 503. */
export class CryptoConfigError extends Error {
  constructor(message = "Crypto payments are not configured.") {
    super(message);
    this.name = "CryptoConfigError";
  }
}

export class CryptoApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CryptoApiError";
  }
}

/** True once invoices can be created — this is what shows the Crypto tab. */
export function isCryptoConfigured(): boolean {
  return Boolean(process.env.NOWPAYMENTS_API_KEY);
}

/**
 * True once IPN callbacks can be verified.
 *
 * Tracked separately from the API key on purpose. Without the IPN secret we
 * can still create invoices but can never confirm one, which would put orders
 * in exactly the unverifiable state this whole module exists to avoid — so
 * `createInvoice` refuses unless both are present.
 */
export function isCryptoIpnConfigured(): boolean {
  return Boolean(process.env.NOWPAYMENTS_IPN_SECRET);
}

interface CreateInvoiceInput {
  /** Price in euros, already discounted. NOWPayments quotes the crypto side. */
  amount: number;
  currency: string;
  /** Our own AWAY-XXXXXX reference. Comes back on the IPN as `order_id`. */
  reference: string;
  /** Shown on the invoice page, e.g. "Away Tweaks — Pro Level". */
  description: string;
  ipnCallbackUrl: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CryptoInvoice {
  id: string;
  /** NOWPayments' hosted page. This is the window the buyer is sent to. */
  invoiceUrl: string;
}

export async function createInvoice(input: CreateInvoiceInput): Promise<CryptoInvoice> {
  const key = process.env.NOWPAYMENTS_API_KEY;
  if (!key) throw new CryptoConfigError();
  if (!isCryptoIpnConfigured()) {
    // Refusing here rather than creating an invoice we could never confirm.
    throw new CryptoConfigError("NOWPAYMENTS_IPN_SECRET is not set — payments could not be confirmed.");
  }

  let response: Response;
  try {
    response = await fetch(`${API}/invoice`, {
      method: "POST",
      headers: { "x-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        price_amount: input.amount,
        price_currency: input.currency.toLowerCase(),
        order_id: input.reference,
        order_description: input.description.slice(0, 500),
        ipn_callback_url: input.ipnCallbackUrl,
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        // The buyer covers the network fee. With this false the fee comes out
        // of the amount sent, so a 58.50 invoice settles short and lands as
        // `partially_paid` — an order that needs a human every single time.
        is_fee_paid_by_user: true,
      }),
    });
  } catch (error) {
    throw new CryptoApiError(
      error instanceof Error ? error.message : "Could not reach NOWPayments.",
      502,
    );
  }

  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  if (!response.ok) {
    const message =
      typeof payload?.message === "string" ? payload.message : "NOWPayments rejected the invoice.";
    // 401/403 mean the key is wrong, which is a configuration problem on our
    // side rather than a provider outage — surfaced as such so it isn't
    // debugged as a flaky API.
    if (response.status === 401 || response.status === 403) throw new CryptoConfigError(message);
    throw new CryptoApiError(message, 502);
  }

  const invoiceUrl = typeof payload?.invoice_url === "string" ? payload.invoice_url : null;
  if (!invoiceUrl) throw new CryptoApiError("NOWPayments returned no invoice URL.", 502);

  return { id: String(payload?.id ?? ""), invoiceUrl };
}

/**
 * The signature NOWPayments puts in `x-nowpayments-sig`.
 *
 * Their documented construction is `JSON.stringify(params,
 * Object.keys(params).sort())` hashed with HMAC-SHA512. That is reproduced
 * literally rather than "cleaned up", because the only thing that matters is
 * matching what their server did.
 *
 * Worth knowing if the payload ever gains nested objects: a replacer ARRAY
 * applies at every level, so nested keys missing from the top-level key list
 * are dropped entirely. Payment IPNs are flat today, so this is exact.
 */
export function ipnSignature(payload: Record<string, unknown>, secret: string): string {
  const sorted = JSON.stringify(payload, Object.keys(payload).sort());
  return createHmac("sha512", secret).update(sorted).digest("hex");
}

/**
 * Verifies an IPN body against the signing secret and returns the parsed
 * payload. The raw request text must be passed through — re-serialising it
 * would reorder keys and invalidate the comparison.
 */
export function verifyIpn(rawBody: string, signature: string | null): Record<string, unknown> {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret) throw new CryptoConfigError();
  if (!signature) throw new CryptoApiError("Missing x-nowpayments-sig header.", 400);

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    throw new CryptoApiError("Malformed IPN payload.", 400);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new CryptoApiError("Malformed IPN payload.", 400);
  }

  const expected = ipnSignature(payload, secret);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  // Length check first: timingSafeEqual throws on a length mismatch rather
  // than returning false.
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new CryptoApiError("Invalid signature.", 400);
  }

  return payload;
}

/**
 * What an IPN means for the order.
 *
 * `paid` is deliberately narrow. NOWPayments reports `confirmed` once the
 * blockchain has the transaction but before the funds are settled and
 * converted, and `finished` once they actually are — only the latter is money
 * you have. `partially_paid` is its own outcome rather than a failure: the
 * buyer did send funds, just not enough, and that needs a person rather than
 * an automatic refusal.
 */
export type CryptoOutcome = "pending" | "paid" | "underpaid" | "failed";

export interface CryptoPayment {
  outcome: CryptoOutcome;
  /** Raw provider status, kept for the owner's email and the logs. */
  status: string;
  paymentId: string;
  /** Our AWAY-XXXXXX reference. */
  reference: string;
  /** Fixed-2 fiat price of the invoice. */
  amount: string;
  currency: string;
  /** What actually arrived, in crypto, and in which coin. */
  actuallyPaid: string;
  payCurrency: string;
}

export function normalizeIpn(payload: Record<string, unknown>): CryptoPayment {
  const status = String(payload.payment_status ?? "unknown").toLowerCase();

  const outcome: CryptoOutcome =
    status === "finished"
      ? "paid"
      : status === "partially_paid"
        ? "underpaid"
        : status === "failed" || status === "expired" || status === "refunded"
          ? "failed"
          : "pending";

  const num = (value: unknown) => {
    const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  return {
    outcome,
    status,
    paymentId: String(payload.payment_id ?? ""),
    reference: String(payload.order_id ?? ""),
    amount: num(payload.price_amount).toFixed(2),
    currency: String(payload.price_currency ?? "").toUpperCase(),
    actuallyPaid: String(payload.actually_paid ?? "0"),
    payCurrency: String(payload.pay_currency ?? "").toUpperCase(),
  };
}
