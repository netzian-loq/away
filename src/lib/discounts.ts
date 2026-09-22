/**
 * Partner discount codes. Hardcoded for now — when the affiliate dashboard
 * lands, this table is the seam it replaces (same shape, fetched instead of
 * imported), so nothing downstream has to change.
 *
 * Codes are only ever resolved on the server before an order amount is
 * calculated; the browser never gets to name its own price.
 */

export interface Discount {
  code: string;
  /** Whole-number percentage off the list price. */
  percentOff: number;
  /** Attribution slug recorded on the PayPal order and in the owner email. */
  partner: string;
  /** Human label used in emails and on the checkout summary. */
  partnerLabel: string;
  /**
   * Partner's cut of what the customer actually pays, as a fraction.
   * Change this one number to change what a partner earns.
   */
  commissionRate: number;
  /**
   * Optional volume tiers, applied PROSPECTIVELY: once the partner has this
   * many paid orders, every *subsequent* order earns the higher rate. Past
   * orders keep the rate they were sold at.
   *
   * Prospective rather than retroactive on purpose — retroactive would mean
   * the 50th sale silently creates back-pay on the previous forty-nine, which
   * is a nasty surprise to discover in a payout. Each order stores its own
   * rate (see OrderRecord.commissionRate), so the ledger is self-explaining.
   *
   * Must be ordered by ascending `afterPaidOrders`.
   */
  tiers?: { afterPaidOrders: number; rate: number }[];
  /**
   * Path of the partner's own landing page, when they have one.
   *
   * Exists so the site chrome can keep the code attached. A visitor who
   * lands on a partner page and then clicks the nav's "Get Optimized"
   * button rather than the page's own CTA would otherwise arrive at a bare
   * /checkout — full price for them, no attribution for the partner, and no
   * way to tell afterwards that it happened.
   */
  landingPath?: string;
}

export const DISCOUNTS: Discount[] = [
  {
    code: "COSMO10",
    percentOff: 10,
    partner: "cosmo",
    partnerLabel: "Cosmo eSports",
    commissionRate: 0.15,
  },
  // Creator codes. These are real offers, not bare attribution: a discount for
  // the buyer and a share of what is actually paid to the partner. On the 70
  // EUR Pro package a 10/40 code is 63.00 charged and 25.20 owed, leaving
  // 37.80 — deliberately priced as a growth deal, not a standing margin.
  {
    code: "COLDVVS",
    percentOff: 10,
    partner: "coldvvs",
    partnerLabel: "Coldvvs",
    commissionRate: 0.4,
  },
  {
    code: "EUZXN",
    percentOff: 10,
    partner: "euzxn",
    partnerLabel: "Euzxn",
    commissionRate: 0.4,
  },
  {
    // Added 2026-09-20. A smaller buyer discount than the other creator
    // codes, so the commission is the one number to sanity-check if this is
    // meant to sit at the same 40% they earn: on the 70 EUR Pro package this
    // bills 66.50 and owes 26.60, which is a larger payout than COLDVVS or
    // EUZXN earn, because the buyer is discounted less.
    code: "JESTER5",
    percentOff: 5,
    partner: "jesterfv",
    partnerLabel: "Jesterfv1",
    commissionRate: 0.4,
    landingPath: "/jesterfv1",
  },
];

/**
 * The rate a partner earns on their NEXT sale, given how many paid orders
 * they have already brought in.
 */
export function rateFor(discount: Discount | null, paidOrdersSoFar: number): number {
  if (!discount) return 0;
  let rate = discount.commissionRate;
  for (const tier of discount.tiers ?? []) {
    if (paidOrdersSoFar >= tier.afterPaidOrders) rate = tier.rate;
  }
  return rate;
}

/** The next tier a partner has not reached yet, for showing progress. */
export function nextTier(
  discount: Discount | null,
  paidOrdersSoFar: number,
): { afterPaidOrders: number; rate: number } | null {
  if (!discount) return null;
  for (const tier of discount.tiers ?? []) {
    if (paidOrdersSoFar < tier.afterPaidOrders) return tier;
  }
  return null;
}

/**
 * Partner commission on a paid amount, rounded to cents.
 *
 * `rate` overrides the partner's base rate — pass the value from `rateFor()`
 * when recording a sale so volume tiers are honoured. Omitting it keeps the
 * base rate, which is what every existing caller wants.
 */
export function commissionOn(
  amount: number,
  discount: Discount | null,
  rate?: number,
): number {
  if (!discount) return 0;
  return Math.round(amount * (rate ?? discount.commissionRate) * 100) / 100;
}

/** Looks a partner up by its attribution slug (as stored on an order). */
export function findPartner(partner: string | null | undefined): Discount | null {
  if (!partner) return null;
  return DISCOUNTS.find((discount) => discount.partner === partner) ?? null;
}

/**
 * The code Cosmo shares with their community.
 *
 * Looked up by code rather than by index: `/cosmo` renders its price and CTA
 * straight off this, so an entry added above Cosmo in the table would silently
 * put another partner's code on their page.
 */
export const COSMO_DISCOUNT = DISCOUNTS.find((d) => d.code === "COSMO10")!;

/**
 * The discount belonging to a partner landing page, if the path is one.
 * Used by the nav and footer to keep their checkout links attributed.
 */
export function discountForPath(pathname: string | null | undefined): Discount | null {
  if (!pathname) return null;
  const normalized = pathname.replace(/\/+$/, "").toLowerCase() || "/";
  return DISCOUNTS.find((entry) => entry.landingPath === normalized) ?? null;
}

/** A checkout href that keeps whatever partner code the current page implies. */
export function checkoutHrefFor(pathname: string | null | undefined): string {
  const discount = discountForPath(pathname);
  return discount ? `/checkout?code=${discount.code}` : "/checkout";
}

/** Jesterfv1 creator code, for his page at /jesterfv1. */
export const JESTER_DISCOUNT = DISCOUNTS.find((d) => d.code === "JESTER5")!;

/** Case- and whitespace-insensitive lookup. Returns null for unknown codes. */
export function findDiscount(code: string | null | undefined): Discount | null {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  return DISCOUNTS.find((discount) => discount.code === normalized) ?? null;
}

/**
 * Applies a discount and rounds to cents. Returns the list price untouched
 * when there is no discount, so callers can pass a nullable lookup result
 * straight through.
 */
export function applyDiscount(price: number, discount: Discount | null): number {
  if (!discount) return Math.round(price * 100) / 100;
  return Math.round(price * (1 - discount.percentOff / 100) * 100) / 100;
}

/**
 * One unambiguous line for the owner's notification email — never a bare dash
 * that could be read as "unknown" rather than "no code was used".
 */
export function describeDiscount(discount: Discount | null): string {
  if (!discount) return "none — paid full price";
  return `${discount.code} — ${discount.percentOff}% off (${discount.partnerLabel})`;
}

/** PayPal wants amounts as fixed-2 strings, never floats. */
export function formatAmount(price: number): string {
  return price.toFixed(2);
}
