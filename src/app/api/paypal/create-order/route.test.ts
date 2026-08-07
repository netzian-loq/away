// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const { createPayPalOrder } = vi.hoisted(() => ({
  createPayPalOrder: vi.fn().mockResolvedValue({ id: "ORDER123", status: "CREATED" }),
}));

vi.mock("@/lib/paypal", async () => {
  const actual = await vi.importActual<typeof import("@/lib/paypal")>("@/lib/paypal");
  return { ...actual, createPayPalOrder };
});

import { POST } from "./route";

function post(body: unknown) {
  return new Request("http://localhost/api/paypal/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  createPayPalOrder.mockClear();
});

describe("POST /api/paypal/create-order", () => {
  it("charges the list price when no code is given", async () => {
    const response = await POST(post({ tier: "pro-level" }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ id: "ORDER123", amount: "65.00" });
    expect(createPayPalOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amount: "65.00", currency: "EUR", referenceId: "pro-level", customId: "direct" }),
    );
  });

  it("applies COSMO10 and tags the order for Cosmo", async () => {
    const response = await POST(post({ tier: "pro-level", code: "cosmo10" }));
    await expect(response.json()).resolves.toMatchObject({ amount: "58.50", discountApplied: true });
    expect(createPayPalOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amount: "58.50", customId: "cosmo" }),
    );
  });

  it("sells a single service at its own price, not a bundle price", async () => {
    await POST(post({ tier: "network-tuning" }));
    expect(createPayPalOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: "10.00",
        referenceId: "network-tuning",
        description: "Away Tweaks — Network Tuning",
      }),
    );
  });

  it("applies the partner code to a single service too", async () => {
    await POST(post({ tier: "bios-tuning", code: "COSMO10" }));
    expect(createPayPalOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amount: "10.80", customId: "cosmo" }),
    );
  });

  it("ignores any price the client tries to send", async () => {
    await POST(post({ tier: "extreme-level", price: 1, amount: "1.00", total: 1 }));
    expect(createPayPalOrder).toHaveBeenCalledWith(expect.objectContaining({ amount: "90.00" }));
  });

  it("ignores unknown discount codes instead of trusting them", async () => {
    await POST(post({ tier: "standard", code: "FREESTUFF99" }));
    expect(createPayPalOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amount: "35.00", customId: "direct" }),
    );
  });

  it("rejects an unknown package", async () => {
    const response = await POST(post({ tier: "platinum-deluxe" }));
    expect(response.status).toBe(400);
    expect(createPayPalOrder).not.toHaveBeenCalled();
  });

  it("rejects a malformed body", async () => {
    const response = await POST(post({}));
    expect(response.status).toBe(400);
    expect(createPayPalOrder).not.toHaveBeenCalled();
  });

  it("returns 503 when PayPal credentials are missing", async () => {
    const { PayPalConfigError } = await vi.importActual<typeof import("@/lib/paypal")>("@/lib/paypal");
    createPayPalOrder.mockRejectedValueOnce(new PayPalConfigError());

    const response = await POST(post({ tier: "standard" }));
    expect(response.status).toBe(503);
  });
});
