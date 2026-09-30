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

  /** There is no checkout item for the tool: every "get it", upgrade and top-up goes to a Discord ticket. */
  it("sends every Get, Upgrade and Top up button to the Discord ticket channel", async () => {
    await renderPage();
    const buys = screen.getAllByRole("link", { name: /^(get |upgrade on|top up on)/i });
    // hero + close ("Get Uefi-Kompile"), one per version, the upgrade, the top-up
    expect(buys.length).toBe(2 + UEFI_KOMPILE.plans.length + 2);
    for (const link of buys) {
      expect(link).toHaveAttribute("href", SITE.discordSupportUrl);
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    }
  });

  /** The owner's update: Normal for your own machine, Pro for tweaking any PC. */
  it("says Normal is for your own PC and Pro works on any PC's BIOS", async () => {
    const { container } = await renderPage();
    const text = container.textContent ?? "";
    expect(screen.getByText(`${UEFI_KOMPILE.name} Normal`)).toBeInTheDocument();
    expect(screen.getByText(`${UEFI_KOMPILE.name} Pro`)).toBeInTheDocument();
    expect(text).toMatch(/this PC's BIOS only/);
    expect(text).toMatch(/any PC's BIOS/);
    expect(text).toMatch(/NVRAM exported from any PC/);
  });

  it("lists the updates: the version choice and the X3D preset", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { name: UEFI_KOMPILE.updatesTitle })).toBeInTheDocument();
    expect(screen.getByText("Choose Normal or Pro")).toBeInTheDocument();
    expect(screen.getByText("X3D preset added")).toBeInTheDocument();
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

  /** The owner's prices (2026-09-30), pinned so a slip in the content shows up here. */
  it("prices Normal at 25€, Pro at 45€ and the upgrade at 21€", () => {
    const byId = Object.fromEntries(UEFI_KOMPILE.plans.map((p) => [p.id, p.price]));
    expect(byId).toEqual({ normal: 25, pro: 45 });
    expect(UEFI_KOMPILE.upgrade.price).toBe(21);
  });

  /** Computed from the content numbers, so a reprice moves every figure at once. */
  it("shows both versions, the upgrade and the coin top-up in euros", async () => {
    const { container } = await renderPage();
    const text = container.textContent ?? "";
    for (const plan of UEFI_KOMPILE.plans) {
      expect(text).toContain(formatEuros(plan.price));
      expect(UEFI_KOMPILE.description).toContain(formatEuros(plan.price));
    }
    expect(text).toContain(formatEuros(UEFI_KOMPILE.upgrade.price));
    expect(text).toContain(formatEuros(UEFI_KOMPILE.coinPack.price));
    expect(text).toContain(`${UEFI_KOMPILE.coinPack.coins} coins`);
  });

  it("puts a price on every Get button", async () => {
    await renderPage();
    const from = Math.min(...UEFI_KOMPILE.plans.map((p) => p.price));
    for (const link of screen.getAllByRole("link", { name: new RegExp(UEFI_KOMPILE.cta, "i") })) {
      expect(link).toHaveTextContent(`from ${formatEuros(from)}`);
    }
    for (const plan of UEFI_KOMPILE.plans) {
      expect(screen.getByRole("link", { name: new RegExp(`^Get ${plan.name}\\b`) })).toHaveTextContent(formatEuros(plan.price));
    }
  });

  it("is an indexed page with its own canonical URL", () => {
    expect(metadata.alternates?.canonical).toBe(`${SITE.url}/uefi-kompile`);
    expect(metadata.robots).toBeUndefined();
  });
});
