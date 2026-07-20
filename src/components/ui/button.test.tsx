import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders its children as a button", () => {
    render(<Button>Get Optimized</Button>);
    expect(screen.getByRole("button", { name: "Get Optimized" })).toBeInTheDocument();
  });

  it("applies outline-variant styling", () => {
    render(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button")).toHaveClass("border");
  });
});
