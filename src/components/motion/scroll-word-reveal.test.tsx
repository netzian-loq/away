import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScrollWordReveal, wordSettle } from "./scroll-word-reveal";

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

  it("renders at rest, so the paragraph is readable before hydration", () => {
    const { container } = render(<ScrollWordReveal text="one two three" />);
    for (const span of container.querySelectorAll(".word-reveal > span")) {
      expect(span.getAttribute("style")).toBeNull();
    }
  });
});

describe("wordSettle", () => {
  const COUNT = 39;

  it("leaves every word unlit before the paragraph is reached", () => {
    for (let i = 0; i < COUNT; i += 1) expect(wordSettle(0, i, COUNT)).toBe(0);
  });

  it("finishes every word — including the last — by the end of the range", () => {
    // Two bugs live here. Sizing the sweep to the word count alone leaves the
    // tail of the paragraph permanently part-lit, because the last word's fade
    // needs room *past* its own index to finish. And the result has to be
    // *exactly* 1, not 0.9999999999999998 — the component clears a word's
    // inline styles on an exact match, so float dust leaves every paragraph
    // carrying a set of no-op styles forever.
    for (const count of [1, 2, 3, 7, 12, COUNT, 80]) {
      for (let i = 0; i < count; i += 1) {
        expect(wordSettle(1, i, count)).toBe(1);
      }
    }
  });

  it("lights words in order", () => {
    const states = Array.from({ length: COUNT }, (_, i) => wordSettle(0.5, i, COUNT));
    for (let i = 1; i < states.length; i += 1) {
      expect(states[i]).toBeLessThanOrEqual(states[i - 1]);
    }
  });

  it("keeps only a couple of words mid-fade at any moment", () => {
    // This is what makes the per-frame cost trivial: everything else is
    // already at 0 or 1 and gets skipped by the epsilon check.
    for (const progress of [0.1, 0.25, 0.4, 0.6, 0.75, 0.9]) {
      const partial = Array.from({ length: COUNT }, (_, i) =>
        wordSettle(progress, i, COUNT),
      ).filter((state) => state > 0 && state < 1);
      expect(partial.length).toBeLessThanOrEqual(3);
    }
  });

  it("stays within 0–1 for any input", () => {
    for (const progress of [-1, 0, 0.33, 1, 2]) {
      for (const i of [0, 5, COUNT - 1]) {
        const state = wordSettle(progress, i, COUNT);
        expect(state).toBeGreaterThanOrEqual(0);
        expect(state).toBeLessThanOrEqual(1);
      }
    }
  });

  it("handles a one-word paragraph", () => {
    expect(wordSettle(0, 0, 1)).toBe(0);
    expect(wordSettle(1, 0, 1)).toBe(1);
  });
});
