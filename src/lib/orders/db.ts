import { neon } from "@neondatabase/serverless";

/**
 * Lazy singleton — `neon()` throws without DATABASE_URL, and Next.js
 * evaluates top-level module code at build time, before Vercel's Neon
 * integration has injected the env var on a first deploy. Deferring the
 * call to first use keeps `next build` safe either way.
 */
let _sql: ReturnType<typeof neon> | null = null;

function sql() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL!);
  return _sql;
}

let schemaReady: Promise<void> | null = null;

/** Creates the orders table on first use. Safe to call on every request. */
function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = sql()`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        source TEXT NOT NULL,
        status TEXT NOT NULL,
        tier_slug TEXT NOT NULL,
        tier_name TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        currency TEXT NOT NULL,
        discount_code TEXT,
        partner TEXT NOT NULL,
        commission_rate DOUBLE PRECISION NOT NULL,
        commission DOUBLE PRECISION NOT NULL,
        buyer_email TEXT NOT NULL,
        discord TEXT NOT NULL
      )
    `.then(() => undefined);
  }
  return schemaReady;
}

export async function ordersSql() {
  await ensureSchema();
  return sql();
}
