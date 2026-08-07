import { describe, expect, it } from "vitest";
import { normalizeCapture } from "./paypal";

const CAPTURE_RESPONSE = {
  id: "5O190127TN364715T",
  status: "COMPLETED",
  payer: {
    email_address: "grinder@example.com",
    name: { given_name: "Luca", surname: "Rossi" },
  },
  purchase_units: [
    {
      reference_id: "pro-level",
      custom_id: "cosmo",
      payments: {
        captures: [{ amount: { value: "58.50", currency_code: "EUR" } }],
      },
    },
  ],
};

describe("normalizeCapture", () => {
  it("reads amount, package and attribution back out of PayPal's response", () => {
    expect(normalizeCapture(CAPTURE_RESPONSE)).toEqual({
      orderId: "5O190127TN364715T",
      status: "COMPLETED",
      amount: "58.50",
      currency: "EUR",
      tierSlug: "pro-level",
      partner: "cosmo",
      buyerEmail: "grinder@example.com",
      buyerName: "Luca Rossi",
    });
  });

  it("degrades safely when PayPal omits optional fields", () => {
    const capture = normalizeCapture({ id: "abc", status: "COMPLETED" });
    expect(capture.buyerEmail).toBe("");
    expect(capture.buyerName).toBe("");
    expect(capture.partner).toBe("direct");
    expect(capture.amount).toBe("");
  });
});
