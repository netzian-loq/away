import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServicesTeaser } from "./services-teaser";
import { SERVICE_CATEGORIES, SERVICES } from "@/content/services";

describe("ServicesTeaser", () => {
  it("renders a card for every service with its price", () => {
    render(<ServicesTeaser />);
    for (const service of SERVICES) {
      expect(screen.getByText(service.title)).toBeInTheDocument();
      expect(screen.getAllByText(service.priceLabel).length).toBeGreaterThan(0);
    }
  });

  it("links to the full services page", () => {
    render(<ServicesTeaser />);
    expect(screen.getByRole("link", { name: /See all services/i })).toHaveAttribute(
      "href",
      "/services",
    );
  });

  /**
   * The point of the section: a visitor who already knows what they want
   * reaches the payment panel in one click, with the choice made for them.
   */
  it("sends every card straight into checkout with that service selected", () => {
    render(<ServicesTeaser />);
    const links = screen.getAllByRole("link");
    for (const service of SERVICES) {
      // Matched by href, not by title: "Windows Tuning" is a substring of
      // "AwayOS + Windows Tuning", so a text match finds the wrong card.
      const card = links.find(
        (link) => link.getAttribute("href") === `/checkout?item=${service.slug}`,
      );
      expect(card, `no card links to ${service.slug}`).toBeDefined();
      expect(card?.textContent).toContain(service.title);
      expect(card?.textContent).toContain(service.priceLabel);
    }
  });

  it("splits the list into its two categories", () => {
    render(<ServicesTeaser />);
    for (const category of SERVICE_CATEGORIES) {
      expect(screen.getByRole("heading", { name: category.label })).toBeInTheDocument();
    }
  });
});
