import { describe, expect, it } from "vitest";
import {
  applyDiscount,
  COSMO_DISCOUNT,
  describeDiscount,
  findDiscount,
  formatAmount,
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
