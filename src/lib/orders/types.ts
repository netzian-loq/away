/** One sale, as recorded the moment it happens. */
export interface OrderRecord {
  /**
   * Bank transfer reference (AWAY-XXXXXX), the PayPal order id, or the Stripe
   * Checkout session id (cs_…).
   */
  id: string;
  /** ISO timestamp of when the order was placed. */
  createdAt: string;
  source: "bank-transfer" | "paypal" | "stripe";
  /**
   * PayPal captures and completed Stripe sessions are money already moved, so
   * they land as "paid". Bank transfers land as "pending" until the money is
   * seen in the account and the order is marked paid on the dashboard —
   * commission is only owed on paid orders.
   */
  status: "pending" | "paid";
  tierSlug: string;
  tierName: string;
  /** What the customer pays, after any discount. */
  amount: number;
  currency: string;
  /** The code used, or null when they paid full price. */
  discountCode: string | null;
  /** Attribution slug: "cosmo", or "direct" for an unreferred sale. */
  partner: string;
  /** Partner's rate at the time of sale, so historic orders stay correct
   *  if the rate is renegotiated later. */
  commissionRate: number;
  /** Partner's cut of `amount`, in the same currency. */
  commission: number;
  buyerEmail: string;
  discord: string;
}
