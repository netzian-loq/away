import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SITE } from "@/content/site";
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
    for (const stat of SITE.stats) {
      expect(screen.getByText(stat.label)).toBeInTheDocument();
    }
  });

  // The stats used to animate from zero on scroll. They're claims about the
  // business, so they should read the same whether or not you saw them arrive.
  //
  // Read from SITE rather than hardcoded: these are numbers the owner edits as
  // the business grows, and a test that has to be updated alongside each one is
  // a test that fails for the wrong reason. What's worth pinning is that the
  // rendered figure equals the content figure exactly.
  it("prints the stat values outright rather than counting up to them", () => {
    render(<Hero />);
    for (const stat of SITE.stats) {
      expect(screen.getByText(String(stat.value))).toBeInTheDocument();
    }
  });
});
