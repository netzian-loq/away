// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { headers } = vi.hoisted(() => ({ headers: vi.fn() }));
vi.mock("next/headers", () => ({ headers }));

/** `cache()` memoises per request; each test needs a fresh module. */
async function resolve(country: string | null, rateBody?: unknown, ok = true) {
  vi.resetModules();
  headers.mockResolvedValue({ get: () => country });
  if (rateBody !== undefined) {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok, json: async () => rateBody }),
    );
  }
  const fresh = await import("./currency.server");
  return fresh.getDisplayCurrency();
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getDisplayCurrency", () => {
  it("shows euros to everyone outside the dollar countries", async () => {
    await expect(resolve("IT")).resolves.toEqual({ code: "EUR", rate: 1 });
    await expect(resolve("GB")).resolves.toEqual({ code: "EUR", rate: 1 });
  });

  it("shows dollars in the US, at the day's rate", async () => {
    const currency = await resolve("US", { rates: { USD: 1.146 } });
    expect(currency).toEqual({ code: "USD", rate: 1.146 });
  });

  it("matches the country case-insensitively", async () => {
    const currency = await resolve("us", { rates: { USD: 1.146 } });
    expect(currency.code).toBe("USD");
  });

  /** No header at all is the local and statically-rendered case. */
  it("falls back to euros when the geo header is missing", async () => {
    await expect(resolve(null)).resolves.toEqual({ code: "EUR", rate: 1 });
  });

  it("falls back to euros when headers() throws outside a request", async () => {
    vi.resetModules();
    headers.mockRejectedValue(new Error("outside a request scope"));
    const fresh = await import("./currency.server");
    await expect(fresh.getDisplayCurrency()).resolves.toEqual({ code: "EUR", rate: 1 });
  });

  /**
   * A broken rate response must not be allowed to re-price the whole site.
   * The pinned fallback is used instead, and it is deliberately a little high
   * so the estimate over-states what the buyer is actually charged.
   */
  it("rejects an implausible rate and uses the pinned one", async () => {
    const zero = await resolve("US", { rates: { USD: 0 } });
    expect(zero.rate).toBe(1.15);

    const absurd = await resolve("US", { rates: { USD: 47 } });
    expect(absurd.rate).toBe(1.15);

    const missing = await resolve("US", {});
    expect(missing.rate).toBe(1.15);
  });

  it("uses the pinned rate when the endpoint is down", async () => {
    const down = await resolve("US", {}, false);
    expect(down).toEqual({ code: "USD", rate: 1.15 });
  });

});
