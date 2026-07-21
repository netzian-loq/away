import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("gsap", () => ({
  gsap: { registerPlugin: vi.fn(), fromTo: vi.fn(() => ({ scrollTrigger: { kill: vi.fn() }, kill: vi.fn() })) },
}));
vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: {} }));

import HomePage from "./page";

describe("HomePage", () => {
  it("renders the hero heading before the pricing heading in document order", () => {
    render(<HomePage />);
    const headings = [
      ...screen.getAllByRole("heading", { level: 1 }),
      ...screen.getAllByRole("heading", { level: 2 }),
    ];
    const heroIndex = headings.findIndex((h) => h.textContent === "Away Tweaks.");
    const pricingIndex = headings.findIndex((h) => h.textContent === "Bundles that save you more.");
    expect(heroIndex).toBeGreaterThanOrEqual(0);
    expect(pricingIndex).toBeGreaterThan(heroIndex);
  });
});
