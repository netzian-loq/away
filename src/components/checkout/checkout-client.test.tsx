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
  paypalEnabled: false,
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
    expect(link).toHaveAttribute("href", `https://paypal.me/${SITE.paypalMeHandle}/63.00EUR`);
  });

  it("switches to bank transfer and drops the Friends & Family notice", async () => {
    const user = userEvent.setup();
    render(<CheckoutClient {...PROPS} />);

    await user.click(screen.getByRole("tab", { name: /^Bank$/i }));

    // The account details moved into the ticket — the page no longer prints
    // the IBAN, and there is no button claiming a transfer has been sent.
    expect(screen.getByText(/Confirmed in a ticket/i)).toBeInTheDocument();
    expect(screen.queryByText(SITE.bank.iban)).not.toBeInTheDocument();
    expect(screen.queryByText(/Send as Friends & Family/i)).not.toBeInTheDocument();
  });

  it("applies the partner code to the total", () => {
    render(<CheckoutClient {...PROPS} />);
    expect(screen.getByText(/Cosmo eSports — 10% off applied/i)).toBeInTheDocument();
    // Discounted price shows twice: on the selected package card and as the total.
    expect(screen.getAllByText("63€").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("−7€")).toBeInTheDocument();
  });
});

describe("CheckoutClient partner discount gating", () => {
  const direct = {
    initialTier: "pro-level",
    initialCode: "",
    reference: "AWAY-K7P2QM",
    paypalEnabled: false,
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
    expect(screen.getAllByText("70€").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("63€")).not.toBeInTheDocument();

    const paypal = screen
      .getAllByRole("link")
      .find((a) => a.getAttribute("href")?.includes("paypal.me"));
    expect(paypal).toHaveAttribute("href", `https://paypal.me/${SITE.paypalMeHandle}/70.00EUR`);
  });

  it("ignores an unrecognised code in the URL instead of hinting one exists", () => {
    render(<CheckoutClient {...direct} initialCode="NOTACODE" />);
    expect(screen.queryByText(/% off applied/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("70€").length).toBeGreaterThanOrEqual(1);
  });

  it("applies the discount when the partner link carried the code", () => {
    render(<CheckoutClient {...direct} initialCode="COSMO10" />);
    expect(screen.getByText(/Cosmo eSports — 10% off applied/i)).toBeInTheDocument();
    expect(screen.getAllByText("63€").length).toBeGreaterThanOrEqual(2);
  });

  it("accepts the code however the link cased it", () => {
    render(<CheckoutClient {...direct} initialCode=" cosmo10 " />);
    expect(screen.getByText(/Cosmo eSports — 10% off applied/i)).toBeInTheDocument();
  });
});

describe("CheckoutClient card path (PayPal card funding)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  /**
   * The card button is PayPal's, so it needs both halves of the credential:
   * the secret (via the prop) and the client id the SDK is loaded with.
   */
  function configured() {
    vi.stubEnv("NEXT_PUBLIC_PAYPAL_CLIENT_ID", "test-client-id");
    return { ...PROPS, paypalEnabled: true };
  }

  it("shows the card tab as coming soon, not missing, until PayPal is configured", () => {
    render(<CheckoutClient {...PROPS} />);
    const tab = screen.getByRole("tab", { name: /Card/i });
    expect(tab).toBeDisabled();
    expect(tab).toHaveTextContent(/soon/i);
  });

  it("falls back to PayPal as the selected tab while card is unavailable", () => {
    render(<CheckoutClient {...PROPS} />);
    expect(screen.getByRole("tab", { name: /^PayPal$/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  /**
   * Half a credential is the case that used to fail after the click, with a
   * rendered button and a 503 from create-order. Neither tab may offer one.
   */
  it("keeps card off when the client id is set but the secret isn't", () => {
    vi.stubEnv("NEXT_PUBLIC_PAYPAL_CLIENT_ID", "test-client-id");
    render(<CheckoutClient {...PROPS} paypalEnabled={false} />);
    expect(screen.getByRole("tab", { name: /Card/i })).toBeDisabled();
  });

  it("defaults to card once PayPal is fully configured", () => {
    render(<CheckoutClient {...configured()} />);
    const tab = screen.getByRole("tab", { name: /^Card$/i });
    expect(tab).toBeEnabled();
    expect(tab).toHaveAttribute("aria-selected", "true");
  });

  it("waits on PayPal's SDK rather than showing an empty panel", () => {
    render(<CheckoutClient {...configured()} />);
    expect(screen.getByText(/Loading the card form/i)).toBeInTheDocument();
  });

  it("drops the PayPal.Me Friends & Family path once the API is configured", () => {
    render(<CheckoutClient {...configured()} />);
    expect(screen.queryByText(/Send as Friends & Family/i)).not.toBeInTheDocument();
  });

  it("promises the card is entered on PayPal's form, not this site", () => {
    render(<CheckoutClient {...configured()} />);
    expect(screen.getByText(/no PayPal account needed/i)).toBeInTheDocument();
    expect(screen.getByText(/never sees your card details/i)).toBeInTheDocument();
  });
});

describe("CheckoutClient crypto tab", () => {
  it("is always open now that crypto is settled in a ticket", async () => {
    const user = userEvent.setup();
    render(<CheckoutClient {...PROPS} />);

    const tab = screen.getByRole("tab", { name: /^Crypto$/i });
    expect(tab).toBeEnabled();

    await user.click(tab);
    expect(screen.getByText(/Handled in a ticket/i)).toBeInTheDocument();
  });

  it("takes no payment on the page and says so", async () => {
    const user = userEvent.setup();
    render(<CheckoutClient {...PROPS} />);

    await user.click(screen.getByRole("tab", { name: /^Crypto$/i }));
    expect(screen.getByText(/No payment is taken here/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pay 63.00€ in crypto/i })).toBeInTheDocument();
  });
});
