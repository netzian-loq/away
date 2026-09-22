import { describe, expect, it } from "vitest";
import {
  applyDiscount,
  checkoutHrefFor,
  commissionOn,
  COSMO_DISCOUNT,
  describeDiscount,
  discountForPath,
  findDiscount,
  formatAmount,
  JESTER_DISCOUNT,
  nextTier,
  rateFor,
  type Discount,
} from "./discounts";

/**
 * The site chrome keeps a partner's code on their own page. Without this, a
 * viewer who clicked the nav's "Get Optimized" instead of the page's button
 * paid full price and the partner was never credited.
 */
describe("partner landing pages", () => {
  it("resolves the partner behind a landing page", () => {
    expect(discountForPath("/jesterfv1")).toBe(JESTER_DISCOUNT);
  });

  it("ignores a trailing slash and letter case", () => {
    expect(discountForPath("/jesterfv1/")).toBe(JESTER_DISCOUNT);
    expect(discountForPath("/JesterFV1")).toBe(JESTER_DISCOUNT);
  });

  it("claims no partner for an ordinary page", () => {
    expect(discountForPath("/")).toBeNull();
    expect(discountForPath("/services")).toBeNull();
    expect(discountForPath(null)).toBeNull();
    expect(discountForPath(undefined)).toBeNull();
  });

  /** A partner without a page must not be matched by an empty path. */
  it("never matches a partner that has no landing page", () => {
    expect(discountForPath("")).toBeNull();
    expect(COSMO_DISCOUNT.landingPath).toBeUndefined();
  });

  it("keeps the code on checkout links from a partner page only", () => {
    expect(checkoutHrefFor("/jesterfv1")).toBe(`/checkout?code=${JESTER_DISCOUNT.code}`);
    expect(checkoutHrefFor("/")).toBe("/checkout");
    expect(checkoutHrefFor("/checkout")).toBe("/checkout");
  });
});

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

describe("creator codes", () => {
  const codes = ["COLDVVS", "EUZXN"] as const;

  it.each(codes)("%s takes 10%% off and pays 40%%", (code) => {
    const discount = findDiscount(code)!;
    expect(discount).not.toBeNull();
    expect(discount.percentOff).toBe(10);
    expect(discount.commissionRate).toBe(0.4);
    // The whole point of the pair: same terms, different attribution slug, so
    // the dashboard can tell the two apart.
    expect(discount.partner).toBe(code.toLowerCase());
  });

  it.each(codes)("%s bills 58.50 and owes 23.40 on the 65 EUR package", (code) => {
    const discount = findDiscount(code)!;
    const charged = applyDiscount(65, discount);
    expect(charged).toBe(58.5);
    // Commission is a cut of what the buyer actually paid, never of list price
    // — 40% of 65 would be 26.00 and overpay the partner by 2.60 a sale.
    expect(commissionOn(charged, discount)).toBe(23.4);
  });

  it("resolves them regardless of case or padding", () => {
    expect(findDiscount(" coldvvs ")?.code).toBe("COLDVVS");
    expect(findDiscount("Euzxn")?.code).toBe("EUZXN");
  });

  it.each(["WAAQQI", "COLD1ZR"])("no longer honours the retired %s code", (code) => {
    expect(findDiscount(code)).toBeNull();
  });
});

// No live partner is on tiers right now, so this exercises the machinery
// against a fixture. Deleting these along with WAAQQI would have left rateFor
// and nextTier untested while both are still wired into the dashboard.
describe("volume tiers", () => {
  const tiered: Discount = {
    code: "TIERED",
    percentOff: 10,
    partner: "tiered",
    partnerLabel: "Tiered",
    commissionRate: 0.15,
    tiers: [{ afterPaidOrders: 50, rate: 0.32 }],
  };

  it("earns the base rate before the threshold", () => {
    expect(rateFor(tiered, 0)).toBe(0.15);
    expect(rateFor(tiered, 49)).toBe(0.15);
  });

  it("steps up once the threshold is reached", () => {
    expect(rateFor(tiered, 50)).toBe(0.32);
    expect(rateFor(tiered, 400)).toBe(0.32);
  });

  it("leaves a partner without tiers on their flat rate", () => {
    expect(rateFor(COSMO_DISCOUNT, 0)).toBe(0.15);
    expect(rateFor(COSMO_DISCOUNT, 5000)).toBe(0.15);
  });

  it("counts down to the next tier, then reports none left", () => {
    expect(nextTier(tiered, 12)).toEqual({ afterPaidOrders: 50, rate: 0.32 });
    expect(nextTier(tiered, 50)).toBeNull();
    expect(nextTier(COSMO_DISCOUNT, 0)).toBeNull();
  });

  // The reason tiers are prospective: the rate is chosen per sale and stored on
  // the order, so crossing the threshold must not change what earlier orders
  // were worth. This asserts the arithmetic that guarantee rests on.
  it("pays the tier that applied at the time of each sale", () => {
    expect(commissionOn(58.5, tiered, rateFor(tiered, 49))).toBe(8.78);
    expect(commissionOn(58.5, tiered, rateFor(tiered, 50))).toBe(18.72);
  });

  it("falls back to the base rate when no rate is passed", () => {
    expect(commissionOn(100, tiered)).toBe(15);
  });
});
