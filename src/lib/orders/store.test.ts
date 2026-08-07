// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderRecord } from "./types";

/**
 * In-memory stand-in for the `orders` table, keyed by id — mirrors the real
 * schema's `ON CONFLICT (id) DO UPDATE` / `UPDATE ... WHERE id` semantics
 * closely enough to exercise store.ts without a network database.
 */
let rows: Map<string, Record<string, unknown>>;

/** Parses just enough of the tagged-template SQL to route to a fake table. */
function fakeSql(strings: TemplateStringsArray, ...values: unknown[]) {
  const query = strings.join("?");

  if (query.includes("CREATE TABLE")) {
    return Promise.resolve([]);
  }

  if (query.includes("SELECT * FROM orders ORDER BY created_at DESC")) {
    return Promise.resolve(
      [...rows.values()].sort((a, b) =>
        String(b.created_at).localeCompare(String(a.created_at)),
      ),
    );
  }

  if (query.includes("INSERT INTO orders")) {
    const [
      id,
      createdAt,
      source,
      status,
      tierSlug,
      tierName,
      amount,
      currency,
      discountCode,
      partner,
      commissionRate,
      commission,
      buyerEmail,
      discord,
    ] = values;
    rows.set(id as string, {
      id,
      created_at: createdAt,
      source,
      status,
      tier_slug: tierSlug,
      tier_name: tierName,
      amount,
      currency,
      discount_code: discountCode,
      partner,
      commission_rate: commissionRate,
      commission,
      buyer_email: buyerEmail,
      discord,
    });
    return Promise.resolve([]);
  }

  if (query.includes("UPDATE orders SET status")) {
    const [status, id] = values;
    const existing = rows.get(id as string);
    if (!existing) return Promise.resolve([]);
    const updated = { ...existing, status };
    rows.set(id as string, updated);
    return Promise.resolve([updated]);
  }

  throw new Error(`fakeSql: unhandled query — ${query}`);
}

vi.mock("@neondatabase/serverless", () => ({
  neon: () => fakeSql,
}));

const { appendOrder, listOrders, setOrderStatus } = await import("./store");

const order = (overrides: Partial<OrderRecord> = {}): OrderRecord => ({
  id: "AWAY-K7P2QM",
  createdAt: "2026-08-06T10:00:00.000Z",
  source: "bank-transfer",
  status: "pending",
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

beforeEach(() => {
  rows = new Map();
  process.env.DATABASE_URL = "postgres://test";
});

afterEach(() => {
  delete process.env.DATABASE_URL;
});

describe("order ledger", () => {
  it("returns nothing before any order exists", async () => {
    await expect(listOrders()).resolves.toEqual([]);
  });

  it("persists an order and reads it back", async () => {
    await appendOrder(order());
    const [saved] = await listOrders();
    expect(saved).toEqual(order());
  });

  it("overwrites in place rather than duplicating on a repeat id", async () => {
    await appendOrder(order());
    await appendOrder(order({ status: "paid" }));

    const all = await listOrders();
    expect(all).toHaveLength(1);
    expect(all[0].status).toBe("paid");
  });

  it("marks an order paid and returns the updated record", async () => {
    await appendOrder(order());
    const updated = await setOrderStatus("AWAY-K7P2QM", "paid");

    expect(updated?.status).toBe("paid");
    expect((await listOrders())[0].status).toBe("paid");
  });

  it("reports an unknown id rather than inventing an order", async () => {
    await expect(setOrderStatus("AWAY-NOPE22", "paid")).resolves.toBeNull();
  });

  it("sorts newest first", async () => {
    await appendOrder(order({ id: "AWAY-OLD111", createdAt: "2026-08-01T10:00:00.000Z" }));
    await appendOrder(order({ id: "AWAY-NEW222", createdAt: "2026-08-06T10:00:00.000Z" }));

    expect((await listOrders()).map((entry) => entry.id)).toEqual(["AWAY-NEW222", "AWAY-OLD111"]);
  });
});
