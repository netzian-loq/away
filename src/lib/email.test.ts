import { beforeEach, describe, expect, it, vi } from "vitest";
import { SITE } from "@/content/site";

const { send } = vi.hoisted(() => ({
  send: vi.fn().mockResolvedValue({ data: { id: "email_1" }, error: null }),
}));

// Resend is instantiated with `new`, so the stub has to be constructible.
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

import {
  PURCHASE_THANK_YOU,
  sendBankTransferEmail,
  sendBankTransferNotification,
  sendPurchaseEmail,
  sendPurchaseNotification,
} from "./email";

const PURCHASE = {
  buyerEmail: "grinder@example.com",
  buyerName: "Luca Rossi",
  tierName: "Pro Level",
  amount: "58.50",
  currency: "EUR",
  orderId: "5O190127TN364715T",
  partner: "cosmo",
  discountCode: "COSMO10",
  discord: "luca",
};

beforeEach(() => {
  send.mockClear();
});

describe("sendPurchaseEmail", () => {
  it("sends the buyer the thank-you copy and the Discord ticket link", async () => {
    await sendPurchaseEmail(PURCHASE);

    const payload = send.mock.calls[0][0];
    expect(payload.to).toBe("grinder@example.com");
    expect(payload.text).toContain(PURCHASE_THANK_YOU);
    expect(payload.text).toContain(SITE.discordSupportUrl);
    expect(payload.html).toContain(SITE.discordSupportUrl);
  });

  it("itemises what was bought", async () => {
    await sendPurchaseEmail(PURCHASE);

    const payload = send.mock.calls[0][0];
    expect(payload.text).toContain("Pro Level");
    expect(payload.text).toContain("58.50 EUR");
    expect(payload.text).toContain("COSMO10");
    expect(payload.text).toContain("5O190127TN364715T");
  });

  it("throws when Resend rejects the send", async () => {
    send.mockResolvedValueOnce({ data: null, error: { message: "domain not verified" } });
    await expect(sendPurchaseEmail(PURCHASE)).rejects.toThrow("domain not verified");
  });
});

describe("sendPurchaseNotification", () => {
  it("tells the owner who bought what, and which partner sent them", async () => {
    await sendPurchaseNotification(PURCHASE);

    const payload = send.mock.calls[0][0];
    expect(payload.to).toBe(SITE.email);
    expect(payload.subject).toContain("Pro Level");
    expect(payload.text).toContain("Partner: cosmo");
    expect(payload.text).toContain("Discord: luca");
    expect(payload.text).toContain("grinder@example.com");
  });

  it("states the discount code that was used", async () => {
    await sendPurchaseNotification({
      ...PURCHASE,
      discountSummary: "COSMO10 — 10% off (Cosmo eSports)",
    });
    expect(send.mock.calls[0][0].text).toContain(
      "Discount code used: COSMO10 — 10% off (Cosmo eSports)",
    );
  });

  it("states plainly when no discount code was used", async () => {
    await sendPurchaseNotification({
      ...PURCHASE,
      discountCode: undefined,
      discountSummary: "none — paid full price",
    });
    expect(send.mock.calls[0][0].text).toContain("Discount code used: none — paid full price");
  });

  it("replies straight to the buyer", async () => {
    await sendPurchaseNotification(PURCHASE);
    expect(send.mock.calls[0][0].replyTo).toBe("grinder@example.com");
  });

  it("flags a receipt that never reached the buyer", async () => {
    await sendPurchaseNotification(PURCHASE, {
      delivered: false,
      to: "grinder@example.com",
      error: "domain not verified",
    });

    const text = send.mock.calls[0][0].text;
    expect(text).toContain("Receipt emailed to buyer: NO");
    expect(text).toContain("grinder@example.com");
    expect(text).toContain("domain not verified");
  });

  it("confirms a receipt that did reach the buyer", async () => {
    await sendPurchaseNotification(PURCHASE, { delivered: true, to: "grinder@example.com" });
    expect(send.mock.calls[0][0].text).toContain(
      "Receipt emailed to buyer: yes (grinder@example.com)",
    );
  });
});

describe("sendBankTransferEmail", () => {
  const ORDER = {
    buyerEmail: "grinder@example.com",
    tierName: "Pro Level",
    amount: "58.50",
    currency: "EUR",
    reference: "AWAY-K7P2QM",
    partner: "cosmo",
    discountCode: "COSMO10",
    discord: "luca",
  };

  it("goes to exactly the address the customer gave, with what to pay", async () => {
    await sendBankTransferEmail(ORDER);

    const payload = send.mock.calls[0][0];
    expect(payload.to).toBe("grinder@example.com");
    expect(payload.text).toContain(PURCHASE_THANK_YOU);
    expect(payload.text).toContain(SITE.bank.iban);
    expect(payload.text).toContain("AWAY-K7P2QM");
    expect(payload.text).toContain("58.50 EUR");
  });

  it("reports the discount and the receipt outcome to the owner", async () => {
    await sendBankTransferNotification(
      { ...ORDER, discountSummary: "COSMO10 — 10% off (Cosmo eSports)" },
      { delivered: false, to: "grinder@example.com", error: "domain not verified" },
    );

    const payload = send.mock.calls[0][0];
    expect(payload.replyTo).toBe("grinder@example.com");
    expect(payload.text).toContain("Discount code used: COSMO10 — 10% off (Cosmo eSports)");
    expect(payload.text).toContain("Receipt emailed to buyer: NO");
  });
});
