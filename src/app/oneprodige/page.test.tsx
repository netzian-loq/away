import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OneProdigePage, { metadata } from "./page";
import { ONE_PRODIGE } from "@/content/oneprodige";
import { PRICING_TIERS } from "@/content/pricing";
import { SITE } from "@/content/site";
import { applyDiscount, ONE_PRODIGE_DISCOUNT } from "@/lib/discounts";
import { formatEuros } from "@/lib/money";

async function renderPage() {
  return render(await OneProdigePage());
}

const CODE = ONE_PRODIGE_DISCOUNT.code;

describe("OneProdigePage", () => {
  it("leads with their tagline and the offer", async () => {
    await renderPage();
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent(/Performance & excellence/i);
    expect(screen.getByRole("button", { name: `Copy discount code ${CODE}` })).toBeInTheDocument();
  });

  /**
   * The page's whole job. Every route off it into checkout has to carry the
   * code, or the 1P community pays full price and the sale is credited to
   * nobody.
   */
  it("carries the code on every checkout link", async () => {
    await renderPage();
    const checkoutLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href")?.startsWith("/checkout"));

    expect(checkoutLinks.length).toBeGreaterThanOrEqual(PRICING_TIERS.length);
    for (const link of checkoutLinks) {
      expect(link.getAttribute("href")).toContain(`code=${CODE}`);
    }
  });

  it("opens each package in checkout with that package already chosen", async () => {
    await renderPage();
    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    for (const tier of PRICING_TIERS) {
      expect(hrefs).toContain(`/checkout?item=${tier.slug}&code=${CODE}`);
    }
  });

  /** Computed, never typed in, so a reprice can never leave this page stale. */
  it("shows their price on every package, computed from the catalog", async () => {
    await renderPage();
    for (const tier of PRICING_TIERS) {
      const yours = formatEuros(applyDiscount(tier.price, ONE_PRODIGE_DISCOUNT));
      expect(screen.getAllByText(yours).length).toBeGreaterThan(0);
    }
  });

  /** The copy states the percentage in words; it must match the real code. */
  it("quotes the same discount the code actually gives", () => {
    const percent = `${ONE_PRODIGE_DISCOUNT.percentOff}%`;
    expect(ONE_PRODIGE.heroSubtitle).toContain(percent);
    expect(ONE_PRODIGE.pricesBody).toContain(percent);
    expect(ONE_PRODIGE.closeBody).toContain(percent);
  });

  it("keeps the hero subtext short enough to leave the CTA above the fold", () => {
    expect(ONE_PRODIGE.heroSubtitle.split(/\s+/).length).toBeLessThanOrEqual(20);
  });

  /** Their record, as published on oneprodige.com, is on the page. */
  it("shows their facts and their road to Globals", async () => {
    await renderPage();
    for (const fact of ONE_PRODIGE.facts) {
      expect(screen.getByText(fact.label)).toBeInTheDocument();
    }
    for (const step of ONE_PRODIGE.road) {
      expect(screen.getByRole("heading", { level: 3, name: step.event })).toBeInTheDocument();
    }
    expect(screen.getByText(ONE_PRODIGE.next.body)).toBeInTheDocument();
  });

  /**
   * The social links are the ones oneprodige.com itself links to. A typo here
   * sends their community to someone else's account.
   */
  it("links their official channels, opening in a new tab", async () => {
    await renderPage();
    const expected = [
      "https://x.com/oneprodige",
      "https://www.instagram.com/1p_esport/",
      "https://www.twitch.tv/1p_esport",
      "https://www.tiktok.com/@oneprodige",
      "https://www.youtube.com/@1P_Esport",
      "https://discord.gg/qGnhNZmwNy",
      "https://oneprodige.com",
    ];
    const links = screen.getAllByRole("link");
    for (const href of expected) {
      const link = links.find((l) => l.getAttribute("href") === href);
      expect(link, href).toBeDefined();
      expect(link).toHaveAttribute("target", "_blank");
      expect(link?.getAttribute("rel")).toContain("noopener");
    }
  });

  /**
   * Nothing may claim their players use the service. That is a factual claim
   * about real people that nobody here has verified.
   */
  it("makes no endorsement claim on their behalf", async () => {
    await renderPage();
    const copy = document.body.textContent ?? "";
    expect(copy).not.toMatch(/(their|the team'?s?|1P'?s?) (rigs?|pcs?|setups?) (is|are) tuned/i);
    expect(copy).not.toMatch(/(One Prodige|1P|the roster|their players) (uses?|runs?|plays? on|trusts?|recommends?)/i);
  });

  /** The test env has no PayPal credentials, so card must not be promised. */
  it("does not promise card payments while the Card tab is still off", async () => {
    await renderPage();
    expect(screen.getByText("PayPal, crypto or bank transfer.")).toBeInTheDocument();
    expect(screen.queryByText(/^Card, PayPal/)).not.toBeInTheDocument();
  });

  it("uses no em-dashes in its visible copy", async () => {
    await renderPage();
    expect(document.body.textContent ?? "").not.toMatch(/[—–]/);
  });

  it("stays unlisted but lets its links pass value", () => {
    expect(metadata.robots).toMatchObject({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe(`${SITE.url}/oneprodige`);
  });
});
