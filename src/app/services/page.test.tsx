import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ServicesPage from "./page";
import { SERVICES } from "@/content/services";
import { PRICING_TIERS } from "@/content/pricing";

describe("ServicesPage", () => {
  it("renders full detail for every service and repeats every pricing tier", () => {
    render(<ServicesPage />);
    for (const service of SERVICES) {
      expect(screen.getByRole("heading", { name: service.title })).toBeInTheDocument();
    }
    for (const tier of PRICING_TIERS) {
      expect(screen.getByText(tier.name)).toBeInTheDocument();
    }
  });
});
