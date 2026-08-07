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
}

export const DISCOUNTS: Discount[] = [
  {
    code: "COSMO10",
    percentOff: 10,
    partner: "cosmo",
    partnerLabel: "Cosmo eSports",
    commissionRate: 0.15,
  },
];

/** Partner commission on a paid amount, rounded to cents. */
export function commissionOn(amount: number, discount: Discount | null): number {
  if (!discount) return 0;
  return Math.round(amount * discount.commissionRate * 100) / 100;
}

/** Looks a partner up by its attribution slug (as stored on an order). */
export function findPartner(partner: string | null | undefined): Discount | null {
  if (!partner) return null;
  return DISCOUNTS.find((discount) => discount.partner === partner) ?? null;
}

/** The code Cosmo shares with their community. */
export const COSMO_DISCOUNT = DISCOUNTS[0];

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
