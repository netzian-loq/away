import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServicesFull } from "./services-full";
import { SERVICES } from "@/content/services";

describe("ServicesFull", () => {
  it("renders full detail for every service, including every feature bullet", () => {
    render(<ServicesFull />);
    for (const service of SERVICES) {
      expect(screen.getByRole("heading", { name: service.title })).toBeInTheDocument();
      for (const feature of service.features) {
        expect(screen.getAllByText(feature).length).toBeGreaterThan(0);
      }
    }
  });

  it("lets every service be bought on its own, at its listed price", () => {
    render(<ServicesFull />);
    // Matched by href, not label: two services share the 25€ price.
    const links = screen.getAllByRole("link");
    for (const service of SERVICES) {
      const buy = links.find(
        (link) => link.getAttribute("href") === `/checkout?item=${service.slug}`,
      );
      expect(buy, `no buy link for ${service.slug}`).toBeDefined();
      expect(buy).toHaveTextContent(service.priceLabel);
    }
  });

  it("shows no placeholder screenshots", () => {
    render(<ServicesFull />);
    expect(screen.queryByText(/placeholder/i)).not.toBeInTheDocument();
    expect(document.querySelector("figure")).toBeNull();
  });
});
