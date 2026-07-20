import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "./footer";
import { SERVICES } from "@/content/services";

describe("Footer", () => {
  it("lists every service", () => {
    render(<Footer />);
    for (const service of SERVICES) {
      expect(screen.getAllByText(service.title)[0]).toBeInTheDocument();
    }
  });

  it("shows the current year in the copyright line", () => {
    render(<Footer />);
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
  });
});
