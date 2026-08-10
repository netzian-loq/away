import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type Stripe from "stripe";
import {
  fromMinorUnits,
  isLive,
  isStripeConfigured,
  isStripeWebhookConfigured,
  normalizeSession,
  StripeConfigError,
  stripeClient,
  toMinorUnits,
} from "./stripe";

const ORIGINAL = { ...process.env };

beforeEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
});

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("configuration guards", () => {
  it("reports Stripe as off until a secret key is set", () => {
    expect(isStripeConfigured()).toBe(false);
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    expect(isStripeConfigured()).toBe(true);
  });

  it("tracks the webhook secret separately from the API key", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    expect(isStripeWebhookConfigured()).toBe(false);
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_123";
    expect(isStripeWebhookConfigured()).toBe(true);
  });

  it("only calls itself live for an sk_live_ key", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    expect(isLive()).toBe(false);
    process.env.STRIPE_SECRET_KEY = "sk_live_123";
    expect(isLive()).toBe(true);
  });

  it("throws a typed config error rather than constructing a keyless client", () => {
    expect(() => stripeClient()).toThrow(StripeConfigError);
  });
});

describe("minor units", () => {
  it("converts euros to whole cents", () => {
    expect(toMinorUnits(58.5)).toBe(5850);
    expect(toMinorUnits(35)).toBe(3500);
  });

  it("rounds rather than truncates, so float drift can't shave a cent", () => {
    // 65 * (1 - 10/100) lands on 58.500000000000007 in IEEE-754; truncating
    // the *100 would bill 5850 here but 5849 for a neighbouring price.
    expect(toMinorUnits(65 * (1 - 10 / 100))).toBe(5850);
    // 52.999 * 100 === 5299.900000000001 — must bill 53.00, not 52.99.
    expect(toMinorUnits(52.999)).toBe(5300);
  });

  it("round-trips back to euros", () => {
    expect(fromMinorUnits(5850)).toBe(58.5);
    expect(fromMinorUnits(toMinorUnits(52))).toBe(52);
  });
});

/** Minimal stand-in for the fields normalizeSession actually reads. */
function session(overrides: Partial<Stripe.Checkout.Session> = {}) {
  return {
    id: "cs_test_1",
    status: "complete",
    payment_status: "paid",
    amount_total: 5850,
    currency: "eur",
    customer_email: null,
    customer_details: { email: "grinder@example.com", name: "Luca Rossi" },
    metadata: {
      tierSlug: "pro-level",
      partner: "cosmo",
      discountCode: "COSMO10",
      discord: "luca",
    },
    ...overrides,
  } as unknown as Stripe.Checkout.Session;
}

describe("normalizeSession", () => {
  it("flattens a paid session into the shape the ledger wants", () => {
    expect(normalizeSession(session())).toEqual({
      sessionId: "cs_test_1",
      status: "complete",
      paymentStatus: "paid",
      amount: "58.50",
      currency: "EUR",
      tierSlug: "pro-level",
      partner: "cosmo",
      discountCode: "COSMO10",
      discord: "luca",
      buyerEmail: "grinder@example.com",
      buyerName: "Luca Rossi",
    });
  });

  it("reads the amount back from Stripe, not from the browser", () => {
    expect(normalizeSession(session({ amount_total: 3500 })).amount).toBe("35.00");
  });

  it("falls back to 'direct' when no partner was attributed", () => {
    const bare = session({ metadata: { tierSlug: "standard" } as Stripe.Metadata });
    const result = normalizeSession(bare);
    expect(result.partner).toBe("direct");
    expect(result.discountCode).toBe("");
    expect(result.discord).toBe("");
  });

  it("falls back to customer_email when Stripe collected no details block", () => {
    const bare = session({ customer_details: null, customer_email: "fallback@example.com" });
    expect(normalizeSession(bare).buyerEmail).toBe("fallback@example.com");
  });

  it("carries an unpaid status through instead of assuming success", () => {
    const unpaid = session({ payment_status: "unpaid" });
    expect(normalizeSession(unpaid).paymentStatus).toBe("unpaid");
  });

  it("survives a session with nothing populated", () => {
    const empty = { id: "cs_test_2" } as Stripe.Checkout.Session;
    const result = normalizeSession(empty);
    expect(result.amount).toBe("0.00");
    expect(result.currency).toBe("");
    expect(result.partner).toBe("direct");
    expect(result.buyerEmail).toBe("");
  });
});
