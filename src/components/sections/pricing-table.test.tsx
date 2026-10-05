import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PricingTable } from "./pricing-table";
import { PRICING_TIERS } from "@/content/pricing";

describe("PricingTable", () => {
  it("renders every tier with its price", () => {
    render(<PricingTable />);
    for (const tier of PRICING_TIERS) {
      expect(screen.getByText(tier.name)).toBeInTheDocument();
      expect(screen.getByText(`${tier.price}€`)).toBeInTheDocument();
    }
  });

  it("marks the featured tier as most popular", () => {
    render(<PricingTable />);
    expect(screen.getByText("Most popular")).toBeInTheDocument();
  });

  it("marks Standard as the 2nd most popular, once", () => {
    render(<PricingTable />);
    const badge = screen.getByText("2nd most popular");
    expect(badge.closest("div")).toHaveTextContent("Standard");
  });
});
