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
  EmailConfigError,
  PURCHASE_THANK_YOU,
  sendBankTransferEmail,
  sendBankTransferNotification,
  sendContactEmail,
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
  // The client refuses to construct without a key, so every send path needs
  // one present. See the "configuration" block for the unset case.
  process.env.RESEND_API_KEY = "re_test_key";
  delete process.env.RESEND_FROM;
});

describe("configuration", () => {
  it("fails loudly and specifically when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    await expect(sendPurchaseEmail(PURCHASE)).rejects.toThrow(EmailConfigError);
    expect(send).not.toHaveBeenCalled();
  });

  it("sends from the verified domain once RESEND_FROM is set", async () => {
    process.env.RESEND_FROM = "Away Tweaks <orders@awaytweaks.com>";
    await sendPurchaseEmail(PURCHASE);
    expect(send.mock.calls[0][0].from).toBe("Away Tweaks <orders@awaytweaks.com>");
  });
});

describe("sendContactEmail", () => {
  const CONTACT = {
    name: "Luca Rossi",
    discord: "luca",
    specs: "5800X3D / 4070",
    message: "Looking for a full tune before the weekend.",
  };

  // Regression: this used to be pinned to Resend's sandbox sender and a
  // hardcoded gmail address, so setting RESEND_FROM fixed buyer receipts but
  // silently left the contact form sending from the unverified sandbox.
  it("honours RESEND_FROM instead of the hardcoded sandbox sender", async () => {
    process.env.RESEND_FROM = "Away Tweaks <orders@awaytweaks.com>";
    await sendContactEmail(CONTACT);

    const payload = send.mock.calls[0][0];
    expect(payload.from).toBe("Away Tweaks <orders@awaytweaks.com>");
    expect(payload.from).not.toContain("resend.dev");
  });

  it("goes to the address in SITE, not a literal in the source", async () => {
    await sendContactEmail(CONTACT);
    expect(send.mock.calls[0][0].to).toBe(SITE.email);
  });

  it("carries the specs and message through", async () => {
    await sendContactEmail(CONTACT);
    const payload = send.mock.calls[0][0];
    expect(payload.text).toContain("5800X3D / 4070");
    expect(payload.text).toContain("Looking for a full tune before the weekend.");
  });
});

describe("sendPurchaseEmail", () => {
  it("sends the buyer the thank-you copy and the Discord ticket link", async () => {
    await sendPurchaseEmail(PURCHASE);

    const payload = send.mock.calls[0][0];
    expect(payload.to).toBe("grinder@example.com");
    expect(payload.text).toContain(PURCHASE_THANK_YOU);
    expect(payload.text).toContain("https://discord.gg/md6hAnSrBE");
    expect(payload.html).toContain("https://discord.gg/md6hAnSrBE");
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

  it("names which provider took the money", async () => {
    await sendPurchaseNotification({ ...PURCHASE, source: "Stripe" });
    expect(send.mock.calls[0][0].text).toContain("Paid via: Stripe");
  });

  // Used to read "no email from PayPal" regardless of who processed it.
  it("blames the right provider when no buyer email came back", async () => {
    await sendPurchaseNotification({ ...PURCHASE, buyerEmail: "", source: "Stripe" });
    const text = send.mock.calls[0][0].text;
    expect(text).toContain("no email from Stripe");
    expect(text).not.toContain("no email from PayPal");
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

  it("repeats the IBAN and reference in the HTML part, for buyers who don't see plain text", async () => {
    await sendBankTransferEmail(ORDER);

    const html = send.mock.calls[0][0].html;
    expect(html).toContain(SITE.bank.iban);
    expect(html).toContain("AWAY-K7P2QM");
    expect(html).toContain(SITE.bank.accountHolder);
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
