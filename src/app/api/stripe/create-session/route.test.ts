// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const { createCheckoutSession } = vi.hoisted(() => ({
  createCheckoutSession: vi.fn().mockResolvedValue({
    id: "cs_test_1",
    url: "https://checkout.stripe.com/c/pay/cs_test_1",
  }),
}));

vi.mock("@/lib/stripe", async () => {
  const actual = await vi.importActual<typeof import("@/lib/stripe")>("@/lib/stripe");
  return { ...actual, createCheckoutSession };
});

import { POST } from "./route";
import { StripeApiError, StripeConfigError } from "@/lib/stripe";

function post(body: unknown, origin = "http://localhost:3000") {
  return new Request(`${origin}/api/stripe/create-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  createCheckoutSession.mockClear();
  createCheckoutSession.mockResolvedValue({
    id: "cs_test_1",
    url: "https://checkout.stripe.com/c/pay/cs_test_1",
  });
});

describe("POST /api/stripe/create-session", () => {
  it("charges the list price when no code is given", async () => {
    const response = await POST(post({ tier: "pro-level" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      url: "https://checkout.stripe.com/c/pay/cs_test_1",
    });
    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 65,
        currency: "EUR",
        tierSlug: "pro-level",
        partner: "direct",
        discountCode: "",
      }),
    );
  });

  it("applies COSMO10 and tags the session for Cosmo", async () => {
    await POST(post({ tier: "pro-level", code: "cosmo10" }));

    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 58.5, partner: "cosmo", discountCode: "COSMO10" }),
    );
  });

  // The whole point of deriving from the catalog: a tampered body can't
  // buy a €65 tune for €1.
  it("ignores any price the browser tries to send", async () => {
    await POST(post({ tier: "pro-level", amount: 1, price: 1, unit_amount: 100 }));
    expect(createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({ amount: 65 }));
  });

  it("rejects an unknown package", async () => {
    const response = await POST(post({ tier: "not-a-package" }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unknown package." });
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("rejects a body with no package at all", async () => {
    const response = await POST(post({}));
    expect(response.status).toBe(400);
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("carries the Discord handle through as metadata", async () => {
    await POST(post({ tier: "pro-level", discord: "luca" }));
    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ discord: "luca" }),
    );
  });

  it("returns the buyer to the origin they came from, not to production", async () => {
    await POST(post({ tier: "pro-level" }, "http://localhost:3000"));

    const { successUrl, cancelUrl } = createCheckoutSession.mock.calls[0][0];
    expect(successUrl).toBe(
      "http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}",
    );
    expect(cancelUrl).toBe("http://localhost:3000/checkout?item=pro-level");
  });

  it("sends a cancelling buyer back with their partner code intact", async () => {
    await POST(post({ tier: "pro-level", code: "COSMO10" }));

    const { cancelUrl } = createCheckoutSession.mock.calls[0][0];
    expect(cancelUrl).toContain("item=pro-level");
    expect(cancelUrl).toContain("code=COSMO10");
  });

  it("reports 503, not 500, when Stripe isn't configured", async () => {
    createCheckoutSession.mockRejectedValueOnce(new StripeConfigError());

    const response = await POST(post({ tier: "pro-level" }));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Card payments aren't switched on yet.",
    });
  });

  it("reports 502 when Stripe itself fails", async () => {
    createCheckoutSession.mockRejectedValueOnce(new StripeApiError("Stripe is down", 500));

    const response = await POST(post({ tier: "pro-level" }));
    expect(response.status).toBe(502);
  });

  it("fails rather than redirecting nowhere if Stripe returns no URL", async () => {
    createCheckoutSession.mockResolvedValueOnce({ id: "cs_test_2", url: null });

    const response = await POST(post({ tier: "pro-level" }));
    expect(response.status).toBe(502);
  });
});
