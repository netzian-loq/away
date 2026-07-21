import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppPreviewScroll } from "./app-preview-scroll";

describe("AppPreviewScroll", () => {
  it("renders the scroll hint and the app-preview content", () => {
    render(<AppPreviewScroll />);
    expect(screen.getByText("Scroll to tune")).toBeInTheDocument();
    expect(screen.getByText("Performance")).toBeInTheDocument();
    expect(screen.getByText("FPS Gained")).toBeInTheDocument();
    expect(screen.getByText("+600 FPS")).toBeInTheDocument();
    expect(screen.getByText("0ms Delay")).toBeInTheDocument();
  });
});
