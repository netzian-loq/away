import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Faq } from "./faq";
import { FAQ } from "@/content/faq";
import { OVERTUNER } from "@/content/overtuner";

describe("Faq", () => {
  it("is headed 'Questions'", () => {
    render(<Faq />);
    expect(screen.getByRole("heading", { level: 2, name: "Questions" })).toBeInTheDocument();
  });

  it("renders every entry as a native details row, closed by default", () => {
    const { container } = render(<Faq />);
    const rows = container.querySelectorAll("details");
    expect(rows).toHaveLength(FAQ.length);
    rows.forEach((row, i) => {
      expect(row.open).toBe(false);
      expect(row.querySelector("summary")).toHaveTextContent(FAQ[i].question);
      expect(row).toHaveTextContent(FAQ[i].answer);
    });
  });

  it("quotes prices from the content rather than retyping them", () => {
    const cost = FAQ.find((entry) => entry.question === "What does OverTuner cost?");
    expect(cost?.answer).toContain(`${OVERTUNER.yearlyPrice}€ per year`);
  });

  // No FAQPage structured data: Google only shows FAQ rich results for
  // government and health sites now, so it would be dead weight.
  it("emits no JSON-LD", () => {
    const { container } = render(<Faq />);
    expect(container.querySelector('script[type="application/ld+json"]')).toBeNull();
  });
});
