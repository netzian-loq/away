import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SITE } from "@/content/site";
import { Nav } from "./nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/services",
}));

describe("Nav", () => {
  it("renders a link for every nav entry in site content", () => {
    render(<Nav />);
    for (const item of SITE.nav) {
      expect(screen.getAllByRole("link", { name: item.label })[0]).toHaveAttribute(
        "href",
        item.href,
      );
    }
  });

  it("offers no route to the retired contact page", () => {
    render(<Nav />);
    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs).not.toContain("/contact");
  });

  // Every "Get Optimized" on the site sends people to the packages, not to a
  // form. It used to open the contact page, which asked someone who had already
  // decided to buy to write a message and wait.
  it("points both Get Optimized CTAs at checkout", () => {
    render(<Nav />);
    const ctas = screen.getAllByRole("link", { name: /Get Optimized/i });
    expect(ctas.length).toBeGreaterThan(0);
    for (const cta of ctas) {
      expect(cta).toHaveAttribute("href", "/checkout");
    }
  });
});
