import { ordersSql } from "./db";
import type { OrderRecord } from "./types";

/**
 * Order ledger, backed by Postgres (Neon).
 *
 * Replaces an earlier filesystem-based version: Vercel's serverless
 * filesystem is read-only and wiped between deploys, so a JSONL file on disk
 * never survived a redeploy in production. The database is the durable store
 * now — `db.ts` creates the table on first use, nothing to migrate by hand.
 */

/** Snake_case column names as they come back from Postgres. */
interface OrderRow {
  id: string;
  created_at: string;
  source: OrderRecord["source"];
  status: OrderRecord["status"];
  tier_slug: string;
  tier_name: string;
  amount: number;
  currency: string;
  discount_code: string | null;
  partner: string;
  commission_rate: number;
  commission: number;
  buyer_email: string;
  discord: string;
}

function fromRow(row: OrderRow): OrderRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    source: row.source,
    status: row.status,
    tierSlug: row.tier_slug,
    tierName: row.tier_name,
    amount: row.amount,
    currency: row.currency,
    discountCode: row.discount_code,
    partner: row.partner,
    commissionRate: row.commission_rate,
    commission: row.commission,
    buyerEmail: row.buyer_email,
    discord: row.discord,
  };
}

export async function listOrders(): Promise<OrderRecord[]> {
  const sql = await ordersSql();
  const rows = (await sql`SELECT * FROM orders ORDER BY created_at DESC`) as unknown as OrderRow[];
  return rows.map(fromRow);
}

/**
 * How many PAID orders a partner has already brought in. Drives the volume
 * tiers in `rateFor()`.
 *
 * Counts paid only, deliberately: a pending bank transfer is not a sale yet,
 * and letting unpaid orders push a partner over a tier boundary would pay a
 * higher rate on money that never arrived.
 */
export async function countPaidOrdersForPartner(partner: string): Promise<number> {
  const sql = await ordersSql();
  const rows = (await sql`
    SELECT COUNT(*)::int AS n FROM orders WHERE partner = ${partner} AND status = 'paid'
  `) as unknown as { n: number }[];
  return rows[0]?.n ?? 0;
}

/** Inserts an order, or overwrites it in place if the id already exists. */
export async function appendOrder(order: OrderRecord): Promise<void> {
  const sql = await ordersSql();
  await sql`
    INSERT INTO orders (
      id, created_at, source, status, tier_slug, tier_name, amount, currency,
      discount_code, partner, commission_rate, commission, buyer_email, discord
    ) VALUES (
      ${order.id}, ${order.createdAt}, ${order.source}, ${order.status},
      ${order.tierSlug}, ${order.tierName}, ${order.amount}, ${order.currency},
      ${order.discountCode}, ${order.partner}, ${order.commissionRate},
      ${order.commission}, ${order.buyerEmail}, ${order.discord}
    )
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      source = EXCLUDED.source,
      tier_slug = EXCLUDED.tier_slug,
      tier_name = EXCLUDED.tier_name,
      amount = EXCLUDED.amount,
      currency = EXCLUDED.currency,
      discount_code = EXCLUDED.discount_code,
      partner = EXCLUDED.partner,
      commission_rate = EXCLUDED.commission_rate,
      commission = EXCLUDED.commission,
      buyer_email = EXCLUDED.buyer_email,
      discord = EXCLUDED.discord
  `;
}

/** Marks an order paid (or back to pending). Returns null for an unknown id. */
export async function setOrderStatus(
  id: string,
  status: OrderRecord["status"],
): Promise<OrderRecord | null> {
  const sql = await ordersSql();
  const rows = (await sql`
    UPDATE orders SET status = ${status} WHERE id = ${id} RETURNING *
  `) as unknown as OrderRow[];
  return rows[0] ? fromRow(rows[0]) : null;
}
