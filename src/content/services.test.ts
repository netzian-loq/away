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

  it("gives Windows Tuning its two product screenshots", () => {
    const windowsTuning = SERVICES.find((s) => s.title === "Windows Tuning");
    expect(windowsTuning?.images).toHaveLength(2);
  });

  it("every service has at least one feature bullet", () => {
    for (const service of SERVICES) {
      expect(service.features.length).toBeGreaterThan(0);
    }
  });
});
