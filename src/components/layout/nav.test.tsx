import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Nav } from "./nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/services",
}));

describe("Nav", () => {
  it("renders links to all 4 pages", () => {
    render(<Nav />);
    expect(screen.getAllByRole("link", { name: "Home" })[0]).toHaveAttribute("href", "/");
    expect(screen.getAllByRole("link", { name: "Services" })[0]).toHaveAttribute("href", "/services");
    expect(screen.getAllByRole("link", { name: "About" })[0]).toHaveAttribute("href", "/about");
    expect(screen.getAllByRole("link", { name: "Contact" })[0]).toHaveAttribute("href", "/contact");
  });

  it("renders a Get Optimized CTA linking to /contact", () => {
    render(<Nav />);
    const ctas = screen.getAllByRole("link", { name: /Get Optimized/i });
    expect(ctas[0]).toHaveAttribute("href", "/contact");
  });
});
