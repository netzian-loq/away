import { markOrderPaid } from "@/actions/admin";
import type { OrderRecord } from "@/lib/orders/types";
import { cn } from "@/lib/utils";

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toISOString().slice(0, 16).replace("T", " ");
};

export function OrdersTable({ orders }: { orders: OrderRecord[] }) {
  if (orders.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        Nothing recorded yet. Orders land here the moment someone checks out.
      </p>
    );
  }

  return (
    // Wide table: scrolls inside its own container so the page never does.
    <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[54rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03] text-left">
            <Th>Date</Th>
            <Th>Reference</Th>
            <Th>Package</Th>
            <Th>Paid</Th>
            <Th>Code</Th>
            <Th>Commission</Th>
            <Th>Customer</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-white/5 last:border-0">
              <Td className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                {formatDate(order.createdAt)}
              </Td>
              <Td className="whitespace-nowrap font-mono text-xs">{order.id}</Td>
              <Td className="whitespace-nowrap">{order.tierName}</Td>
              <Td className="whitespace-nowrap">
                {order.amount.toFixed(2)} {order.currency}
              </Td>
              <Td>
                {order.discountCode ? (
                  <span className="rounded-full bg-electric/15 px-2 py-0.5 font-mono text-[11px] text-electric">
                    {order.discountCode}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">none</span>
                )}
              </Td>
              <Td className="whitespace-nowrap">
                {order.commission > 0 ? (
                  <span className={order.status === "paid" ? "text-cyan-accent" : "text-muted-foreground"}>
                    {order.commission.toFixed(2)} {order.currency}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </Td>
              <Td className="max-w-[14rem]">
                <div className="truncate text-xs">{order.buyerEmail || "—"}</div>
                {order.discord && (
                  <div className="truncate text-xs text-muted-foreground">{order.discord}</div>
                )}
              </Td>
              <Td>
                <form action={markOrderPaid} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={order.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={order.status === "paid" ? "pending" : "paid"}
                  />
                  <span
                    className={cn(
                      "whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                      order.status === "paid"
                        ? "bg-cyan-accent/15 text-cyan-accent"
                        : "bg-amber-400/15 text-amber-300",
                    )}
                  >
                    {order.status}
                  </span>
                  <button
                    type="submit"
                    className="whitespace-nowrap rounded-lg border border-white/10 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-electric/50 hover:text-foreground"
                  >
                    {order.status === "paid" ? "Undo" : "Mark paid"}
                  </button>
                </form>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-top", className)}>{children}</td>;
}
