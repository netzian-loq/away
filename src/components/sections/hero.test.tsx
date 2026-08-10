import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "./hero";

describe("Hero", () => {
  it("leads with the claim, not the company name", () => {
    render(<Hero />);
    expect(
      screen.getByRole("heading", { name: /Stop losing fights to your own PC/i }),
    ).toBeInTheDocument();
  });

  it("sends the primary CTA to checkout and offers a lower-commitment second step", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: /See packages and prices/i })).toHaveAttribute(
      "href",
      "/checkout",
    );
    expect(screen.getByRole("link", { name: /tell us your specs/i })).toHaveAttribute(
      "href",
      "/contact",
    );
  });

  it("renders every stat label from site content", () => {
    render(<Hero />);
    expect(screen.getByText("Rigs tuned")).toBeInTheDocument();
    expect(screen.getByText("Average rating")).toBeInTheDocument();
  });

  // The stats used to animate from zero on scroll. They're claims about the
  // business, so they should read the same whether or not you saw them arrive.
  it("prints the stat values outright rather than counting up to them", () => {
    render(<Hero />);
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("99")).toBeInTheDocument();
  });
});
