import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VideoShowcase } from "./video-showcase";

describe("VideoShowcase", () => {
  it("renders the AwayOS preview heading without loading the real YouTube player", () => {
    render(<VideoShowcase />);
    expect(screen.getByRole("heading", { name: /AwayOS in action/i })).toBeInTheDocument();
  });
});
