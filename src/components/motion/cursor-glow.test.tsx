import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CursorGlow } from "./cursor-glow";

describe("CursorGlow", () => {
  it("renders nothing when the environment doesn't support a fine pointer (test default)", () => {
    const { container } = render(<CursorGlow />);
    expect(container).toBeEmptyDOMElement();
  });
});
