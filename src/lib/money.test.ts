import { describe, expect, it } from "vitest";
import {
  BASE_CURRENCY,
  chargedNote,
  convert,
  formatEuros,
  formatIn,
  formatPrice,
  type DisplayCurrency,
} from "./money";

const USD: DisplayCurrency = { code: "USD", rate: 1.146 };

describe("formatEuros", () => {
  it("drops the cents on a whole price and keeps them otherwise", () => {
    expect(formatEuros(38)).toBe("38€");
    expect(formatEuros(63.5)).toBe("63.50€");
  });
});

describe("converting for display", () => {
  it("rounds to whole units — the number is an estimate, not a price", () => {
    expect(convert(25, USD)).toBe(29);
    expect(convert(70, USD)).toBe(80);
  });

  it("is the identity in the currency everything is charged in", () => {
    expect(convert(70, BASE_CURRENCY)).toBe(70);
    expect(formatPrice(70, BASE_CURRENCY)).toBe("70€");
    expect(formatIn(70, BASE_CURRENCY)).toBe("70€");
  });

  /**
   * The ≈ is the honest part: the card network applies its own rate and the
   * charge is in euros, so a dollar figure can never be exact.
   */
  it("marks a converted headline price as approximate", () => {
    expect(formatPrice(25, USD)).toBe("≈ $29");
  });

  /**
   * Not on every line, though. One ≈ on the total covers the column, and a
   * subtracted amount would otherwise read "−≈ $7".
   */
  it("leaves the marker off a line item", () => {
    expect(formatIn(25, USD)).toBe("$29");
    expect(formatIn(7, USD)).toBe("$8");
  });
});

describe("chargedNote", () => {
  it("says nothing when the displayed currency is the charged one", () => {
    expect(chargedNote(70, BASE_CURRENCY)).toBe("");
  });

  /**
   * The one thing this module must never do is show a visitor dollars
   * without telling them what actually leaves their account.
   */
  it("always names the euro amount when they differ", () => {
    expect(chargedNote(63.5, USD)).toBe("63.50€ charged");
    expect(chargedNote(70, USD)).toBe("70€ charged");
  });
});
