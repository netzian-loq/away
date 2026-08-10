// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import type Stripe from "stripe";

const {
  constructWebhookEvent,
  listOrders,
  recordOrder,
  sendPurchaseEmail,
  sendPurchaseNotification,
} = vi.hoisted(() => ({
  constructWebhookEvent: vi.fn(),
  listOrders: vi.fn().mockResolvedValue([]),
  recordOrder: vi.fn().mockResolvedValue({ recorded: true }),
  sendPurchaseEmail: vi.fn().mockResolvedValue({}),
  sendPurchaseNotification: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/stripe", async () => {
  const actual = await vi.importActual<typeof import("@/lib/stripe")>("@/lib/stripe");
  return { ...actual, constructWebhookEvent };
});
vi.mock("@/lib/orders/store", () => ({ listOrders }));
vi.mock("@/lib/orders/record", () => ({ recordOrder }));
vi.mock("@/lib/email", () => ({ sendPurchaseEmail, sendPurchaseNotification }));

import { POST } from "./route";
import { StripeApiError, StripeConfigError } from "@/lib/stripe";

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: "cs_test_1",
    status: "complete",
    payment_status: "paid",
    amount_total: 5850,
    currency: "eur",
    customer_details: { email: "grinder@example.com", name: "Luca Rossi" },
    metadata: {
      tierSlug: "pro-level",
      partner: "cosmo",
      discountCode: "COSMO10",
      discord: "luca",
    },
    ...overrides,
  };
}

function event(object: Record<string, unknown>, type = "checkout.session.completed") {
  return { id: "evt_1", type, data: { object } } as unknown as Stripe.Event;
}

function post(signature: string | null = "t=1,v1=abc") {
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: signature ? { "stripe-signature": signature } : {},
    body: JSON.stringify({ id: "evt_1" }),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  listOrders.mockResolvedValue([]);
  recordOrder.mockResolvedValue({ recorded: true });
  sendPurchaseEmail.mockResolvedValue({});
  sendPurchaseNotification.mockResolvedValue({});
  constructWebhookEvent.mockReturnValue(event(session()));
});

describe("signature verification", () => {
  it("refuses an unsigned request without touching the ledger", async () => {
    const response = await POST(post(null));

    expect(response.status).toBe(400);
    expect(constructWebhookEvent).not.toHaveBeenCalled();
    expect(recordOrder).not.toHaveBeenCalled();
  });

  it("refuses a bad signature — an unverified body is attacker-controlled", async () => {
    constructWebhookEvent.mockImplementationOnce(() => {
      throw new StripeApiError("No signatures found matching the expected signature", 400);
    });

    const response = await POST(post());

    expect(response.status).toBe(400);
    expect(recordOrder).not.toHaveBeenCalled();
    expect(sendPurchaseEmail).not.toHaveBeenCalled();
  });

  it("refuses everything when no signing secret is configured", async () => {
    constructWebhookEvent.mockImplementationOnce(() => {
      throw new StripeConfigError();
    });

    const response = await POST(post());

    expect(response.status).toBe(503);
    expect(recordOrder).not.toHaveBeenCalled();
  });

  it("verifies against the raw body, not a re-serialised copy", async () => {
    await POST(post());
    const [rawBody, signature] = constructWebhookEvent.mock.calls[0];
    expect(rawBody).toBe(JSON.stringify({ id: "evt_1" }));
    expect(signature).toBe("t=1,v1=abc");
  });
});

describe("checkout.session.completed", () => {
  it("records the sale as paid, with the amount Stripe reported", async () => {
    const response = await POST(post());

    expect(response.status).toBe(200);
    expect(recordOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "cs_test_1",
        source: "stripe",
        status: "paid",
        tierSlug: "pro-level",
        tierName: "Pro Level",
        amount: "58.50",
        currency: "EUR",
        partner: "cosmo",
        discountCode: "COSMO10",
        buyerEmail: "grinder@example.com",
        discord: "luca",
      }),
    );
  });

  it("emails the buyer their receipt and the owner a notification", async () => {
    await POST(post());

    expect(sendPurchaseEmail).toHaveBeenCalledWith(
      expect.objectContaining({ buyerEmail: "grinder@example.com", source: "Stripe" }),
    );
    expect(sendPurchaseNotification).toHaveBeenCalledWith(
      expect.objectContaining({ tierName: "Pro Level" }),
      expect.objectContaining({ delivered: true }),
      { recorded: true },
    );
  });

  it("ignores unrelated event types instead of retrying forever", async () => {
    constructWebhookEvent.mockReturnValueOnce(event(session(), "payment_intent.succeeded"));

    const response = await POST(post());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ignored: "payment_intent.succeeded" });
    expect(recordOrder).not.toHaveBeenCalled();
  });

  it("does not record a session whose payment hasn't cleared", async () => {
    constructWebhookEvent.mockReturnValueOnce(event(session({ payment_status: "unpaid" })));

    const response = await POST(post());

    expect(response.status).toBe(200);
    expect(recordOrder).not.toHaveBeenCalled();
    expect(sendPurchaseEmail).not.toHaveBeenCalled();
  });
});

describe("idempotency", () => {
  it("does not double-email when Stripe redelivers the same event", async () => {
    listOrders.mockResolvedValue([{ id: "cs_test_1" }]);

    const response = await POST(post());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ duplicate: true });
    expect(recordOrder).not.toHaveBeenCalled();
    expect(sendPurchaseEmail).not.toHaveBeenCalled();
  });

  it("still processes a genuinely new session when others exist", async () => {
    listOrders.mockResolvedValue([{ id: "cs_test_OTHER" }]);

    await POST(post());

    expect(recordOrder).toHaveBeenCalled();
  });

  it("processes the order anyway if the ledger can't be read", async () => {
    listOrders.mockRejectedValue(new Error("EROFS: read-only file system"));

    const response = await POST(post());

    expect(response.status).toBe(200);
    expect(recordOrder).toHaveBeenCalled();
  });
});

describe("failures after the money has moved", () => {
  // The payment succeeded. Returning non-2xx would make Stripe retry and
  // duplicate the mail, so every one of these still has to answer 200.
  it("reports the failed receipt to the owner instead of dropping it", async () => {
    sendPurchaseEmail.mockRejectedValueOnce(new Error("domain not verified"));

    const response = await POST(post());

    expect(response.status).toBe(200);
    expect(sendPurchaseNotification).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ delivered: false, error: "domain not verified" }),
      expect.anything(),
    );
  });

  it("flags a session that arrived with no buyer email", async () => {
    constructWebhookEvent.mockReturnValueOnce(
      event(session({ customer_details: null, customer_email: null })),
    );

    const response = await POST(post());

    expect(response.status).toBe(200);
    expect(sendPurchaseEmail).not.toHaveBeenCalled();
    expect(sendPurchaseNotification).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ delivered: false }),
      expect.anything(),
    );
  });

  it("still acknowledges when the ledger write fails", async () => {
    recordOrder.mockResolvedValueOnce({ recorded: false, error: "EROFS" });

    const response = await POST(post());

    expect(response.status).toBe(200);
    expect(sendPurchaseNotification).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { recorded: false, error: "EROFS" },
    );
  });

  it("still acknowledges when the owner notification itself fails", async () => {
    sendPurchaseNotification.mockRejectedValueOnce(new Error("Resend down"));

    const response = await POST(post());

    expect(response.status).toBe(200);
  });
});
