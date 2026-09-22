import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import JesterfvPage, { metadata } from "./page";
import { JESTERFV } from "@/content/jesterfv";
import { PRICING_TIERS } from "@/content/pricing";
import { SITE } from "@/content/site";
import { applyDiscount, JESTER_DISCOUNT } from "@/lib/discounts";
import { formatEuros } from "@/lib/money";

async function renderPage() {
  return render(await JesterfvPage());
}

describe("JesterfvPage", () => {
  it("leads with his name and the offer", async () => {
    await renderPage();
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent(/Play like/i);
    expect(h1).toHaveTextContent(/Jesterfv1/);
    expect(screen.getByRole("button", { name: `Copy discount code ${JESTER_DISCOUNT.code}` })).toBeInTheDocument();
  });

  /**
   * The page's whole job. Every route off it into checkout has to carry the
   * code, or his viewers land on full price and the sale is credited to
   * nobody.
   */
  it("carries the code on every checkout link", async () => {
    await renderPage();
    const checkoutLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href")?.startsWith("/checkout"));

    expect(checkoutLinks.length).toBeGreaterThanOrEqual(PRICING_TIERS.length);
    for (const link of checkoutLinks) {
      expect(link.getAttribute("href")).toContain(`code=${JESTER_DISCOUNT.code}`);
    }
  });

  it("opens each package in checkout with that package already chosen", async () => {
    await renderPage();
    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    for (const tier of PRICING_TIERS) {
      expect(hrefs).toContain(`/checkout?item=${tier.slug}&code=${JESTER_DISCOUNT.code}`);
    }
  });

  /**
   * Computed, never typed in. If a package is repriced, every number here
   * moves with it, so the page cannot advertise a price checkout contradicts.
   */
  it("shows his price on every package, computed from the catalog", async () => {
    await renderPage();
    for (const tier of PRICING_TIERS) {
      const yours = formatEuros(applyDiscount(tier.price, JESTER_DISCOUNT));
      expect(screen.getAllByText(yours).length).toBeGreaterThan(0);
    }
  });

  it("keeps the hero subtext short enough to leave the CTA above the fold", () => {
    expect(JESTERFV.heroSubtitle.split(/\s+/).length).toBeLessThanOrEqual(20);
  });

  /**
   * Nothing on this page may claim he personally uses the service. That is a
   * factual claim about a real person that nobody here has verified. The copy
   * is aspirational on purpose, and this is what keeps a future edit honest.
   */
  it("makes no endorsement claim on his behalf", async () => {
    await renderPage();
    const copy = document.body.textContent ?? "";
    expect(copy).not.toMatch(/his (rig|pc|setup) is tuned/i);
    expect(copy).not.toMatch(/Jesterfv1 (uses|runs|plays on|trusts|recommends)/i);
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

  /**
   * He shares this URL himself, so it must not compete with the site's own
   * pages in search, and it stays out of the sitemap.
   */
  it("stays unlisted but lets its links pass value", () => {
    expect(metadata.robots).toMatchObject({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe(`${SITE.url}/jesterfv1`);
  });
});
