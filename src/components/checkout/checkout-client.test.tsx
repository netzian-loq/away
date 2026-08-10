import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SITE } from "@/content/site";

vi.mock("next/script", () => ({ default: () => null }));

import { CheckoutClient } from "./checkout-client";

const PROPS = {
  initialTier: "pro-level",
  initialCode: "COSMO10",
  reference: "AWAY-K7P2QM",
  stripeEnabled: false,
};

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
  const direct = {
    initialTier: "pro-level",
    initialCode: "",
    reference: "AWAY-K7P2QM",
    stripeEnabled: false,
  };

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

describe("CheckoutClient card path (Stripe)", () => {
  const withStripe = { ...PROPS, stripeEnabled: true };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hides the card tab entirely when Stripe isn't configured", () => {
    render(<CheckoutClient {...PROPS} />);
    expect(screen.queryByRole("tab", { name: /^Card$/i })).not.toBeInTheDocument();
  });

  it("defaults to card when Stripe is configured", () => {
    render(<CheckoutClient {...withStripe} />);
    expect(screen.getByRole("tab", { name: /^Card$/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("names the discounted amount on the pay button", () => {
    render(<CheckoutClient {...withStripe} />);
    expect(screen.getByRole("button", { name: /Pay 58\.50€ by card/i })).toBeInTheDocument();
  });

  it("sends the slug and code — never a price — then redirects to Stripe", async () => {
    const user = userEvent.setup();
    const assign = vi.fn();
    vi.stubGlobal("location", { assign });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "cs_test_1", url: "https://checkout.stripe.com/c/pay/cs_test_1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<CheckoutClient {...withStripe} />);
    await user.click(screen.getByRole("button", { name: /Pay 58\.50€ by card/i }));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/stripe/create-session");
    const sent = JSON.parse(init.body);
    expect(sent).toEqual({ tier: "pro-level", code: "COSMO10", discord: "" });
    // The browser must never get to name its own price.
    expect(init.body).not.toMatch(/58\.50|amount|price/i);
    expect(assign).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/cs_test_1");
  });

  it("surfaces the server's error and stays on the page", async () => {
    const user = userEvent.setup();
    const assign = vi.fn();
    vi.stubGlobal("location", { assign });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Card payments aren't switched on yet." }),
      }),
    );

    render(<CheckoutClient {...withStripe} />);
    await user.click(screen.getByRole("button", { name: /Pay 58\.50€ by card/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Card payments aren't switched on yet.",
    );
    expect(assign).not.toHaveBeenCalled();
  });

  it("promises Stripe handles the card, not Away Tweaks", () => {
    render(<CheckoutClient {...withStripe} />);
    expect(screen.getByText(/never sees your card details/i)).toBeInTheDocument();
  });
});
