import { describe, expect, it } from "vitest";
import { CURRENCY, findTier, popularityBadge, PRICING_TIERS } from "./pricing";

describe("PRICING_TIERS", () => {
  it("has exactly 5 tiers with the preserved prices", () => {
    expect(PRICING_TIERS).toHaveLength(5);
    const prices = Object.fromEntries(PRICING_TIERS.map((t) => [t.name, t.price]));
    expect(prices).toEqual({
      Standard: 38,
      "Low Entry Level": 50,
      "High Entry Level": 55,
      "Pro Level": 70,
      "Extreme Level": 105,
    });
  });

  it("marks exactly Pro Level as featured", () => {
    const featured = PRICING_TIERS.filter((t) => t.featured).map((t) => t.name);
    expect(featured).toEqual(["Pro Level"]);
  });

  it("marks exactly Standard as the 2nd most popular", () => {
    const runnerUp = PRICING_TIERS.filter((t) => t.runnerUp).map((t) => t.name);
    expect(runnerUp).toEqual(["Standard"]);
    expect(popularityBadge(findTier("standard")!)).toBe("2nd most popular");
    expect(popularityBadge(findTier("pro-level")!)).toBe("Most popular");
    expect(popularityBadge(findTier("extreme-level")!)).toBeNull();
  });

  /** One package cannot be first and second at once. */
  it("never puts both badges on one package", () => {
    expect(PRICING_TIERS.some((t) => t.featured && t.runnerUp)).toBe(false);
  });

  it("Extreme Level includes RAM Overclocking", () => {
    const extreme = PRICING_TIERS.find((t) => t.name === "Extreme Level");
    expect(extreme?.features).toContain("RAM Overclocking");
  });

  it("gives every tier a unique slug for the checkout", () => {
    const slugs = PRICING_TIERS.map((t) => t.slug);
    expect(slugs).toEqual([
      "standard",
      "entry-level",
      "high-entry-level",
      "pro-level",
      "extreme-level",
    ]);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("looks tiers up by slug and rejects unknown ones", () => {
    expect(findTier("pro-level")?.price).toBe(70);
    expect(findTier(" PRO-LEVEL ")?.price).toBe(70);
    expect(findTier("free-please")).toBeNull();
    expect(findTier("")).toBeNull();
    expect(findTier(undefined)).toBeNull();
  });

  it("prices everything in euros", () => {
    expect(CURRENCY).toBe("EUR");
  });
});
