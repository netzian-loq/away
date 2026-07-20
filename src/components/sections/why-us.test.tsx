import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WhyUs } from "./why-us";
import { WHY_REASONS } from "@/content/why";

describe("WhyUs", () => {
  it("renders every reason", () => {
    render(<WhyUs />);
    for (const reason of WHY_REASONS) {
      expect(screen.getByText(reason.title)).toBeInTheDocument();
    }
  });
});
