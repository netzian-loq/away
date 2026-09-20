// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendTicketOrderEmail, sendTicketOrderNotification, recordOrder } = vi.hoisted(() => ({
  sendTicketOrderEmail: vi.fn().mockResolvedValue({}),
  sendTicketOrderNotification: vi.fn().mockResolvedValue({}),
  recordOrder: vi.fn().mockResolvedValue({ recorded: true }),
}));

vi.mock("@/lib/email", () => ({ sendTicketOrderEmail, sendTicketOrderNotification }));
// Mocked so the suite never writes to the real orders folder on disk.
vi.mock("@/lib/orders/record", () => ({ recordOrder }));

import { submitTicketOrder } from "./ticket-order";

const REFERENCE = "AWAY-K7P2QM";

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  const fields: Record<string, string> = {
    method: "bank-transfer",
    tier: "pro-level",
    code: "COSMO10",
    email: "grinder@example.com",
    discord: "luca",
    reference: REFERENCE,
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  sendTicketOrderEmail.mockResolvedValue({});
  sendTicketOrderNotification.mockResolvedValue({});
  recordOrder.mockResolvedValue({ recorded: true });
});

describe("submitTicketOrder", () => {
  it("prices the order server-side and notifies the owner", async () => {
    const state = await submitTicketOrder({ status: "idle" }, form());

    expect(state).toMatchObject({
      status: "success",
      reference: REFERENCE,
      amount: "63.00",
      tierName: "Pro Level",
    });
    expect(sendTicketOrderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "bank-transfer",
        amount: "63.00",
        partner: "cosmo",
        discord: "luca",
      }),
      expect.anything(),
    );
  });

  /**
   * The whole reason this path exists. A pending row is a claim that someone
   * intends to pay; nothing the browser sends may turn it into a paid one.
   */
  it("always records the order as pending, never paid", async () => {
    await submitTicketOrder({ status: "idle" }, form());
    expect(recordOrder).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending", source: "bank-transfer" }),
    );

    await submitTicketOrder({ status: "idle" }, form({ method: "crypto" }));
    expect(recordOrder).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "pending", source: "crypto" }),
    );
  });

  it("ignores a price sent by the browser and uses the catalog", async () => {
    const state = await submitTicketOrder(
      { status: "idle" },
      form({ amount: "1.00", price: "1" }),
    );
    expect(state.amount).toBe("63.00");
    expect(recordOrder).toHaveBeenCalledWith(expect.objectContaining({ amount: "63.00" }));
  });

  it("charges full price for an invented discount code", async () => {
    const state = await submitTicketOrder({ status: "idle" }, form({ code: "NOTAREALCODE" }));
    expect(state.amount).toBe("70.00");
    expect(recordOrder).toHaveBeenCalledWith(expect.objectContaining({ partner: "direct" }));
  });

  it("rejects a package that does not exist", async () => {
    const state = await submitTicketOrder({ status: "idle" }, form({ tier: "free-please" }));
    expect(state.status).toBe("error");
    expect(recordOrder).not.toHaveBeenCalled();
  });

  it("rejects a reference the server did not generate", async () => {
    const state = await submitTicketOrder({ status: "idle" }, form({ reference: "AWAY-LOL" }));
    expect(state.status).toBe("error");
    expect(recordOrder).not.toHaveBeenCalled();
  });

  /** Email is optional here — the ticket is the contact channel. */
  it("accepts an order with no email and sends no receipt", async () => {
    const state = await submitTicketOrder({ status: "idle" }, form({ email: "" }));
    expect(state.status).toBe("success");
    expect(sendTicketOrderEmail).not.toHaveBeenCalled();
    expect(sendTicketOrderNotification).toHaveBeenCalled();
  });

  it("swallows a honeypot hit without recording anything", async () => {
    const state = await submitTicketOrder({ status: "idle" }, form({ company: "Acme" }));
    expect(state.status).toBe("success");
    expect(recordOrder).not.toHaveBeenCalled();
    expect(sendTicketOrderNotification).not.toHaveBeenCalled();
  });

  /**
   * A failed receipt used to be fatal on the bank path, which sent buyers
   * back to submit the same order a second time. The ledger row is the record.
   */
  it("still succeeds when the buyer receipt fails", async () => {
    sendTicketOrderEmail.mockRejectedValueOnce(new Error("resend is down"));
    const state = await submitTicketOrder({ status: "idle" }, form());
    expect(state.status).toBe("success");
  });

  it("fails only when the notification AND the ledger both fail", async () => {
    sendTicketOrderNotification.mockRejectedValueOnce(new Error("resend is down"));
    recordOrder.mockResolvedValueOnce({ recorded: false, error: "disk full" });

    const state = await submitTicketOrder({ status: "idle" }, form());
    expect(state.status).toBe("error");
  });

  it("survives a failed notification when the ledger held", async () => {
    sendTicketOrderNotification.mockRejectedValueOnce(new Error("resend is down"));
    const state = await submitTicketOrder({ status: "idle" }, form());
    expect(state.status).toBe("success");
  });
});
