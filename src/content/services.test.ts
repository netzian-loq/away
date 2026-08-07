import { describe, expect, it } from "vitest";
import { SERVICES } from "./services";

describe("SERVICES", () => {
  it("has exactly 6 services with the preserved prices", () => {
    expect(SERVICES).toHaveLength(6);
    const prices = Object.fromEntries(SERVICES.map((s) => [s.title, s.priceLabel]));
    expect(prices).toEqual({
      "Windows Tuning": "25€",
      "GPU Overclocking": "15€",
      "RAM Overclocking": "45€",
      "CPU Overclocking": "25€",
      "Network Tuning": "10€",
      "BIOS Tuning": "12€",
    });
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

  it("every service has at least one feature bullet", () => {
    for (const service of SERVICES) {
      expect(service.features.length).toBeGreaterThan(0);
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
});
