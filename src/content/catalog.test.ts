import { describe, expect, it } from "vitest";
import {
  BUNDLES,
  CATALOG,
  DEFAULT_PURCHASE,
  findPurchasable,
  priceFor,
  SINGLE_SERVICES,
  supportsExtreme,
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
    expect(findPurchasable("extreme-windows-tuning")?.price).toBe(30);
    expect(findPurchasable("away-os-windows-tuning")?.price).toBe(27);
    expect(findPurchasable("away-os-extreme-windows-tuning")?.price).toBe(32);
    expect(findPurchasable("network-tuning")?.price).toBe(10);
    expect(findPurchasable("bios-tuning")?.price).toBe(15);
    expect(findPurchasable("gpu-overclocking")?.price).toBe(18);
    expect(findPurchasable("ram-overclocking")?.price).toBe(50);
    expect(findPurchasable("cpu-overclocking")?.price).toBe(27);
  });

  it("still carries the bundle prices", () => {
    expect(findPurchasable("standard")?.price).toBe(38);
    expect(findPurchasable("entry-level")?.price).toBe(50);
    expect(findPurchasable("high-entry-level")?.price).toBe(55);
    expect(findPurchasable("pro-level")?.price).toBe(70);
    expect(findPurchasable("extreme-level")?.price).toBe(105);
  });

  describe("the extreme Windows upgrade", () => {
    it("adds 4€ to a package", () => {
      const pro = findPurchasable("pro-level")!;
      expect(priceFor(pro)).toBe(70);
      expect(priceFor(pro, true)).toBe(74);
    });

    /**
     * A single service is already sold in an extreme version, so the upgrade
     * has nothing to upgrade. A request that asks for it anyway is charged
     * the plain price rather than refused.
     */
    it("is ignored on a single service, and never charged for", () => {
      const ram = findPurchasable("ram-overclocking")!;
      expect(supportsExtreme(ram)).toBe(false);
      expect(priceFor(ram, true)).toBe(50);
    });
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
