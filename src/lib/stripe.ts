/**
 * Stripe Checkout client — create a hosted session, read it back, verify
 * webhook signatures. Deliberately mirrors the shape of `paypal.ts` so the two
 * payment paths stay symmetrical: a config error the routes turn into a 503,
 * an API error they turn into a 502, and a `normalize*` function that flattens
 * the provider's payload into the one shape the order ledger and emails want.
 *
 * Credentials come from the environment and never from the browser:
 *   STRIPE_SECRET_KEY      secret — server only (sk_test_… / sk_live_…)
 *   STRIPE_WEBHOOK_SECRET  signing secret for /api/stripe/webhook (whsec_…)
 *
 * Note there is no publishable key: hosted Checkout redirects the buyer to
 * Stripe's own page, so no Stripe JS ever runs on this site.
 */

import Stripe from "stripe";

/**
 * Pinned rather than left to drift with the SDK default, so a `npm update`
 * can't silently change the response shapes this module parses.
 */
const API_VERSION = "2026-07-29.dahlia";

/** Thrown when the app has no Stripe credentials — routes turn this into a 503. */
export class StripeConfigError extends Error {
  constructor() {
    super("Stripe is not configured.");
    this.name = "StripeConfigError";
  }
}

export class StripeApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "StripeApiError";
  }
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** True once webhooks can be verified — without it we must not trust events. */
export function isStripeWebhookConfigured(): boolean {
  return Boolean(process.env.STRIPE_WEBHOOK_SECRET);
}

export function isLive(): boolean {
  return (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_");
}

let cached: Stripe | null = null;
let cachedKey: string | null = null;

/**
 * Lazily constructed so importing this module never throws at build time on a
 * deploy that hasn't set the key yet. Re-created if the key changes, which
 * only matters in tests.
 */
export function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new StripeConfigError();

  if (!cached || cachedKey !== key) {
    cached = new Stripe(key, { apiVersion: API_VERSION });
    cachedKey = key;
  }
  return cached;
}

/**
 * Stripe works in the currency's smallest unit — cents for EUR. Rounding here
 * (rather than truncating) keeps 58.499999 from becoming €58.49 after the
 * float arithmetic in applyDiscount().
 */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

/** Inverse of toMinorUnits, for turning a Stripe amount back into euros. */
export function fromMinorUnits(minor: number): number {
  return Math.round(minor) / 100;
}

interface CreateSessionInput {
  /** Price in euros, already discounted. Converted to cents here. */
  amount: number;
  currency: string;
  /** Shown as the line item on Stripe's page, e.g. "Away Tweaks — Pro Level". */
  productName: string;
  description: string;
  /** Tier slug — read back off the webhook so the receipt can name the package. */
  tierSlug: string;
  /** Partner attribution slug, e.g. "cosmo". */
  partner: string;
  /** Discount code used, or "" at full price. */
  discountCode: string;
  /** Buyer's Discord handle, collected before redirect. Contact info only. */
  discord: string;
  successUrl: string;
  cancelUrl: string;
}

export interface StripeSession {
  id: string;
  /** Where to send the buyer. Null only if Stripe declines to issue one. */
  url: string | null;
}

