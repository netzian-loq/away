/**
 * Price formatting in the currency a visitor reads, for prices that are
 * always *charged* in euros.
 *
 * Client-safe on purpose: no `next/headers`, no fetch. Resolving which
 * currency to show and what today's rate is needs the request, and lives in
 * `currency.server.ts`; this half is the pure arithmetic, so the checkout
 * (a client component) and the marketing pages (server components) can share
 * one implementation instead of drifting apart.
 */

export type CurrencyCode = "EUR" | "USD";

export interface DisplayCurrency {
  code: CurrencyCode;
  /** Euros to one unit of `code`. Exactly 1 when the code IS EUR. */
  rate: number;
}

/** What everything is priced and charged in, whatever is displayed. */
export const BASE_CURRENCY: DisplayCurrency = { code: "EUR", rate: 1 };

/**
 * A euro price as a label: sign after the number, and cents only when there
 * are any, so a 38€ package is not advertised as "38.00€".
 *
 * This is display only. The strings handed to PayPal and written to the
 * ledger come from `formatAmount` in discounts.ts, which is always fixed-2 —
 * a money value and a price tag are not the same thing, and a provider that
 * is sent "38€" will not take it.
 */
export function formatEuros(amount: number): string {
  return `${Number.isInteger(amount) ? amount : amount.toFixed(2)}€`;
}

/**
 * The converted price, rounded to whole units.
 *
 * Whole units, not cents, because this number is an estimate and printing
 * "$68.04" would claim a precision that does not exist — the buyer's card
 * network applies its own rate at capture, and the charge is in euros either
 * way. A round number reads as "about this much", which is what it is.
 */
export function convert(amountEur: number, currency: DisplayCurrency): number {
  return Math.round(amountEur * currency.rate);
}

/**
 * The converted price with no "about" marker, for a line in a list where
 * one ≈ on the total already covers the whole column — and for a figure
 * that is subtracted, where "−≈ $7" is unreadable.
 */
export function formatIn(amountEur: number, currency: DisplayCurrency): string {
  if (currency.code === "EUR") return formatEuros(amountEur);
  return `$${convert(amountEur, currency)}`;
}

/**
 * The price as a visitor should read it.
 *
 * In euros this is the exact charged amount. In any other currency it is
 * prefixed with ≈, because it is a conversion of the amount that will
 * actually be taken, not a price in that currency.
 */
export function formatPrice(amountEur: number, currency: DisplayCurrency): string {
  if (currency.code === "EUR") return formatEuros(amountEur);
  return `≈ $${convert(amountEur, currency)}`;
}

/**
 * The charged amount, shown alongside a converted price — or an empty string
 * when the two are the same thing.
 *
 * Never omitted when they differ. A visitor who is shown dollars and charged
 * euros must be able to see that before they pay, not discover it on a
 * statement.
 */
export function chargedNote(amountEur: number, currency: DisplayCurrency): string {
  if (currency.code === "EUR") return "";
  return `${formatEuros(amountEur)} charged`;
}
