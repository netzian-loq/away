import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Counter } from "./counter";

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return { ...actual, useInView: () => true };
});

describe("Counter", () => {
  it("counts up to the target value and appends the suffix", async () => {
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
      now += 250;
      cb(now);
      return 0;
    });

    render(<Counter to={40} suffix="+" duration={0.2} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText("40+")).toBeInTheDocument();
  });
});
