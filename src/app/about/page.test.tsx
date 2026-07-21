import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AboutPage from "./page";
import { ABOUT } from "@/content/about";

describe("AboutPage", () => {
  it("renders the hero title and every method step", () => {
    render(<AboutPage />);
    expect(screen.getByRole("heading", { name: ABOUT.heroTitle })).toBeInTheDocument();
    for (const step of ABOUT.methodSteps) {
      expect(screen.getByRole("heading", { name: step.title })).toBeInTheDocument();
    }
  });
});
