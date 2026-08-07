import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DiscountCode } from "./discount-code";

const PROPS = {
  code: "COSMO10",
  percentOff: 10,
  eyebrow: "Away Tweaks x Cosmo",
  body: "Cosmo players get a cut on Away Tweaks.",
  label: "Use code",
  hint: "Tap to copy",
};

/**
 * Must be called *after* userEvent.setup() — user-event installs its own
 * navigator.clipboard stub on setup, which would otherwise replace this one.
 */
function mockClipboard(writeText = vi.fn().mockResolvedValue(undefined)) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
    writable: true,
  });
  return writeText;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("DiscountCode", () => {
  it("shows the code and the discount", () => {
    render(<DiscountCode {...PROPS} />);
    expect(screen.getByRole("button", { name: /Copy discount code COSMO10/i })).toBeInTheDocument();
    expect(screen.getByText("COSMO10")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("Tap to copy")).toBeInTheDocument();
  });

  it("copies the code to the clipboard and confirms for 2 seconds", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const writeText = mockClipboard();
    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(<DiscountCode {...PROPS} />);
    await user.click(screen.getByRole("button", { name: /Copy discount code COSMO10/i }));

    expect(writeText).toHaveBeenCalledWith("COSMO10");
    expect(await screen.findByText("Copied!")).toBeInTheDocument();

    // act() so React flushes the reset that the timeout schedules.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(screen.queryByText("Copied!")).not.toBeInTheDocument();
    expect(screen.getByText("Tap to copy")).toBeInTheDocument();
  });

  it("still confirms when the clipboard API is blocked", async () => {
    const user = userEvent.setup();
    mockClipboard(vi.fn().mockRejectedValue(new Error("denied")));

    render(<DiscountCode {...PROPS} />);
    await user.click(screen.getByRole("button", { name: /Copy discount code COSMO10/i }));

    expect(await screen.findByText("Copied!")).toBeInTheDocument();
  });

  it("renders the checkout CTA only when a link is given", () => {
    const { rerender } = render(<DiscountCode {...PROPS} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    rerender(<DiscountCode {...PROPS} ctaHref="/checkout?code=COSMO10" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/checkout?code=COSMO10");
  });
});
