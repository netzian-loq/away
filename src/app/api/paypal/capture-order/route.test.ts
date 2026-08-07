// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const { capturePayPalOrder, sendPurchaseEmail, sendPurchaseNotification, recordOrder } = vi.hoisted(
  () => ({
    capturePayPalOrder: vi.fn(),
    sendPurchaseEmail: vi.fn().mockResolvedValue({}),
    sendPurchaseNotification: vi.fn().mockResolvedValue({}),
    recordOrder: vi.fn().mockResolvedValue({ recorded: true }),
  }),
);

// Mocked so the suite never writes to the real orders folder on disk.
vi.mock("@/lib/orders/record", () => ({ recordOrder }));

vi.mock("@/lib/paypal", async () => {
  const actual = await vi.importActual<typeof import("@/lib/paypal")>("@/lib/paypal");
  return { ...actual, capturePayPalOrder };
});
vi.mock("@/lib/email", () => ({ sendPurchaseEmail, sendPurchaseNotification }));

import { POST } from "./route";

const COMPLETED = {
  orderId: "ORDER123",
  status: "COMPLETED",
  amount: "58.50",
  currency: "EUR",
  tierSlug: "pro-level",
  partner: "cosmo",
  buyerEmail: "grinder@example.com",
  buyerName: "Luca Rossi",
};

function post(body: unknown) {
  return new Request("http://localhost/api/paypal/capture-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  capturePayPalOrder.mockResolvedValue(COMPLETED);
  sendPurchaseEmail.mockResolvedValue({});
  sendPurchaseNotification.mockResolvedValue({});
  recordOrder.mockResolvedValue({ recorded: true });
});

describe("POST /api/paypal/capture-order", () => {
  it("captures the payment and returns the receipt", async () => {
    const response = await POST(post({ orderId: "ORDER123", discord: "luca" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "COMPLETED",
      orderId: "ORDER123",
      amount: "58.50",
      tierName: "Pro Level",
    });
  });

  it("emails the buyer the receipt and the owner the notification", async () => {
    await POST(post({ orderId: "ORDER123", discord: "luca" }));

    expect(sendPurchaseEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        buyerEmail: "grinder@example.com",
        tierName: "Pro Level",
        amount: "58.50",
        discountCode: "COSMO10",
      }),
    );
    expect(sendPurchaseNotification).toHaveBeenCalledWith(
      expect.objectContaining({ partner: "cosmo", discord: "luca" }),
      expect.anything(),
      expect.anything(),
    );
  });

  it("spells out which discount code was used, or that there wasn't one", async () => {
    await POST(post({ orderId: "ORDER123" }));
    expect(sendPurchaseNotification).toHaveBeenCalledWith(
      expect.objectContaining({ discountSummary: "COSMO10 — 10% off (Cosmo eSports)" }),
      expect.anything(),
      expect.anything(),
    );

    vi.clearAllMocks();
    capturePayPalOrder.mockResolvedValueOnce({ ...COMPLETED, partner: "direct" });
    await POST(post({ orderId: "ORDER123" }));
    expect(sendPurchaseNotification).toHaveBeenCalledWith(
      expect.objectContaining({ discountSummary: "none — paid full price" }),
      expect.anything(),
      expect.anything(),
    );
  });

  it("tells the owner whether the buyer's receipt actually landed", async () => {
    await POST(post({ orderId: "ORDER123" }));
    expect(sendPurchaseNotification).toHaveBeenCalledWith(
      expect.anything(),
      { delivered: true, to: "grinder@example.com" },
      expect.anything(),
    );

    vi.clearAllMocks();
    sendPurchaseEmail.mockRejectedValueOnce(new Error("domain not verified"));
    await POST(post({ orderId: "ORDER123" }));
    expect(sendPurchaseNotification).toHaveBeenCalledWith(
      expect.anything(),
      { delivered: false, to: "grinder@example.com", error: "domain not verified" },
      expect.anything(),
    );
  });

  it("still succeeds when PayPal gives no payer email to write to", async () => {
    capturePayPalOrder.mockResolvedValueOnce({ ...COMPLETED, buyerEmail: "" });

    const response = await POST(post({ orderId: "ORDER123" }));
    expect(response.status).toBe(200);
    expect(sendPurchaseEmail).not.toHaveBeenCalled();
    expect(sendPurchaseNotification).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ delivered: false }),
      expect.anything(),
    );
  });

  it("records a captured payment as paid, with the partner's commission", async () => {
    await POST(post({ orderId: "ORDER123", discord: "luca" }));
    expect(recordOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "ORDER123",
        source: "paypal",
        status: "paid",
        amount: "58.50",
        partner: "cosmo",
        discountCode: "COSMO10",
        buyerEmail: "grinder@example.com",
      }),
    );
  });

  it("still confirms the payment when the ledger can't be written", async () => {
    recordOrder.mockResolvedValueOnce({ recorded: false, error: "EROFS: read-only file system" });

    const response = await POST(post({ orderId: "ORDER123" }));
    expect(response.status).toBe(200);
    expect(sendPurchaseNotification).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      recorded: false,
      error: "EROFS: read-only file system",
    });
  });

  it("uses the amount PayPal reports, not anything the client sent", async () => {
    await POST(post({ orderId: "ORDER123", amount: "0.01", tier: "extreme-level" }));
    expect(sendPurchaseEmail).toHaveBeenCalledWith(expect.objectContaining({ amount: "58.50" }));
  });

  it("still reports success when the receipt email fails", async () => {
    sendPurchaseEmail.mockRejectedValueOnce(new Error("domain not verified"));

    const response = await POST(post({ orderId: "ORDER123" }));
    expect(response.status).toBe(200);
  });

  it("reports a payment that PayPal did not complete", async () => {
    capturePayPalOrder.mockResolvedValueOnce({ ...COMPLETED, status: "PENDING" });

    const response = await POST(post({ orderId: "ORDER123" }));
    expect(response.status).toBe(402);
    expect(sendPurchaseEmail).not.toHaveBeenCalled();
  });

  it("rejects a malformed body", async () => {
    const response = await POST(post({}));
    expect(response.status).toBe(400);
    expect(capturePayPalOrder).not.toHaveBeenCalled();
  });
});
