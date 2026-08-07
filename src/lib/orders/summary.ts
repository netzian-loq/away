import type { OrderRecord } from "./types";

export interface PartnerSummary {
  partner: string;
  label: string;
  orders: number;
  /** Orders confirmed paid. */
  paidOrders: number;
  /** Revenue from paid orders only. */
  paidRevenue: number;
  /** Commission owed — paid orders only. */
  commissionOwed: number;
  /** Commission that will be owed once pending orders are confirmed. */
  commissionPending: number;
}

export interface OrdersSummary {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  paidRevenue: number;
  pendingRevenue: number;
  currency: string;
  partners: PartnerSummary[];
}

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Rolls the ledger up for the dashboard.
 *
 * The distinction that matters: commission is only *owed* on orders confirmed
 * paid. Bank transfers sit pending until the money is seen, so their
 * commission is reported separately rather than inflating the balance.
 */
export function summariseOrders(
  orders: OrderRecord[],
  labelFor: (partner: string) => string,
): OrdersSummary {
  const partners = new Map<string, PartnerSummary>();

  let paidRevenue = 0;
  let pendingRevenue = 0;
  let paidOrders = 0;

  for (const order of orders) {
    const isPaid = order.status === "paid";
    if (isPaid) {
      paidRevenue += order.amount;
      paidOrders += 1;
    } else {
      pendingRevenue += order.amount;
    }

    if (order.partner === "direct") continue;

    const entry = partners.get(order.partner) ?? {
      partner: order.partner,
      label: labelFor(order.partner),
      orders: 0,
      paidOrders: 0,
      paidRevenue: 0,
      commissionOwed: 0,
      commissionPending: 0,
    };

    entry.orders += 1;
    if (isPaid) {
      entry.paidOrders += 1;
      entry.paidRevenue += order.amount;
      entry.commissionOwed += order.commission;
    } else {
      entry.commissionPending += order.commission;
    }

    partners.set(order.partner, entry);
  }

  return {
    totalOrders: orders.length,
    paidOrders,
    pendingOrders: orders.length - paidOrders,
    paidRevenue: round(paidRevenue),
    pendingRevenue: round(pendingRevenue),
    currency: orders[0]?.currency ?? "EUR",
    partners: [...partners.values()]
      .map((entry) => ({
        ...entry,
        paidRevenue: round(entry.paidRevenue),
        commissionOwed: round(entry.commissionOwed),
        commissionPending: round(entry.commissionPending),
      }))
      .sort((a, b) => b.commissionOwed - a.commissionOwed),
  };
}
