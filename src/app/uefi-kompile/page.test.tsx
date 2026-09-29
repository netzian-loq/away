import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import UefiKompilePage, { metadata } from "./page";
import { UEFI_KOMPILE } from "@/content/uefi-kompile";
import { SITE } from "@/content/site";
import { formatEuros } from "@/lib/money";

async function renderPage() {
  return render(await UefiKompilePage());
}

describe("UefiKompilePage", () => {
  it("leads with the product name and what it is", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Uefi-Kompile");
    expect(screen.getByText(UEFI_KOMPILE.tagline)).toBeInTheDocument();
  });

  /** The owner's brief, point by point: settings count, platforms, coins. */
  it("states the settings count, the platforms and the free coins", async () => {
    const { container } = await renderPage();
    const text = container.textContent ?? "";
    expect(text).toContain("400–500");
    expect(text).toMatch(/AM4/);
    expect(text).toMatch(/AM5/);
    expect(text).toMatch(/Intel/);
    expect(text).toMatch(/X3D/);
    expect(text).toMatch(/25 free coins/i);
    expect(text).toMatch(/1% and 0\.1% lows/);
  });

  /** There is no checkout item for the tool: every "get it" goes to a Discord ticket. */
  it("sends every Get button to the Discord ticket channel", async () => {
    await renderPage();
    const gets = screen.getAllByRole("link", { name: new RegExp(UEFI_KOMPILE.cta, "i") });
    expect(gets.length).toBeGreaterThan(0);
    for (const link of gets) {
      expect(link).toHaveAttribute("href", SITE.discordSupportUrl);
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    }
  });

  it("describes both screenshots for screen readers", async () => {
    await renderPage();
    for (const img of screen.getAllByRole("img")) {
      expect(img.getAttribute("alt")?.length ?? 0).toBeGreaterThan(20);
    }
  });

  /**
   * A BIOS tool can't honestly promise it will never cause a problem, and no
   * frame-time number has been measured for this page. The safety line states
   * the real safeguards and the lows line says what the tool is built for.
   */
  it("makes no absolute safety or performance promise", async () => {
    const { container } = await renderPage();
    const text = (container.textContent ?? "").toLowerCase();
    for (const phrase of ["guarantee", "100% safe", "can't brick", "cannot brick", "never break", "risk-free", "zero risk"]) {
      expect(text).not.toContain(phrase);
    }
    expect(text).not.toMatch(/\+\s?\d+\s?%\s*(fps|lows)/);
  });

  /** Computed from the content numbers, so a reprice moves every figure at once. */
  it("shows the tool price and the coin top-up in euros", async () => {
    const { container } = await renderPage();
    const text = container.textContent ?? "";
    expect(text).toContain(formatEuros(UEFI_KOMPILE.price));
    expect(text).toContain(formatEuros(UEFI_KOMPILE.coinPack.price));
    expect(text).toContain(`${UEFI_KOMPILE.coinPack.coins} coins`);
    expect(UEFI_KOMPILE.description).toContain(formatEuros(UEFI_KOMPILE.price));
  });

  it("puts the price on every Get button", async () => {
    await renderPage();
    for (const link of screen.getAllByRole("link", { name: new RegExp(UEFI_KOMPILE.cta, "i") })) {
      expect(link).toHaveTextContent(formatEuros(UEFI_KOMPILE.price));
    }
  });

  it("is an indexed page with its own canonical URL", () => {
    expect(metadata.alternates?.canonical).toBe(`${SITE.url}/uefi-kompile`);
    expect(metadata.robots).toBeUndefined();
  });
});
