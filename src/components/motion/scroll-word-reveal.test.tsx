import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScrollWordReveal } from "./scroll-word-reveal";

describe("ScrollWordReveal", () => {
  it("renders every word of the text as its own span", () => {
    render(<ScrollWordReveal text="Tuned for absolute speed" highlights={["speed"]} />);
    for (const word of ["Tuned", "for", "absolute", "speed"]) {
      expect(screen.getByText(word)).toBeInTheDocument();
    }
  });

  it("keeps words in their original order", () => {
    const { container } = render(<ScrollWordReveal text="one two three" />);
    expect(container.textContent?.replace(/\s+/g, " ").trim()).toBe("one two three");
  });
});
