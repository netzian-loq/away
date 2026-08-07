import { describe, expect, it } from "vitest";
import {
  BUNDLES,
  CATALOG,
  DEFAULT_PURCHASE,
  findPurchasable,
  SINGLE_SERVICES,
} from "./catalog";
import { PRICING_TIERS } from "./pricing";
import { SERVICES } from "./services";

describe("CATALOG", () => {
  it("sells every bundle and every individual service", () => {
    expect(CATALOG).toHaveLength(PRICING_TIERS.length + SERVICES.length);
    expect(BUNDLES).toHaveLength(PRICING_TIERS.length);
    expect(SINGLE_SERVICES).toHaveLength(SERVICES.length);
  });

  it("keeps slugs unique across bundles and services", () => {
    // A collision would silently sell the wrong thing at the wrong price.
    const slugs = CATALOG.map((item) => item.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("carries the prices shown on the services page", () => {
    expect(findPurchasable("windows-tuning")?.price).toBe(25);
    expect(findPurchasable("network-tuning")?.price).toBe(10);
    expect(findPurchasable("bios-tuning")?.price).toBe(12);
    expect(findPurchasable("gpu-overclocking")?.price).toBe(15);
    expect(findPurchasable("ram-overclocking")?.price).toBe(45);
    expect(findPurchasable("cpu-overclocking")?.price).toBe(25);
  });

  it("still carries the bundle prices", () => {
    expect(findPurchasable("standard")?.price).toBe(35);
    expect(findPurchasable("pro-level")?.price).toBe(65);
    expect(findPurchasable("extreme-level")?.price).toBe(95);
  });

  it("never disagrees with the source content on price", () => {
    for (const service of SERVICES) {
      expect(findPurchasable(service.slug)?.price).toBe(service.priceValue);
    }
    for (const tier of PRICING_TIERS) {
      expect(findPurchasable(tier.slug)?.price).toBe(tier.price);
    }
  });

  it("looks up case-insensitively and rejects anything unknown", () => {
    expect(findPurchasable(" GPU-Overclocking ")?.slug).toBe("gpu-overclocking");
    expect(findPurchasable("free-please")).toBeNull();
    expect(findPurchasable("")).toBeNull();
    expect(findPurchasable(undefined)).toBeNull();
  });

  it("defaults to the featured bundle", () => {
    expect(DEFAULT_PURCHASE.slug).toBe("pro-level");
  });

  it("gives every item a name, a positive price and a blurb", () => {
    for (const item of CATALOG) {
      expect(item.name).toBeTruthy();
      expect(item.blurb).toBeTruthy();
      expect(item.price).toBeGreaterThan(0);
    }
  });
});
