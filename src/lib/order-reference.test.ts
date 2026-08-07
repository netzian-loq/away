import { describe, expect, it } from "vitest";
import { generateOrderReference, isValidOrderReference } from "./order-reference";

describe("order references", () => {
  it("generates AWAY-prefixed references of a fixed length", () => {
    const reference = generateOrderReference();
    expect(reference).toMatch(/^AWAY-[2-9A-HJ-NP-Z]{6}$/);
    expect(reference).toHaveLength(11);
  });

  it("never emits characters that get mis-read off a screen", () => {
    const body = Array.from({ length: 200 }, () => generateOrderReference().slice(5)).join("");
    expect(body).not.toMatch(/[01OI]/);
  });

  it("does not collide across a realistic number of orders", () => {
    const references = new Set(Array.from({ length: 1000 }, generateOrderReference));
    expect(references.size).toBe(1000);
  });

  it("validates its own output and rejects anything else", () => {
    expect(isValidOrderReference(generateOrderReference())).toBe(true);
    expect(isValidOrderReference("AWAY-ABC")).toBe(false);
    expect(isValidOrderReference("away-abcdef")).toBe(false);
    expect(isValidOrderReference("AWAY-ABC0IO")).toBe(false);
    expect(isValidOrderReference("")).toBe(false);
  });
});
