import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MaskReveal, MaskRevealLines } from "./mask-reveal";

describe("MaskReveal", () => {
  it("clips its content behind an overflow-hidden mask", () => {
    const { container } = render(<MaskReveal>Tuned for speed</MaskReveal>);
    expect(screen.getByText("Tuned for speed")).toBeInTheDocument();
    expect((container.firstElementChild as HTMLElement).style.overflow).toBe("hidden");
  });

  it("renders inline elements when asked for a span", () => {
    const { container } = render(<MaskReveal as="span">Inline</MaskReveal>);
    expect(container.firstElementChild?.tagName).toBe("SPAN");
  });
});

describe("MaskRevealLines", () => {
  it("renders every line in order", () => {
    const { container } = render(<MaskRevealLines lines={["First line", "Second line"]} />);
    expect(container.textContent).toBe("First lineSecond line");
  });
});
