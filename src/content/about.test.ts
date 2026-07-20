import { describe, expect, it } from "vitest";
import { ABOUT } from "./about";

describe("ABOUT", () => {
  it("has hero, mission, and CTA copy", () => {
    expect(ABOUT.heroTitle.length).toBeGreaterThan(0);
    expect(ABOUT.heroBody.length).toBeGreaterThan(0);
    expect(ABOUT.missionBody.length).toBeGreaterThan(0);
    expect(ABOUT.ctaBody.length).toBeGreaterThan(0);
  });

  it("has exactly 4 method steps", () => {
    expect(ABOUT.methodSteps).toHaveLength(4);
  });
});
