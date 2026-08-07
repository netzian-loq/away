import type { Metadata } from "next";
import { AlertTriangle, Database } from "lucide-react";
import { AdminLogin } from "@/components/admin/admin-login";
import { OrdersTable } from "@/components/admin/orders-table";
import { adminLogout } from "@/actions/admin";
import { DISCOUNTS, findPartner } from "@/lib/discounts";
import { isAdminConfigured, isSignedIn } from "@/lib/admin-auth";
import { listOrders } from "@/lib/orders/store";
import { summariseOrders } from "@/lib/orders/summary";
import type { OrderRecord } from "@/lib/orders/types";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

// Always read the ledger fresh — a cached order list is a wrong balance.
export const dynamic = "force-dynamic";

const money = (value: number, currency: string) => `${value.toFixed(2)} ${currency}`;

export default async function AdminOrdersPage() {
  if (!isAdminConfigured()) {
    return (
      <Shell>
        <div className="glass rounded-2xl border border-amber-400/30 p-6">
          <div className="flex items-center gap-2 font-display font-semibold text-amber-300">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Dashboard locked
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Set <code className="font-mono text-foreground">ADMIN_PASSWORD</code> in your
            environment to open this page. Until then it stays shut — it lists customer emails.
          </p>
        </div>
      </Shell>
    );
  }

  if (!(await isSignedIn())) {
    return (
      <Shell>
        <AdminLogin />
      </Shell>
    );
  }

  let orders: OrderRecord[] = [];
  let readError: string | null = null;
  try {
    orders = await listOrders();
  } catch (error) {
    readError = error instanceof Error ? error.message : "unknown error";
  }

  const summary = summariseOrders(
    orders,
    (partner) => findPartner(partner)?.partnerLabel ?? partner,
  );

  return (
    <Shell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gradient">Orders</h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Database className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-mono">Neon Postgres</span>
          </p>
        </div>
        <form action={adminLogout}>
          <button
            type="submit"
            className="glass rounded-lg border border-white/10 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </div>

      {readError && (
        <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/[0.06] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-300">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Couldn&apos;t read the ledger
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {readError}. Check that <code className="font-mono">DATABASE_URL</code> is set for
            this environment.
          </p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Orders" value={String(summary.totalOrders)} />
        <Stat label="Paid" value={String(summary.paidOrders)} />
        <Stat label="Awaiting payment" value={String(summary.pendingOrders)} />
        <Stat label="Revenue (paid)" value={money(summary.paidRevenue, summary.currency)} />
      </div>

      <h2 className="mt-12 font-display text-lg font-semibold">Partners</h2>
      {summary.partners.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No partner-referred orders yet. They appear here as soon as someone checks out with{" "}
          <span className="font-mono text-cyan-accent">{DISCOUNTS[0]?.code}</span>.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {summary.partners.map((partner) => (
            <div
              key={partner.partner}
              className="glass rounded-2xl border border-white/5 border-l-2 border-l-electric p-5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-display font-semibold">{partner.label}</span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {Math.round((findPartner(partner.partner)?.commissionRate ?? 0) * 100)}% cut
                </span>
              </div>
              <dl className="mt-4 space-y-1.5 text-sm">
                <Row label="Referred orders" value={`${partner.orders} (${partner.paidOrders} paid)`} />
                <Row
                  label="Revenue from paid"
                  value={money(partner.paidRevenue, summary.currency)}
                />
                <Row
                  label="Commission owed"
                  value={money(partner.commissionOwed, summary.currency)}
                  emphasis
                />
                {partner.commissionPending > 0 && (
                  <Row
                    label="Pending confirmation"
                    value={money(partner.commissionPending, summary.currency)}
                  />
                )}
              </dl>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-12 font-display text-lg font-semibold">All orders</h2>
      <OrdersTable orders={orders} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative pt-32 pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl border border-white/5 p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-bold text-gradient">{value}</div>
    </div>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={emphasis ? "font-semibold text-cyan-accent" : "text-foreground"}>{value}</dd>
    </div>
  );
}
