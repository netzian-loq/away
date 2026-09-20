import { describe, expect, it } from "vitest";
import {
  BUNDLES,
  CATALOG,
  DEFAULT_PURCHASE,
  findPurchasable,
  MIN_SHOWN_SAVING,
  partsTotal,
  priceFor,
  savingOn,
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

describe("what a package saves against its parts", () => {
  it("prices each package's contents from the single services", () => {
    const pro = PRICING_TIERS.find((tier) => tier.slug === "pro-level")!;
    // Windows Tuning 25 + BIOS Full Tuning 15 + CPU 27 + GPU 18.
    expect(partsTotal(pro)).toBe(85);
    expect(savingOn(pro)).toBe(15);
  });

  it("saves something on every package", () => {
    for (const tier of PRICING_TIERS) {
      expect(partsTotal(tier)).not.toBeNull();
      expect(savingOn(tier)).toBeGreaterThan(0);
    }
  });

  /**
   * A bundle that costs more than its parts is a pricing mistake, not a
   * display one — this is the test that catches it on the next reprice.
   */
  it("never prices a package above the sum of its parts", () => {
    for (const tier of PRICING_TIERS) {
      expect(tier.price).toBeLessThanOrEqual(partsTotal(tier)!);
    }
  });

  /**
   * Refuses to guess. A feature with no service behind it would otherwise
   * produce a partial sum that understates the package while still looking
   * authoritative.
   */
  it("reports no total when a line has no single service behind it", () => {
    const invented = { ...PRICING_TIERS[0], features: ["Windows Tuning", "Free Pizza"] };
    expect(partsTotal(invented)).toBeNull();
    expect(savingOn(invented)).toBe(0);
  });

  it("keeps the smallest package's saving below the threshold worth printing", () => {
    const standard = PRICING_TIERS.find((tier) => tier.slug === "standard")!;
    expect(savingOn(standard)).toBeLessThan(MIN_SHOWN_SAVING);
  });
});
