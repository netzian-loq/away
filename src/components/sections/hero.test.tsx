import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "./hero";

describe("Hero", () => {
  it("renders the headline and both primary CTAs", () => {
    render(<Hero />);
    expect(screen.getByRole("heading", { name: "Away Tweaks." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Contact now/i })).toHaveAttribute("href", "/contact");
    expect(screen.getByRole("link", { name: /View PRO tweaks/i })).toHaveAttribute("href", "/services");
  });

  it("renders every stat label from site content", () => {
    render(<Hero />);
    expect(screen.getByText("Rigs tuned")).toBeInTheDocument();
    expect(screen.getByText("Average rating")).toBeInTheDocument();
  });
});
