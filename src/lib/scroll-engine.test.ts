import { describe, expect, it } from "vitest";
import {
  resolveScrollPhase,
  scrollPositionFor,
  trackProgress,
  type ScrollPhase,
  type TrackGeometry,
  type TrackOptions,
} from "./scroll-engine";

describe("resolveScrollPhase", () => {
  it("calls a still page idle", () => {
    expect(resolveScrollPhase(0, "idle")).toBe("idle");
    // Sub-pixel drift is still "not moving" — otherwise the attribute churns
    // during the tail of an eased scroll.
    expect(resolveScrollPhase(0.2, "moving")).toBe("idle");
  });

  it("calls an ordinary scroll moving", () => {
    expect(resolveScrollPhase(4, "idle")).toBe("moving");
    expect(resolveScrollPhase(13, "moving")).toBe("moving");
  });

  it("drops to fast once the page is really shifting", () => {
    expect(resolveScrollPhase(14, "moving")).toBe("fast");
    expect(resolveScrollPhase(120, "idle")).toBe("fast");
  });

  it("holds fast through the gap so the class can't flap", () => {
    // Between the two thresholds the answer depends entirely on where it came
    // from: this is the hysteresis, and it's why `previous` is a parameter.
    expect(resolveScrollPhase(9, "fast")).toBe("fast");
    expect(resolveScrollPhase(9, "moving")).toBe("moving");
  });

  it("lets go of fast below the exit threshold", () => {
    expect(resolveScrollPhase(5, "fast")).toBe("moving");
    expect(resolveScrollPhase(0.1, "fast")).toBe("idle");
  });

  it("never invents a phase outside the three", () => {
    const phases: ScrollPhase[] = ["idle", "moving", "fast"];
    for (const previous of phases) {
      for (const speed of [0, 0.34, 0.35, 5.9, 6, 13.9, 14, 999]) {
        expect(phases).toContain(resolveScrollPhase(speed, previous));
      }
    }
  });
});

/** An 800px-tall element starting 2000px down a page with a 900px viewport. */
const GEOMETRY: TrackGeometry = { top: 2000, height: 800, viewport: 900 };

describe("scrollPositionFor", () => {
  it("puts the element's top at the bottom of the viewport", () => {
    expect(scrollPositionFor(GEOMETRY, ["start", 1])).toBe(2000 - 900);
  });

  it("puts the element's bottom at the top of the viewport", () => {
    expect(scrollPositionFor(GEOMETRY, ["end", 0])).toBe(2800);
  });

  it("centres the element in the viewport", () => {
    expect(scrollPositionFor(GEOMETRY, ["center", 0.5])).toBe(2400 - 450);
  });
});

/** The Parallax range: enters at the bottom edge, leaves past the top. */
const CROSSING: TrackOptions = { from: ["start", 1], to: ["end", 0] };

describe("trackProgress", () => {
  it("is 0 the moment the element touches the bottom of the viewport", () => {
    expect(trackProgress(GEOMETRY, 1100, CROSSING)).toBe(0);
  });

  it("is 1 the moment it clears the top", () => {
    expect(trackProgress(GEOMETRY, 2800, CROSSING)).toBe(1);
  });

  it("runs linearly in between", () => {
    expect(trackProgress(GEOMETRY, 1950, CROSSING)).toBeCloseTo(0.5, 5);
  });

  it("clamps rather than running past either end", () => {
    expect(trackProgress(GEOMETRY, 0, CROSSING)).toBe(0);
    expect(trackProgress(GEOMETRY, 99999, CROSSING)).toBe(1);
  });

  it("holds the end value once the element is well out of view", () => {
    // Far above the viewport → still 0; far below → still 1. Effects settle
    // instead of being left mid-interpolation when they scroll off.
    expect(trackProgress(GEOMETRY, 10, CROSSING)).toBe(0);
    expect(trackProgress(GEOMETRY, 5000, CROSSING)).toBe(1);
  });

  it("handles the ScrollScale range, which ends mid-viewport", () => {
    const settle: TrackOptions = { from: ["start", 1], to: ["center", 0.5] };
    expect(trackProgress(GEOMETRY, 1100, settle)).toBe(0);
    expect(trackProgress(GEOMETRY, 1950, settle)).toBe(1);
  });

  it("survives a zero-length range instead of dividing by zero", () => {
    const degenerate: TrackOptions = { from: ["start", 1], to: ["start", 1] };
    expect(trackProgress(GEOMETRY, 1100, degenerate)).toBe(1);
  });

  it("never returns NaN for a zero-height element", () => {
    const empty: TrackGeometry = { top: 500, height: 0, viewport: 900 };
    const progress = trackProgress(empty, 400, CROSSING);
    expect(Number.isNaN(progress)).toBe(false);
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(1);
  });
});
