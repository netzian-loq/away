import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SoftwareLinks } from "./software-links";

describe("SoftwareLinks", () => {
  it("is headed 'Our own tools'", () => {
    render(<SoftwareLinks />);
    expect(screen.getByRole("heading", { level: 2, name: "Our own tools" })).toBeInTheDocument();
  });

  it("links to both product pages with a one-line description each", () => {
    render(<SoftwareLinks />);
    const uefi = screen.getByRole("link", { name: /Uefi-Kompile/ });
    expect(uefi).toHaveAttribute("href", "/uefi-kompile");
    expect(uefi).toHaveTextContent("BIOS tuning tool");

    const overtuner = screen.getByRole("link", { name: /OverTuner/ });
    expect(overtuner).toHaveAttribute("href", "/overtuner");
    expect(overtuner).toHaveTextContent("Nvidia GPU overclocking and tuning app");
  });
});
