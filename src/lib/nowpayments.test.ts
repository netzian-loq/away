import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import {
  CryptoApiError,
  CryptoConfigError,
  ipnSignature,
  isCryptoConfigured,
  isCryptoIpnConfigured,
  normalizeIpn,
  verifyIpn,
} from "./nowpayments";

const ORIGINAL = { ...process.env };
const SECRET = "ipn_secret_for_tests";

/** A payment IPN, in the shape NOWPayments documents. */
function ipn(overrides: Record<string, unknown> = {}) {
  return {
    payment_id: 5524759814,
    payment_status: "finished",
    pay_address: "TNDFkiSmBQorNFacb3735q8MnT29sn8BLn",
    price_amount: 58.5,
    price_currency: "eur",
    pay_amount: 165.652609,
    actually_paid: 165.652609,
    pay_currency: "trx",
    order_id: "AWAY-K7P2QM",
    order_description: "Away Tweaks — Pro Level",
    purchase_id: "4944856743",
    created_at: "2026-09-01T14:30:43.306Z",
    updated_at: "2026-09-01T14:40:46.523Z",
    ...overrides,
  };
}

function sign(payload: Record<string, unknown>, secret = SECRET) {
  return ipnSignature(payload, secret);
}

beforeEach(() => {
  delete process.env.NOWPAYMENTS_API_KEY;
  process.env.NOWPAYMENTS_IPN_SECRET = SECRET;
});

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("configuration guards", () => {
  it("reports crypto as off until an API key is set", () => {
    expect(isCryptoConfigured()).toBe(false);
    process.env.NOWPAYMENTS_API_KEY = "np_key";
    expect(isCryptoConfigured()).toBe(true);
  });

  it("tracks the IPN secret separately from the API key", () => {
    delete process.env.NOWPAYMENTS_IPN_SECRET;
    expect(isCryptoIpnConfigured()).toBe(false);
    process.env.NOWPAYMENTS_IPN_SECRET = SECRET;
    expect(isCryptoIpnConfigured()).toBe(true);
  });
});

describe("IPN signature", () => {
  // Pinned against an independent HMAC of the documented construction rather
  // than against our own helper, so a change to how the body is serialised
  // fails here instead of silently agreeing with itself.
  it("matches NOWPayments' documented sorted-key HMAC-SHA512", () => {
    const payload = ipn();
    const expected = createHmac("sha512", SECRET)
      .update(JSON.stringify(payload, Object.keys(payload).sort()))
      .digest("hex");
    expect(sign(payload)).toBe(expected);
  });

  it("is independent of the key order the body arrived in", () => {
    const a = { order_id: "AWAY-K7P2QM", payment_status: "finished", price_amount: 58.5 };
    const b = { price_amount: 58.5, order_id: "AWAY-K7P2QM", payment_status: "finished" };
    expect(sign(a)).toBe(sign(b));
  });

  it("accepts a correctly signed body and returns it parsed", () => {
    const payload = ipn();
    const body = JSON.stringify(payload);
    expect(verifyIpn(body, sign(payload))).toMatchObject({ order_id: "AWAY-K7P2QM" });
  });

  // The attack this whole module exists to stop: anyone can POST to the
  // webhook, so an unsigned or wrongly signed body must never be able to mark
  // an order paid.
  it("rejects a body signed with the wrong secret", () => {
    const payload = ipn();
    expect(() => verifyIpn(JSON.stringify(payload), sign(payload, "wrong"))).toThrow(CryptoApiError);
  });

  it("rejects a tampered amount even with an otherwise valid signature", () => {
    const payload = ipn();
    const signature = sign(payload);
    const tampered = JSON.stringify({ ...payload, price_amount: 1 });
    expect(() => verifyIpn(tampered, signature)).toThrow(/Invalid signature/);
  });

  it("rejects a missing signature header", () => {
    expect(() => verifyIpn(JSON.stringify(ipn()), null)).toThrow(/Missing/);
  });

  it("rejects malformed JSON and bare arrays", () => {
    expect(() => verifyIpn("{not json", "abc")).toThrow(/Malformed/);
    expect(() => verifyIpn("[1,2,3]", "abc")).toThrow(/Malformed/);
  });

  it("refuses to verify at all when no secret is configured", () => {
    delete process.env.NOWPAYMENTS_IPN_SECRET;
    const payload = ipn();
    expect(() => verifyIpn(JSON.stringify(payload), sign(payload))).toThrow(CryptoConfigError);
  });
});

describe("status mapping", () => {
  it("treats only `finished` as money you actually have", () => {
    expect(normalizeIpn(ipn({ payment_status: "finished" })).outcome).toBe("paid");
    // `confirmed` is on-chain but not yet settled and converted — crediting it
    // would mark orders paid against funds that can still fail to arrive.
    expect(normalizeIpn(ipn({ payment_status: "confirmed" })).outcome).toBe("pending");
    expect(normalizeIpn(ipn({ payment_status: "waiting" })).outcome).toBe("pending");
    expect(normalizeIpn(ipn({ payment_status: "confirming" })).outcome).toBe("pending");
    expect(normalizeIpn(ipn({ payment_status: "sending" })).outcome).toBe("pending");
  });

  it("keeps partial payment distinct from failure", () => {
    expect(normalizeIpn(ipn({ payment_status: "partially_paid" })).outcome).toBe("underpaid");
  });

  it("maps the dead ends to failed", () => {
    for (const status of ["failed", "expired", "refunded"]) {
      expect(normalizeIpn(ipn({ payment_status: status })).outcome).toBe("failed");
    }
  });

  it("treats an unrecognised status as pending, never as paid", () => {
    expect(normalizeIpn(ipn({ payment_status: "something_new" })).outcome).toBe("pending");
  });

  it("flattens the payload onto our own reference and fiat amount", () => {
    const payment = normalizeIpn(ipn());
    expect(payment.reference).toBe("AWAY-K7P2QM");
    expect(payment.amount).toBe("58.50");
    expect(payment.currency).toBe("EUR");
    expect(payment.payCurrency).toBe("TRX");
    expect(payment.paymentId).toBe("5524759814");
  });

  it("survives a payload with fields missing", () => {
    const payment = normalizeIpn({});
    expect(payment.outcome).toBe("pending");
    expect(payment.reference).toBe("");
    expect(payment.amount).toBe("0.00");
  });
});
