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

describe("CheckoutClient partner discount gating", () => {
  const direct = { initialTier: "pro-level", initialCode: "", reference: "AWAY-K7P2QM" };

  it("never mentions a discount to someone who arrived without a partner link", () => {
    render(<CheckoutClient {...direct} />);

    // The code itself must not leak — it used to sit in the input's placeholder,
    // advertising a partner's rate to every visitor.
    expect(document.body.textContent).not.toMatch(/COSMO/i);
    expect(screen.queryByText(/% off applied/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/discount/i)).not.toBeInTheDocument();
  });

  it("offers no way to type a code in", () => {
    render(<CheckoutClient {...direct} />);
    expect(screen.queryByLabelText(/discount code/i)).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/COSMO/i),
    ).not.toBeInTheDocument();
  });

  it("charges full price without a partner link", () => {
    render(<CheckoutClient {...direct} />);
    expect(screen.getAllByText("65.00€").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("58.50€")).not.toBeInTheDocument();

    const paypal = screen
      .getAllByRole("link")
      .find((a) => a.getAttribute("href")?.includes("paypal.me"));
    expect(paypal).toHaveAttribute("href", `https://paypal.me/${SITE.paypalMeHandle}/65.00EUR`);
  });

  it("ignores an unrecognised code in the URL instead of hinting one exists", () => {
    render(<CheckoutClient {...direct} initialCode="NOTACODE" />);
    expect(screen.queryByText(/% off applied/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("65.00€").length).toBeGreaterThanOrEqual(1);
  });

  it("applies the discount when the partner link carried the code", () => {
    render(<CheckoutClient {...direct} initialCode="COSMO10" />);
    expect(screen.getByText(/Cosmo eSports — 10% off applied/i)).toBeInTheDocument();
    expect(screen.getAllByText("58.50€").length).toBeGreaterThanOrEqual(2);
  });

  it("accepts the code however the link cased it", () => {
    render(<CheckoutClient {...direct} initialCode=" cosmo10 " />);
    expect(screen.getByText(/Cosmo eSports — 10% off applied/i)).toBeInTheDocument();
  });
});
