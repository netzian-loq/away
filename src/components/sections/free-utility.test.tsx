import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FreeUtility } from "./free-utility";
import { FREE_UTILITY } from "@/content/free-utility";
import { SITE } from "@/content/site";

describe("FreeUtility", () => {
  it("renders the title and every point", () => {
    render(<FreeUtility />);
    expect(screen.getByRole("heading", { name: FREE_UTILITY.title })).toBeInTheDocument();
    for (const point of FREE_UTILITY.points) {
      expect(screen.getByText(point)).toBeInTheDocument();
    }
  });

  it("is named Away Utility, never Away Free Utility or Away Setup", () => {
    render(<FreeUtility />);
    const text = document.body.textContent ?? "";
    expect(text).toContain("Away Utility");
    expect(text).not.toMatch(/Away Free Utility/);
    expect(text).not.toMatch(/Away Setup/i);
  });

  it("presents itself as free outright, not free with a purchase", () => {
    render(<FreeUtility />);
    expect(screen.getByText(FREE_UTILITY.ctaCaption)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/free with any .* order/i);
  });

  it("links to the Discord server", () => {
    render(<FreeUtility />);
    expect(screen.getByRole("link", { name: /Get it on Discord/i })).toHaveAttribute(
      "href",
      SITE.discordServerUrl,
    );
  });
});
