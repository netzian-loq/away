import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CosmoPage, { metadata } from "./page";
import { COSMO } from "@/content/cosmo";
import { COSMO_DISCOUNT } from "@/lib/discounts";

describe("CosmoPage", () => {
  it("renders the Cosmo hero and every pillar", () => {
    render(<CosmoPage />);
    expect(screen.getByRole("heading", { level: 1, name: COSMO.heroTitle })).toBeInTheDocument();
    for (const pillar of COSMO.pillars) {
      expect(screen.getByRole("heading", { name: pillar.title })).toBeInTheDocument();
    }
  });

  it("renders the About Cosmo body copy including the bold runs", () => {
    render(<CosmoPage />);
    expect(screen.getByText("seven structured rosters")).toBeInTheDocument();
    expect(screen.getByText("Reach Beyond")).toBeInTheDocument();
    expect(
      screen.getByText(/competitive Fortnite organization built around one idea/),
    ).toBeInTheDocument();
  });

  it("stays out of search results — it's shared by link only", () => {
    expect(metadata.robots).toMatchObject({ index: false, follow: true });
  });

  it("offers the COSMO10 code with a checkout link that pre-fills it", () => {
    render(<CosmoPage />);
    expect(screen.getByText(COSMO_DISCOUNT.code)).toBeInTheDocument();

    const checkoutLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === `/checkout?code=${COSMO_DISCOUNT.code}`);
    expect(checkoutLinks.length).toBeGreaterThan(0);
  });
});
