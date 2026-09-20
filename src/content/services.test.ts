import { describe, expect, it } from "vitest";
import { SERVICES } from "./services";

describe("SERVICES", () => {
  it("has exactly 9 services with the preserved prices", () => {
    expect(SERVICES).toHaveLength(9);
    const prices = Object.fromEntries(SERVICES.map((s) => [s.title, s.priceLabel]));
    expect(prices).toEqual({
      "RAM Overclocking": "50€",
      "CPU Overclocking": "27€",
      "GPU Overclocking": "18€",
      "BIOS Full Tuning": "15€",
      "AwayOS + Windows Tuning": "27€",
      "AwayOS + Extreme Windows Tuning": "32€",
      "Windows Tuning": "25€",
      "Extreme Windows Tuning": "30€",
      "Network Optimization": "10€",
    });
  });

  it("keeps the price label and the charged value in step", () => {
    // The label is what the page prints; the value is what checkout charges.
    // A mismatch would advertise one price and take another.
    for (const service of SERVICES) {
      expect(service.priceLabel).toBe(`${service.priceValue}€`);
    }
  });

  it("sorts every service into one of the two categories", () => {
    for (const service of SERVICES) {
      expect(["overclocking", "windows"]).toContain(service.category);
    }
  });

  it("ships no placeholder screenshots", () => {
    // The `images` field still exists and still renders — it's just empty
    // until real screenshots replace the placeholders that used to be here.
    for (const service of SERVICES) {
      for (const image of service.images ?? []) {
        expect(image.src).not.toMatch(/awayos-(desktop|setup)\.svg/);
        expect(image.caption).not.toMatch(/placeholder/i);
      }
    }
  });

  it("gives every service a slug that checkout can price", () => {
    for (const service of SERVICES) {
      expect(service.slug).toMatch(/^[a-z0-9-]+$/);
      expect(service.priceValue).toBeGreaterThan(0);
    }
  });

  it("calls the free tool Away Utility, never Away Free Utility or Away Setup", () => {
    const copy = JSON.stringify(SERVICES.map(({ description, features, highlight }) => ({
      description,
      features,
      highlight,
    })));
    expect(copy).toContain("Away Utility");
    expect(copy).not.toMatch(/Away Free Utility/);
    expect(copy).not.toMatch(/Away Setup/i);
  });

  it("every service has at least one feature bullet", () => {
    for (const service of SERVICES) {
      expect(service.features.length).toBeGreaterThan(0);
    }
  });
});