export async function createCheckoutSession(
  input: CreateSessionInput,
): Promise<StripeSession> {
  const stripe = stripeClient();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Stripe collects this on its own page and it is the address the receipt
      // goes to, so the site never has to ask for an email itself.
      customer_creation: "if_required",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: toMinorUnits(input.amount),
            product_data: {
              name: input.productName,
              description: input.description.slice(0, 500),
            },
          },
        },
      ],
      // Managed Payments is Stripe's merchant-of-record product, and it's on by
      // default on new accounts. It does not apply to this business and must
      // stay off.
      //
      // Its eligibility rules cover *fully automated digital products* and
      // explicitly exclude "professional services, such as consulting,
      // marketing, design, development, or tech support", plus anything
      // "involving human intervention". An Away Tweaks tune is a person doing
      // hands-on work in a booked session — squarely in the excluded category.
      //
      // Leaving it enabled would force us to label these sales with a digital
      // product tax code, which would misdescribe them; Stripe's own rules say
      // that if they later judge a product ineligible, the seller becomes
      // liable for the indirect tax and must stop using Managed Payments.
      // Turning it off here is the accurate answer, not a workaround.
      //
      // See docs.stripe.com/payments/managed-payments/eligibility
      managed_payments: { enabled: false },
      // Metadata is echoed back on the webhook event. Everything the ledger
      // needs travels here so the handler never has to trust the browser.
      metadata: {
        tierSlug: input.tierSlug,
        partner: input.partner,
        discountCode: input.discountCode,
        discord: input.discord,
      },
      // Digital service: no shipping address, and no billing address beyond
      // what the card network requires.
      billing_address_collection: "auto",
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    });

    return { id: session.id, url: session.url };
  } catch (error) {
    throw asStripeApiError(error, "Stripe could not start the checkout.");
  }
}

export interface StripeCheckout {
  sessionId: string;
  /** "complete" once the buyer has paid. */
  status: string;
  /** "paid" | "unpaid" | "no_payment_required". */
  paymentStatus: string;
  /** Fixed-2 string as actually charged. */
  amount: string;
  currency: string;
  tierSlug: string;
  partner: string;
  discountCode: string;
  discord: string;
  buyerEmail: string;
  buyerName: string;
}

/** Reads a session back — used by the success page and the webhook handler. */
export async function retrieveCheckoutSession(sessionId: string): Promise<StripeCheckout> {
  const stripe = stripeClient();

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return normalizeSession(session);
  } catch (error) {
    throw asStripeApiError(error, "Stripe could not load that checkout session.");
  }
}

/**
 * Verifies a webhook payload against the signing secret and returns the event.
 *
 * The raw request body must be passed through byte-for-byte — any re-encoding
 * (including `await request.json()` then re-stringifying) invalidates the
 * signature.
 */
export function constructWebhookEvent(rawBody: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new StripeConfigError();

  // Built outside the try on purpose. stripeClient() throws StripeConfigError
  // when STRIPE_SECRET_KEY is missing, and catching that below would report a
  // configuration problem as "Invalid signature" — sending whoever debugs it
  // hunting for a secret mismatch that doesn't exist.
  const stripe = stripeClient();

  try {
    return stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    // A bad signature is the caller's problem, not ours: 400, never 500.
    throw new StripeApiError(
      error instanceof Error ? error.message : "Invalid webhook signature.",
      400,
    );
  }
}

/**
 * Flattens a Checkout Session into the shape the ledger and emails want.
 *
 * Every money field here comes from Stripe rather than the browser, so the
 * amount and attribution can be trusted. Exported for tests.
 */
export function normalizeSession(session: Stripe.Checkout.Session): StripeCheckout {
  const metadata = session.metadata ?? {};
  const details = session.customer_details;

  return {
    sessionId: session.id,
    status: session.status ?? "unknown",
    paymentStatus: session.payment_status ?? "unpaid",
    amount: fromMinorUnits(session.amount_total ?? 0).toFixed(2),
    currency: (session.currency ?? "").toUpperCase(),
    tierSlug: metadata.tierSlug ?? "",
    partner: metadata.partner || "direct",
    discountCode: metadata.discountCode ?? "",
    discord: metadata.discord ?? "",
    buyerEmail: details?.email ?? session.customer_email ?? "",
    buyerName: details?.name ?? "",
  };
}

/**
 * Maps a thrown Stripe SDK error onto our own error type.
 *
 * StripeConfigError can't reach here — `stripeClient()` is called outside the
 * try block in every caller precisely so a missing key surfaces as a 503
 * rather than being flattened into a 502 "API failed".
 */
function asStripeApiError(error: unknown, fallback: string): StripeApiError {
  if (error instanceof Stripe.errors.StripeError) {
    return new StripeApiError(error.message || fallback, error.statusCode ?? 502);
  }
  return new StripeApiError(fallback, 502);
}
