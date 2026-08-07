import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SITE } from "@/content/site";
import { PRICING_TIERS } from "@/content/pricing";
import { PURCHASE_THANK_YOU } from "@/lib/email-copy";

const { submitBankTransferOrder } = vi.hoisted(() => ({
  submitBankTransferOrder: vi.fn(),
}));

vi.mock("@/actions/bank-transfer", () => ({ submitBankTransferOrder }));

import { BankTransfer } from "./bank-transfer";

const PRO = PRICING_TIERS.find((tier) => tier.slug === "pro-level")!;
// Arrived at checkout well before submitting, as a real buyer would have.
const startedAtRef = { current: Date.now() - 10_000 };
const PROPS = {
  tier: PRO,
  amount: "58.50",
  code: "COSMO10",
  reference: "AWAY-K7P2QM",
  startedAtRef,
};

beforeEach(() => {
  vi.clearAllMocks();
  submitBankTransferOrder.mockResolvedValue({ status: "idle" });
});

describe("BankTransfer", () => {
  it("shows the IBAN, the account holder and the payment reference", () => {
    render(<BankTransfer {...PROPS} />);
    expect(screen.getByText(SITE.bank.iban)).toBeInTheDocument();
    expect(screen.getByText(SITE.bank.accountHolder)).toBeInTheDocument();
    expect(screen.getAllByText("AWAY-K7P2QM").length).toBeGreaterThan(0);
    expect(screen.getByText("58.50 EUR")).toBeInTheDocument();
  });

  it("copies the IBAN to the clipboard", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true,
    });

    render(<BankTransfer {...PROPS} />);
    await user.click(screen.getByRole("button", { name: /Copy IBAN/i }));

    expect(writeText).toHaveBeenCalledWith(SITE.bank.iban);
  });

  it("submits the package, code and reference the server needs", async () => {
    const user = userEvent.setup();
    render(<BankTransfer {...PROPS} />);

    await user.type(screen.getByLabelText("Email"), "grinder@example.com");
    await user.type(screen.getByLabelText("Discord username"), "luca");
    await user.click(screen.getByRole("button", { name: /I've sent the transfer/i }));

    expect(submitBankTransferOrder).toHaveBeenCalled();
    const formData = submitBankTransferOrder.mock.calls[0][1] as FormData;
    expect(formData.get("tier")).toBe("pro-level");
    expect(formData.get("code")).toBe("COSMO10");
    expect(formData.get("reference")).toBe("AWAY-K7P2QM");
    expect(formData.get("email")).toBe("grinder@example.com");
    // Never trust the browser for money: no amount is submitted at all.
    expect(formData.get("amount")).toBeNull();
  });

  it("submits when the buyer arrived at checkout, not when this panel mounted", async () => {
    // Regression: measuring from mount meant switching to the bank tab and
    // typing quickly tripped the server's bot check, silently discarding the
    // order. The timestamp has to come from the parent.
    const user = userEvent.setup();
    render(<BankTransfer {...PROPS} />);

    await user.type(screen.getByLabelText("Email"), "grinder@example.com");
    await user.type(screen.getByLabelText("Discord username"), "luca");
    await user.click(screen.getByRole("button", { name: /I've sent the transfer/i }));

    const formData = submitBankTransferOrder.mock.calls[0][1] as FormData;
    expect(Number(formData.get("startedAt"))).toBe(startedAtRef.current);
  });

  it("shows the thank-you copy on screen once the order is recorded", async () => {
    submitBankTransferOrder.mockResolvedValue({
      status: "success",
      reference: "AWAY-K7P2QM",
      amount: "58.50",
      tierName: "Pro Level",
    });
    const user = userEvent.setup();
    render(<BankTransfer {...PROPS} />);

    await user.type(screen.getByLabelText("Email"), "grinder@example.com");
    await user.type(screen.getByLabelText("Discord username"), "luca");
    await user.click(screen.getByRole("button", { name: /I've sent the transfer/i }));

    expect(await screen.findByText(new RegExp(PURCHASE_THANK_YOU))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open a ticket/i })).toHaveAttribute(
      "href",
      SITE.discordSupportUrl,
    );
  });

  it("surfaces a server-side error", async () => {
    submitBankTransferOrder.mockResolvedValue({ status: "error", message: "That package doesn't exist." });
    const user = userEvent.setup();
    render(<BankTransfer {...PROPS} />);

    await user.type(screen.getByLabelText("Email"), "grinder@example.com");
    await user.type(screen.getByLabelText("Discord username"), "luca");
    await user.click(screen.getByRole("button", { name: /I've sent the transfer/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("That package doesn't exist.");
  });
});
