/** One sale, as recorded the moment it happens. */
export interface OrderRecord {
  /**
   * Bank transfer reference (AWAY-XXXXXX), the PayPal order id, the Stripe
   * Checkout session id (cs_…), or — for crypto — the same AWAY-XXXXXX
   * reference, which is what NOWPayments echoes back as `order_id`.
   */
  id: string;
  /** ISO timestamp of when the order was placed. */
  createdAt: string;
  source: "bank-transfer" | "paypal" | "stripe" | "crypto";
  /**
   * PayPal captures and completed Stripe sessions are money already moved, so
   * they land as "paid". Bank transfers land as "pending" until the money is
   * seen in the account and the order is marked paid on the dashboard —
   * commission is only owed on paid orders.
   *
   * Crypto starts "pending" the moment the invoice is opened and is flipped to
   * "paid" by the IPN webhook, never by the buyer's browser. An abandoned
   * invoice therefore just stays pending, which is the correct record of what
   * happened.
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
