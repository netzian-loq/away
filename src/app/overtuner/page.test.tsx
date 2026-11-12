import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OverTunerPage, { metadata } from "./page";
import { OVERTUNER } from "@/content/overtuner";
import { SITE } from "@/content/site";

async function renderPage() {
  return render(await OverTunerPage());
}

describe("OverTunerPage", () => {
  it("leads with the product name and what it is", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("OverTuner");
    expect(screen.getByText(OVERTUNER.tagline)).toBeInTheDocument();
  });

  /** The owner's brief: 40 euros a year, other terms agreed in a ticket. */
  it("states the yearly price and where the other terms are agreed", async () => {
    const { container } = await renderPage();
    const text = container.textContent ?? "";
    expect(text).toContain("40€");
    expect(text).toMatch(/per year/);
    expect(text).toMatch(/monthly or lifetime/i);
  });

  it("lists every feature from the brief", async () => {
    const { container } = await renderPage();
    const text = container.textContent ?? "";
    for (const group of OVERTUNER.groups) {
      for (const point of group.points) expect(text).toContain(point);
    }
  });

  it("sends every buy button to a Discord ticket", async () => {
    await renderPage();
    const buttons = screen.getAllByRole("link", { name: /Get OverTuner/ });
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) expect(button).toHaveAttribute("href", SITE.discordSupportUrl);
  });

  /** Overclocking results depend on the hardware; the page must not promise. */
  it("makes no guarantee or fixed performance promise", async () => {
    const { container } = await renderPage();
    const text = (container.textContent ?? "").toLowerCase();
    expect(text).not.toMatch(/guarantee|100% safe|can't brick|\+\d+% fps/);
  });

  it("is canonical at /overtuner", () => {
    expect(metadata.alternates?.canonical).toBe(`${SITE.url}/overtuner`);
  });
});
