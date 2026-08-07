import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SITE } from "@/content/site";

vi.mock("next/script", () => ({ default: () => null }));

import { CheckoutClient } from "./checkout-client";

const PROPS = { initialTier: "pro-level", initialCode: "COSMO10", reference: "AWAY-K7P2QM" };

// With no NEXT_PUBLIC_PAYPAL_CLIENT_ID in the test env, the component renders
// the PayPal.Me path — the one that's actually live today.
describe("CheckoutClient (manual PayPal path)", () => {
  it("tells the buyer to send as Friends & Family, or be refunded", () => {
    render(<CheckoutClient {...PROPS} />);
    expect(screen.getByText(/Send as Friends & Family/i)).toBeInTheDocument();
    expect(screen.getByText(/will be refunded/i)).toBeInTheDocument();
  });

  it("links to PayPal.Me for the discounted amount", () => {
    render(<CheckoutClient {...PROPS} />);
    const link = screen
      .getAllByRole("link")
      .find((anchor) => anchor.getAttribute("href")?.includes("paypal.me"));
    expect(link).toHaveAttribute("href", `https://paypal.me/${SITE.paypalMeHandle}/58.50EUR`);
  });

  it("switches to bank transfer and drops the Friends & Family notice", async () => {
    const user = userEvent.setup();
    render(<CheckoutClient {...PROPS} />);

    await user.click(screen.getByRole("tab", { name: /Bank transfer/i }));

    expect(screen.getByText(SITE.bank.iban)).toBeInTheDocument();
    expect(screen.queryByText(/Send as Friends & Family/i)).not.toBeInTheDocument();
  });

  it("applies the partner code to the total", () => {
    render(<CheckoutClient {...PROPS} />);
    expect(screen.getByText(/Cosmo eSports — 10% off applied/i)).toBeInTheDocument();
    // Discounted price shows twice: on the selected package card and as the total.
    expect(screen.getAllByText("58.50€").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("−6.50€")).toBeInTheDocument();
  });
});
