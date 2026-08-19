import { describe, expect, it } from "vitest";
import {
  applyDiscount,
  commissionOn,
  COSMO_DISCOUNT,
  describeDiscount,
  findDiscount,
  formatAmount,
  nextTier,
  rateFor,
} from "./discounts";

describe("discounts", () => {
  it("exposes COSMO10 as a 10% Cosmo eSports code", () => {
    expect(COSMO_DISCOUNT.code).toBe("COSMO10");
    expect(COSMO_DISCOUNT.percentOff).toBe(10);
    expect(COSMO_DISCOUNT.partner).toBe("cosmo");
  });

  it("looks codes up regardless of case or padding", () => {
    expect(findDiscount("  cosmo10 ")?.code).toBe("COSMO10");
    expect(findDiscount("CoSmO10")?.code).toBe("COSMO10");
  });

  it("returns null for unknown or empty codes", () => {
    expect(findDiscount("NOPE")).toBeNull();
    expect(findDiscount("")).toBeNull();
    expect(findDiscount(null)).toBeNull();
    expect(findDiscount(undefined)).toBeNull();
  });

  it("takes 10% off every listed price, rounded to cents", () => {
    expect(applyDiscount(35, COSMO_DISCOUNT)).toBe(31.5);
    expect(applyDiscount(45, COSMO_DISCOUNT)).toBe(40.5);
    expect(applyDiscount(52, COSMO_DISCOUNT)).toBe(46.8);
    expect(applyDiscount(65, COSMO_DISCOUNT)).toBe(58.5);
    expect(applyDiscount(90, COSMO_DISCOUNT)).toBe(81);
  });

  it("leaves the price alone when there is no discount", () => {
    expect(applyDiscount(65, null)).toBe(65);
  });

  it("describes a used code unambiguously for the owner's email", () => {
    expect(describeDiscount(COSMO_DISCOUNT)).toBe("COSMO10 — 10% off (Cosmo eSports)");
  });

  it("says plainly when no code was used, rather than a bare dash", () => {
    expect(describeDiscount(null)).toBe("none — paid full price");
  });

  it("formats amounts as PayPal's fixed-2 strings", () => {
    expect(formatAmount(81)).toBe("81.00");
    expect(formatAmount(46.8)).toBe("46.80");
  });
});

describe("Waaqqi volume tiers", () => {
  const waaqqi = findDiscount("WAAQQI")!;

  it("earns the base rate before the threshold", () => {
    expect(rateFor(waaqqi, 0)).toBe(0.15);
    expect(rateFor(waaqqi, 49)).toBe(0.15);
  });

  it("steps up once the threshold is reached", () => {
    expect(rateFor(waaqqi, 50)).toBe(0.32);
    expect(rateFor(waaqqi, 400)).toBe(0.32);
  });

  it("leaves a partner without tiers on their flat rate", () => {
    expect(rateFor(COSMO_DISCOUNT, 0)).toBe(0.15);
    expect(rateFor(COSMO_DISCOUNT, 5000)).toBe(0.15);
  });

  it("counts down to the next tier, then reports none left", () => {
    expect(nextTier(waaqqi, 12)).toEqual({ afterPaidOrders: 50, rate: 0.32 });
    expect(nextTier(waaqqi, 50)).toBeNull();
    expect(nextTier(COSMO_DISCOUNT, 0)).toBeNull();
  });

  // The reason tiers are prospective: the rate is chosen per sale and stored on
  // the order, so crossing the threshold must not change what earlier orders
  // were worth. This asserts the arithmetic that guarantee rests on.
  it("pays the tier that applied at the time of each sale", () => {
    expect(commissionOn(58.5, waaqqi, rateFor(waaqqi, 49))).toBe(8.78);
    expect(commissionOn(58.5, waaqqi, rateFor(waaqqi, 50))).toBe(18.72);
  });

  it("falls back to the base rate when no rate is passed", () => {
    expect(commissionOn(100, waaqqi)).toBe(15);
  });

  it("is an attribution code, not an offer — the price barely moves", () => {
    // 0.1% off 65 is about six cents. Asserted so nobody "fixes" the decimal
    // point into a 10% discount by accident.
    expect(waaqqi.percentOff).toBe(0.1);
    expect(applyDiscount(65, waaqqi)).toBe(64.94);
  });
});
