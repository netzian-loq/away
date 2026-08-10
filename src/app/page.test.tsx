import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("renders the hero heading before the pricing heading in document order", () => {
    render(<HomePage />);
    const headings = [
      ...screen.getAllByRole("heading", { level: 1 }),
      ...screen.getAllByRole("heading", { level: 2 }),
    ];
    const heroIndex = headings.findIndex((h) =>
      /Stop losing fights to your own PC/i.test(h.textContent ?? ""),
    );
    const pricingIndex = headings.findIndex((h) => h.textContent === "Bundles that save you more.");
    expect(heroIndex).toBeGreaterThanOrEqual(0);
    expect(pricingIndex).toBeGreaterThan(heroIndex);
  });
});
