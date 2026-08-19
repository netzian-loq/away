import { commissionOn, findPartner, rateFor } from "@/lib/discounts";
import { appendOrder, countPaidOrdersForPartner } from "./store";
import type { OrderRecord } from "./types";

export interface RecordOrderInput {
  id: string;
  source: OrderRecord["source"];
  status: OrderRecord["status"];
  tierSlug: string;
  tierName: string;
  amount: string | number;
  currency: string;
  /** Attribution slug from the payment ("cosmo", "direct"). */
  partner: string;
  discountCode?: string | null;
  buyerEmail?: string;
  discord?: string;
}

export interface RecordOrderResult {
  recorded: boolean;
  error?: string;
}

/**
 * Writes one sale to the ledger, deriving the partner's commission from the
 * attribution slug the payment carried.
 *
 * Never throws: the money has already moved (or the customer has already been
 * told what to send), so a disk failure must not surface as a failed order.
 * The caller reports the outcome in the owner's notification email instead,
 * which doubles as the fallback record.
 */
export async function recordOrder(input: RecordOrderInput): Promise<RecordOrderResult> {
  try {
    const amount =
      typeof input.amount === "number" ? input.amount : Number.parseFloat(input.amount);
    if (!Number.isFinite(amount)) throw new Error(`Unusable amount: ${input.amount}`);

    const partner = findPartner(input.partner);

    // Volume tier, resolved at the moment of sale. If the count can't be read
    // the base rate is used rather than failing the order — under-paying a
    // partner is recoverable from the ledger; losing the sale is not.
    let rate = partner?.commissionRate ?? 0;
    if (partner?.tiers?.length) {
      try {
        rate = rateFor(partner, await countPaidOrdersForPartner(partner.partner));
      } catch (error) {
        console.error("[orders] tier lookup failed, using base rate", error);
      }
    }

    const order: OrderRecord = {
      id: input.id,
      createdAt: new Date().toISOString(),
      source: input.source,
      status: input.status,
      tierSlug: input.tierSlug,
      tierName: input.tierName,
      amount,
      currency: input.currency,
      discountCode: input.discountCode ?? null,
      partner: input.partner || "direct",
      commissionRate: rate,
      commission: commissionOn(amount, partner, rate),
      buyerEmail: input.buyerEmail ?? "",
      discord: input.discord ?? "",
    };

    await appendOrder(order);
    return { recorded: true };
  } catch (error) {
    console.error("[orders] could not record order", input.id, error);
    return {
      recorded: false,
      error: error instanceof Error ? error.message : "unknown error",
    };
  }
}
