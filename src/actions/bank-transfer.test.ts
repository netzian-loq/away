// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendBankTransferEmail, sendBankTransferNotification, recordOrder } = vi.hoisted(() => ({
  sendBankTransferEmail: vi.fn().mockResolvedValue({}),
  sendBankTransferNotification: vi.fn().mockResolvedValue({}),
  recordOrder: vi.fn().mockResolvedValue({ recorded: true }),
}));

vi.mock("@/lib/email", () => ({ sendBankTransferEmail, sendBankTransferNotification }));
// Mocked so the suite never writes to the real orders folder on disk.
vi.mock("@/lib/orders/record", () => ({ recordOrder }));

import { submitBankTransferOrder } from "./bank-transfer";

const REFERENCE = "AWAY-K7P2QM";

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  const fields = {
    tier: "pro-level",
    code: "COSMO10",
    email: "grinder@example.com",
    discord: "luca",
    reference: REFERENCE,
    // Well before the minimum fill time so the bot check passes.
    startedAt: String(Date.now() - 10_000),
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  sendBankTransferEmail.mockResolvedValue({});
  sendBankTransferNotification.mockResolvedValue({});
  recordOrder.mockResolvedValue({ recorded: true });
});

describe("submitBankTransferOrder", () => {
  it("prices the order server-side and emails both sides", async () => {
    const state = await submitBankTransferOrder({ status: "idle" }, form());

    expect(state).toMatchObject({
      status: "success",
      reference: REFERENCE,
      amount: "58.50",
      tierName: "Pro Level",
    });
    expect(sendBankTransferNotification).toHaveBeenCalledWith(
      expect.objectContaining({ amount: "58.50", partner: "cosmo", discord: "luca" }),
      expect.anything(),
      expect.anything(),
    );
    expect(sendBankTransferEmail).toHaveBeenCalledWith(
      expect.objectContaining({ buyerEmail: "grinder@example.com", reference: REFERENCE }),
    );
  });

  it("records the sale as pending with the partner's 15% commission", async () => {
    await submitBankTransferOrder({ status: "idle" }, form());
    expect(recordOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        id: REFERENCE,
        source: "bank-transfer",
        status: "pending",
        amount: "58.50",
        partner: "cosmo",
        discountCode: "COSMO10",
      }),
    );
  });

  it("records an unreferred sale as direct with no code", async () => {
    await submitBankTransferOrder({ status: "idle" }, form({ code: "" }));
    expect(recordOrder).toHaveBeenCalledWith(
      expect.objectContaining({ partner: "direct", discountCode: null, amount: "65.00" }),
    );
  });

  it("still completes, and warns the owner, when the ledger can't be written", async () => {
    recordOrder.mockResolvedValueOnce({ recorded: false, error: "EROFS: read-only file system" });

    const state = await submitBankTransferOrder({ status: "idle" }, form());
    expect(state.status).toBe("success");
    expect(sendBankTransferNotification).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { recorded: false, error: "EROFS: read-only file system" },
    );
  });

  it("addresses the receipt to exactly the email the customer typed", async () => {
    await submitBankTransferOrder({ status: "idle" }, form({ email: "someone.else@proton.me" }));
    expect(sendBankTransferEmail).toHaveBeenCalledWith(
      expect.objectContaining({ buyerEmail: "someone.else@proton.me" }),
    );
  });

  it("spells out which discount code was used", async () => {
    await submitBankTransferOrder({ status: "idle" }, form());
    expect(sendBankTransferNotification).toHaveBeenCalledWith(
      expect.objectContaining({ discountSummary: "COSMO10 — 10% off (Cosmo eSports)" }),
      expect.anything(),
      expect.anything(),
    );
  });

  it("spells out when no discount code was used", async () => {
    await submitBankTransferOrder({ status: "idle" }, form({ code: "" }));
    expect(sendBankTransferNotification).toHaveBeenCalledWith(
      expect.objectContaining({ discountSummary: "none — paid full price" }),
      expect.anything(),
      expect.anything(),
    );
  });

  it("tells the owner when the buyer's receipt did not reach them", async () => {
    sendBankTransferEmail.mockRejectedValueOnce(new Error("domain not verified"));
    await submitBankTransferOrder({ status: "idle" }, form());

    expect(sendBankTransferNotification).toHaveBeenCalledWith(
      expect.anything(),
      { delivered: false, to: "grinder@example.com", error: "domain not verified" },
      expect.anything(),
    );
  });

  it("tells the owner when the receipt did land", async () => {
    await submitBankTransferOrder({ status: "idle" }, form());
    expect(sendBankTransferNotification).toHaveBeenCalledWith(
      expect.anything(),
      { delivered: true, to: "grinder@example.com" },
      expect.anything(),
    );
  });

  it("ignores any amount the form tries to smuggle in", async () => {
    await submitBankTransferOrder({ status: "idle" }, form({ amount: "1.00", price: "1" }));
    expect(sendBankTransferNotification).toHaveBeenCalledWith(
      expect.objectContaining({ amount: "58.50" }),
      expect.anything(),
      expect.anything(),
    );
  });

  it("charges full price for an unrecognised code", async () => {
    await submitBankTransferOrder({ status: "idle" }, form({ code: "NOTACODE" }));
    expect(sendBankTransferNotification).toHaveBeenCalledWith(
      expect.objectContaining({ amount: "65.00", partner: "direct" }),
      expect.anything(),
      expect.anything(),
    );
  });

  it("rejects a bad email, a missing discord and a forged reference", async () => {
    for (const bad of [
      { email: "not-an-email" },
      { discord: "" },
      { reference: "AWAY-000" },
    ]) {
      const state = await submitBankTransferOrder({ status: "idle" }, form(bad));
      expect(state.status).toBe("error");
    }
    expect(sendBankTransferNotification).not.toHaveBeenCalled();
  });

  it("rejects an unknown package", async () => {
    const state = await submitBankTransferOrder({ status: "idle" }, form({ tier: "free-tier" }));
    expect(state.status).toBe("error");
    expect(sendBankTransferNotification).not.toHaveBeenCalled();
  });

  it("silently drops honeypot and instant submissions", async () => {
    const bot = await submitBankTransferOrder({ status: "idle" }, form({ company: "Acme" }));
    expect(bot.status).toBe("success");

    const tooFast = await submitBankTransferOrder(
      { status: "idle" },
      form({ startedAt: String(Date.now()) }),
    );
    expect(tooFast.status).toBe("success");

    expect(sendBankTransferNotification).not.toHaveBeenCalled();
    expect(sendBankTransferEmail).not.toHaveBeenCalled();
  });

  it("still succeeds when the buyer's email bounces, since the owner was told", async () => {
    sendBankTransferEmail.mockRejectedValueOnce(new Error("domain not verified"));
    const state = await submitBankTransferOrder({ status: "idle" }, form());
    expect(state.status).toBe("success");
  });

  it("fails loudly when the owner notification cannot be sent", async () => {
    sendBankTransferNotification.mockRejectedValueOnce(new Error("resend down"));
    const state = await submitBankTransferOrder({ status: "idle" }, form());
    expect(state.status).toBe("error");
  });
});
