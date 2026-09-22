import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname }));

import { CheckoutLink } from "./checkout-link";

beforeEach(() => {
  usePathname.mockReset();
});

describe("CheckoutLink", () => {
  it("links to a plain checkout on an ordinary page", () => {
    usePathname.mockReturnValue("/services");
    render(<CheckoutLink>Buy</CheckoutLink>);
    expect(screen.getByRole("link", { name: "Buy" })).toHaveAttribute("href", "/checkout");
  });

  /** The attribution leak this component exists to close. */
  it("keeps the partner's code on their landing page", () => {
    usePathname.mockReturnValue("/jesterfv1");
    render(<CheckoutLink>Get Optimized</CheckoutLink>);
    expect(screen.getByRole("link", { name: "Get Optimized" })).toHaveAttribute(
      "href",
      "/checkout?code=JESTER5",
    );
  });

  it("passes other link props through", () => {
    usePathname.mockReturnValue("/");
    render(<CheckoutLink className="tap-target">Buy</CheckoutLink>);
    expect(screen.getByRole("link", { name: "Buy" })).toHaveClass("tap-target");
  });
});
