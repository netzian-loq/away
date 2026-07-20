import { describe, expect, it } from "vitest";
import { WHY_REASONS } from "./why";

describe("WHY_REASONS", () => {
  it("has 7 reasons, each with a title and description", () => {
    expect(WHY_REASONS).toHaveLength(7);
    for (const reason of WHY_REASONS) {
      expect(reason.title.length).toBeGreaterThan(0);
      expect(reason.description.length).toBeGreaterThan(0);
    }
  });
});
