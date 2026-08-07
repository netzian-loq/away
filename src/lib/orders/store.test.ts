// @vitest-environment node
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { appendOrder, listOrders, ordersDir, setOrderStatus } from "./store";
import type { OrderRecord } from "./types";

let dir: string;

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

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "away-orders-"));
  process.env.ORDERS_DIR = dir;
});

afterEach(async () => {
  delete process.env.ORDERS_DIR;
  await rm(dir, { recursive: true, force: true });
});

describe("order ledger", () => {
  it("defaults to the Desktop\\Orders folder when unconfigured", () => {
    delete process.env.ORDERS_DIR;
    expect(ordersDir().replace(/\\/g, "/")).toMatch(/\/Desktop\/Orders$/);
  });

  it("returns nothing before any order exists", async () => {
    await expect(listOrders()).resolves.toEqual([]);
  });

  it("persists an order and reads it back", async () => {
    await appendOrder(order());
    const [saved] = await listOrders();
    expect(saved).toEqual(order());
  });

  it("writes a CSV alongside it that opens in a spreadsheet", async () => {
    await appendOrder(order());
    const csv = await readFile(path.join(dir, "orders.csv"), "utf8");
    expect(csv.split("\r\n")[0]).toContain("createdAt,id,status");
    expect(csv).toContain('"COSMO10"');
    expect(csv).toContain('"8.78"');
  });

  it("keeps the newest revision of an order and no duplicates", async () => {
    await appendOrder(order());
    await setOrderStatus("AWAY-K7P2QM", "paid");

    const all = await listOrders();
    expect(all).toHaveLength(1);
    expect(all[0].status).toBe("paid");
  });

  it("never rewrites history — the original line stays on disk", async () => {
    await appendOrder(order());
    await setOrderStatus("AWAY-K7P2QM", "paid");

    const raw = await readFile(path.join(dir, "orders.jsonl"), "utf8");
    expect(raw.trim().split("\n")).toHaveLength(2);
    expect(raw).toContain('"status":"pending"');
    expect(raw).toContain('"status":"paid"');
  });

  it("reports an unknown id rather than inventing an order", async () => {
    await expect(setOrderStatus("AWAY-NOPE22", "paid")).resolves.toBeNull();
  });

  it("survives a torn final line from an interrupted write", async () => {
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "orders.jsonl"),
      JSON.stringify(order()) + "\n" + '{"id":"AWAY-BROKEN","amo',
      "utf8",
    );

    const all = await listOrders();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe("AWAY-K7P2QM");
  });

  it("sorts newest first", async () => {
    await appendOrder(order({ id: "AWAY-OLD111", createdAt: "2026-08-01T10:00:00.000Z" }));
    await appendOrder(order({ id: "AWAY-NEW222", createdAt: "2026-08-06T10:00:00.000Z" }));

    expect((await listOrders()).map((entry) => entry.id)).toEqual(["AWAY-NEW222", "AWAY-OLD111"]);
  });

  it("escapes quotes so a crafted field cannot break the CSV", async () => {
    await appendOrder(order({ discord: 'he said "hi",boom' }));
    const csv = await readFile(path.join(dir, "orders.csv"), "utf8");
    expect(csv).toContain('"he said ""hi"",boom"');
  });
});
