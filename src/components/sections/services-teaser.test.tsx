import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServicesTeaser } from "./services-teaser";
import { SERVICES } from "@/content/services";

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
    expect(screen.getByRole("link", { name: /See all services/i })).toHaveAttribute("href", "/services");
  });
});
