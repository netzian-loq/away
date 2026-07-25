import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CursorGlow } from "./cursor-glow";

describe("CursorGlow", () => {
  it("renders the glow layer invisible (opacity 0) until the pointer moves", () => {
    const { container } = render(<CursorGlow />);
    const glow = container.querySelector('div[aria-hidden="true"]');
    expect(glow).toBeInTheDocument();
    expect(glow).toHaveClass("opacity-0");
    expect(glow).toHaveClass("pointer-events-none");
  });
});
