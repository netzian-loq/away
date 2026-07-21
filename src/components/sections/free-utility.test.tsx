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

  it("links to the Discord server", () => {
    render(<FreeUtility />);
    expect(screen.getByRole("link", { name: /Get it on Discord/i })).toHaveAttribute(
      "href",
      SITE.discordServerUrl,
    );
  });
});
