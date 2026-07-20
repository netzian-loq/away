import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServicesFull } from "./services-full";
import { SERVICES } from "@/content/services";

describe("ServicesFull", () => {
  it("renders full detail for every service, including every feature bullet", () => {
    render(<ServicesFull />);
    for (const service of SERVICES) {
      expect(screen.getByRole("heading", { name: service.title })).toBeInTheDocument();
      for (const feature of service.features) {
        expect(screen.getAllByText(feature).length).toBeGreaterThan(0);
      }
    }
  });
});
