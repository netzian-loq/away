import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("gsap", () => ({
  gsap: {
    registerPlugin: vi.fn(),
    fromTo: vi.fn(() => ({ scrollTrigger: { kill: vi.fn() }, kill: vi.fn() })),
  },
}));
vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: {} }));

import { VideoShowcase } from "./video-showcase";

describe("VideoShowcase", () => {
  it("renders the AwayOS preview heading without loading real GSAP or YouTube", () => {
    render(<VideoShowcase />);
    expect(screen.getByRole("heading", { name: /AwayOS in action/i })).toBeInTheDocument();
  });
});
