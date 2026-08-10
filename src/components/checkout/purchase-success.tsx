import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SITE } from "@/content/site";

export interface PurchaseReceipt {
  /** PayPal order id or Stripe Checkout session id. */
  orderId: string;
  tierName: string;
  /** Where the receipt was sent. Empty if the provider gave us no address. */
  buyerEmail: string;
}

/**
 * Shown once the money has moved, on both payment paths: inline for PayPal
 * (which captures without leaving the page) and as the whole of
 * /checkout/success for Stripe (which redirects back after its hosted page).
 *
 * A server component with no state, so the Stripe path renders it without
 * shipping any JavaScript for it.
 */
export function PurchaseSuccess({ receipt }: { receipt: PurchaseReceipt }) {
  return (
    <div className="glass-strong mx-auto max-w-xl rounded-3xl border border-electric/30 p-10 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-electric/15 text-electric">
        <Check className="h-7 w-7" aria-hidden="true" />
      </span>
      <h2 className="mt-6 font-display text-2xl font-bold text-gradient">Payment received</h2>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        Thanks for purchasing the <span className="text-foreground">{receipt.tierName}</span>{" "}
        package. A receipt is on its way
        {receipt.buyerEmail ? ` to ${receipt.buyerEmail}` : ""}.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Next step: open a ticket on our Discord and we&apos;ll get your session booked.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href={SITE.discordSupportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ size: "lg" })}
        >
          Open a ticket <ArrowRight className="h-4 w-4" />
        </a>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Back to site
        </Link>
      </div>
      <p className="mt-6 font-mono text-xs break-all text-muted-foreground">
        Order {receipt.orderId}
      </p>
    </div>
  );
}
