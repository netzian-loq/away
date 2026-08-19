import { neon } from "@neondatabase/serverless";

/**
 * Partner page visits.
 *
 * Deliberately minimal in what it stores: a partner slug, a timestamp, and the
 * referring host. No IP, no user agent, no cookie, no id of any kind — this
 * answers "how many people opened the Waaqqi page and how many bought", which
 * needs counting, not identifying. Storing less means there is nothing here to
 * leak and no consent banner to argue about.
 *
 * Same lazy-singleton shape as the orders store, and for the same reason:
 * `neon()` throws without DATABASE_URL and Next evaluates module scope at
 * build time, before the env var exists on a first deploy.
 */

let _sql: ReturnType<typeof neon> | null = null;

function sql() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL!);
  return _sql;
}

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = sql()`
      CREATE TABLE IF NOT EXISTS partner_visits (
        id BIGSERIAL PRIMARY KEY,
        partner TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        referrer_host TEXT
      )
    `
      .then(
        () => sql()`CREATE INDEX IF NOT EXISTS partner_visits_partner_created
                    ON partner_visits (partner, created_at DESC)`,
      )
      .then(() => undefined);
  }
  return schemaReady;
}

async function visitsSql() {
  await ensureSchema();
  return sql();
}

/** Records one visit. Never throws — analytics must not break a page. */
export async function recordVisit(partner: string, referrerHost: string | null): Promise<void> {
  try {
    const db = await visitsSql();
    await db`
      INSERT INTO partner_visits (partner, referrer_host)
      VALUES (${partner}, ${referrerHost})
    `;
  } catch (error) {
    console.error("[visits] could not record", partner, error);
  }
}

export interface VisitSummary {
  partner: string;
  total: number;
  last7d: number;
  last30d: number;
  lastAt: string | null;
  /** Referrer host -> count, biggest first. Nulls become "direct". */
  topReferrers: { host: string; count: number }[];
  /**
   * False when the count could not be read at all — no DATABASE_URL, database
   * unreachable, table missing.
   *
   * This exists because the alternative is worse than an error: swallowing the
   * failure and returning zeroes renders as a confident "0 opens", which is
   * indistinguishable from "nobody clicked your link". One is a config problem
   * you fix in a minute; the other is a business decision. The dashboard must
   * not let you confuse them.
   */
  available: boolean;
  error?: string;
}

/**
 * Counts for one partner. Returns zeroes rather than throwing when the table
 * does not exist yet, so the dashboard renders on a fresh database.
 */
export async function summariseVisits(partner: string): Promise<VisitSummary> {
  const empty: VisitSummary = {
    partner,
    total: 0,
    last7d: 0,
    last30d: 0,
    lastAt: null,
    topReferrers: [],
    available: false,
  };

  if (!process.env.DATABASE_URL) {
    return { ...empty, error: "DATABASE_URL is not set for this environment." };
  }

  try {
    const db = await visitsSql();

    const totals = (await db`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int  AS last7d,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')::int AS last30d,
        MAX(created_at) AS last_at
      FROM partner_visits WHERE partner = ${partner}
    `) as unknown as { total: number; last7d: number; last30d: number; last_at: string | null }[];

    const refs = (await db`
      SELECT COALESCE(referrer_host, 'direct') AS host, COUNT(*)::int AS count
      FROM partner_visits WHERE partner = ${partner}
      GROUP BY 1 ORDER BY count DESC LIMIT 6
    `) as unknown as { host: string; count: number }[];

    const row = totals[0];
    if (!row) return { ...empty, available: true };

    return {
      partner,
      total: row.total ?? 0,
      last7d: row.last7d ?? 0,
      last30d: row.last30d ?? 0,
      lastAt: row.last_at ?? null,
      topReferrers: refs ?? [],
      available: true,
    };
  } catch (error) {
    console.error("[visits] could not summarise", partner, error);
    return { ...empty, error: error instanceof Error ? error.message : "unknown error" };
  }
}
