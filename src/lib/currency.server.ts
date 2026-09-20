import { cache } from "react";
import { headers } from "next/headers";
import { BASE_CURRENCY, type DisplayCurrency } from "@/lib/money";

/**
 * Which currency to *show* a visitor, and what to convert at.
 *
 * Nothing here changes what is charged: every order is priced, captured and
 * recorded in euros. This only decides the label, so a visitor in the US
 * reads a number they can judge instead of one they have to go and convert.
 *
 * Country comes from the CDN's own geo header rather than the Accept-Language
 * or the timezone, because those describe the browser, not the buyer — an
 * en-US browser in Milan is common and would be shown the wrong currency. The
 * header is absent locally, which is why EUR is the fallback.
 */

/** ECB reference rate, refreshed twice a day. */
const RATE_ENDPOINT = "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD";
const RATE_TTL_SECONDS = 43_200;

/**
 * Used when the rate can't be fetched. Deliberately a little conservative:
 * if it is stale, the visitor sees a slightly high dollar estimate and is
 * charged less than it, which is the harmless direction to be wrong in.
 *
 * Last checked 2026-09-20 (ECB: 1.146).
 */
const FALLBACK_EUR_USD = 1.15;

/** Countries shown dollars. Kept explicit — this is not "everywhere but the EU". */
const USD_COUNTRIES = new Set(["US", "PR", "VI", "GU", "AS", "MP"]);

async function fetchEurToUsd(): Promise<number> {
  try {
    const response = await fetch(RATE_ENDPOINT, { next: { revalidate: RATE_TTL_SECONDS } });
    if (!response.ok) throw new Error(`rate endpoint returned ${response.status}`);

    const data = (await response.json()) as { rates?: { USD?: number } };
    const rate = data.rates?.USD;

    // A rate outside this band is a broken response, not a market move. Taking
    // it would mis-price the whole site, so the fallback is used instead.
    if (typeof rate !== "number" || rate < 0.5 || rate > 3) {
      throw new Error(`implausible EUR/USD rate: ${String(rate)}`);
    }
    return rate;
  } catch (error) {
    console.error("[currency] falling back to the pinned EUR/USD rate", error);
    return FALLBACK_EUR_USD;
  }
}

/**
 * Cached per request, so a page that prints thirty prices resolves the
 * currency once. The rate fetch itself is cached for far longer by Next.
 */
export const getDisplayCurrency = cache(async (): Promise<DisplayCurrency> => {
  // headers() throws outside a request — a statically rendered route, or the
  // test suite. Euros is the correct answer in both cases: it is what is
  // charged, so falling back to it can only ever under-promise.
  let country = "";
  try {
    country = (await headers()).get("x-vercel-ip-country")?.toUpperCase() ?? "";
  } catch {
    return BASE_CURRENCY;
  }

  if (!USD_COUNTRIES.has(country)) return BASE_CURRENCY;

  return { code: "USD", rate: await fetchEurToUsd() };
});
