import { describe, expect, it } from "vitest";
import { summariseOrders } from "./summary";
import type { OrderRecord } from "./types";

const order = (overrides: Partial<OrderRecord> = {}): OrderRecord => ({
  id: "AWAY-K7P2QM",
  createdAt: "2026-08-06T10:00:00.000Z",
  source: "bank-transfer",
  status: "paid",
  tierSlug: "pro-level",
  tierName: "Pro Level",
  amount: 58.5,
  currency: "EUR",
  discountCode: "COSMO10",
  partner: "cosmo",
  commissionRate: 0.15,
  commission: 8.78,
  buyerEmail: "grinder@example.com",
  discord: "luca",
  ...overrides,
});

const label = (partner: string) => (partner === "cosmo" ? "Cosmo eSports" : partner);

describe("summariseOrders", () => {
  it("counts nothing for an empty ledger", () => {
    const summary = summariseOrders([], label);
    expect(summary.totalOrders).toBe(0);
    expect(summary.partners).toEqual([]);
  });

  it("owes commission only on orders confirmed paid", () => {
    const summary = summariseOrders(
      [order({ id: "a" }), order({ id: "b", status: "pending" })],
      label,
    );

    expect(summary.paidOrders).toBe(1);
    expect(summary.pendingOrders).toBe(1);
    expect(summary.partners[0].commissionOwed).toBe(8.78);
    expect(summary.partners[0].commissionPending).toBe(8.78);
  });

  it("keeps unreferred sales out of the partner breakdown but in the revenue", () => {
    const summary = summariseOrders(
      [order({ id: "a", partner: "direct", discountCode: null, commission: 0, amount: 65 })],
      label,
    );

    expect(summary.paidRevenue).toBe(65);
    expect(summary.partners).toEqual([]);
  });

  it("adds up several referred orders", () => {
    const summary = summariseOrders(
      [
        order({ id: "a", amount: 58.5, commission: 8.78 }),
        order({ id: "b", amount: 81, commission: 12.15 }),
      ],
      label,
    );

    expect(summary.partners[0]).toMatchObject({
      partner: "cosmo",
      label: "Cosmo eSports",
      orders: 2,
      paidOrders: 2,
      paidRevenue: 139.5,
      commissionOwed: 20.93,
    });
  });

  it("splits revenue between paid and pending", () => {
    const summary = summariseOrders(
      [order({ id: "a", amount: 58.5 }), order({ id: "b", amount: 31.5, status: "pending" })],
      label,
    );

    expect(summary.paidRevenue).toBe(58.5);
    expect(summary.pendingRevenue).toBe(31.5);
  });

  it("does not accumulate floating-point dust", () => {
    const summary = summariseOrders(
      [
        order({ id: "a", amount: 0.1, commission: 0.1 }),
        order({ id: "b", amount: 0.2, commission: 0.2 }),
      ],
      label,
    );

    expect(summary.paidRevenue).toBe(0.3);
    expect(summary.partners[0].commissionOwed).toBe(0.3);
  });
});
