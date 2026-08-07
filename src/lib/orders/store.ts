import { mkdir, appendFile, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { ORDER_CSV_COLUMNS, type OrderRecord } from "./types";

/**
 * Append-only order ledger on disk.
 *
 * `orders.jsonl` is the source of truth: one JSON object per line, only ever
 * appended. Status changes append a fresh line for the same id rather than
 * rewriting history, and reads collapse to last-write-wins — so a crash
 * mid-write can never corrupt an earlier order.
 *
 * `orders.csv` is a convenience rebuild of the same data, so the folder can be
 * opened in Excel without any tooling.
 *
 * NOTE: this requires a persistent, writable disk. On Vercel and other
 * serverless hosts the filesystem is read-only and wiped between deploys, so
 * writes throw — callers must treat a failure here as non-fatal and fall back
 * to the notification email as the record.
 */

const JSONL_FILE = "orders.jsonl";
const CSV_FILE = "orders.csv";

/** Where the ledger lives. Defaults to Desktop\Orders on the owner's machine. */
export function ordersDir(): string {
  return process.env.ORDERS_DIR || path.join(homedir(), "Desktop", "Orders");
}

export function ordersCsvPath(): string {
  return path.join(ordersDir(), CSV_FILE);
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  // Quote everything: simplest correct escaping, and Excel is happy with it.
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(orders: OrderRecord[]): string {
  const header = ORDER_CSV_COLUMNS.join(",");
  const rows = orders.map((order) =>
    ORDER_CSV_COLUMNS.map((column) => csvCell(order[column])).join(","),
  );
  return [header, ...rows].join("\r\n") + "\r\n";
}

/**
 * Collapses the append-only log: later lines for the same id win, so a
 * "mark as paid" append supersedes the original pending record.
 */
function collapse(lines: string[]): OrderRecord[] {
  const byId = new Map<string, OrderRecord>();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const order = JSON.parse(trimmed) as OrderRecord;
      if (order?.id) byId.set(order.id, order);
    } catch {
      // A torn final line from an interrupted write — skip it rather than
      // failing the whole read.
    }
  }
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listOrders(): Promise<OrderRecord[]> {
  let raw: string;
  try {
    raw = await readFile(path.join(ordersDir(), JSONL_FILE), "utf8");
  } catch (error) {
    // No ledger yet is the normal empty state, not an error.
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  return collapse(raw.split("\n"));
}

/** Appends an order (or a superseding update) and rebuilds the CSV. */
export async function appendOrder(order: OrderRecord): Promise<void> {
  const dir = ordersDir();
  await mkdir(dir, { recursive: true });
  await appendFile(path.join(dir, JSONL_FILE), JSON.stringify(order) + "\n", "utf8");

  // Best-effort: the JSONL above is the record that matters, so a CSV rebuild
  // failure must not turn a saved order into a reported failure.
  try {
    await writeFile(path.join(dir, CSV_FILE), toCsv(await listOrders()), "utf8");
  } catch (error) {
    console.error("[orders] CSV rebuild failed", error);
  }
}

/** Marks an order paid (or back to pending) by appending a new revision. */
export async function setOrderStatus(
  id: string,
  status: OrderRecord["status"],
): Promise<OrderRecord | null> {
  const existing = (await listOrders()).find((order) => order.id === id);
  if (!existing) return null;
  const updated = { ...existing, status };
  await appendOrder(updated);
  return updated;
}

export { toCsv };
