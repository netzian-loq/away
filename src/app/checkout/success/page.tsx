import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock } from "lucide-react";
import { PurchaseSuccess } from "@/components/checkout/purchase-success";
import { buttonVariants } from "@/components/ui/button";
import { findPurchasable } from "@/content/catalog";
import { SITE } from "@/content/site";
import { retrieveCheckoutSession, StripeConfigError } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

/**
 * Where Stripe returns the buyer after its hosted Checkout page.
 *
 * This page only *reads* the session to show a receipt. It deliberately does
 * not record the order or send email — /api/stripe/webhook owns that, because
 * it fires whether or not the buyer ever lands here.
 *
 * The session id in the URL is safe to trust as an identifier but not as proof
 * of payment, so the status is read back from Stripe rather than assumed.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const raw = params.session_id;
  const sessionId = (Array.isArray(raw) ? raw[0] : raw) ?? "";

  return (
    <section className="relative pt-40 pb-24 sm:pt-48">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Panel sessionId={sessionId} />
      </div>
    </section>
  );
}

async function Panel({ sessionId }: { sessionId: string }) {
  if (!sessionId) {
    return (
      <Notice
        tone="warn"
        title="No order to show"
        body="This page needs the link Stripe sends you back on. If you've just paid, check your email for the receipt."
      />
    );
  }

  let checkout;
  try {
    checkout = await retrieveCheckoutSession(sessionId);
  } catch (error) {
    if (error instanceof StripeConfigError) {
      return (
        <Notice
          tone="warn"
          title="Card payments aren't switched on"
          body="Stripe isn't configured on this site yet, so there's no order to look up."
        />
      );
    }
    console.error("[stripe] success page lookup failed", error);
    return (
      <Notice
        tone="warn"
        title="We couldn't load your order"
        body="Your payment may still have gone through — check your email for a receipt before paying again, and open a ticket if nothing arrives."
      />
    );
  }

  if (checkout.paymentStatus !== "paid") {
    return (
      <Notice
        tone="pending"
        title="Payment still clearing"
        body="Your payment hasn't settled yet. Some methods take a little longer — we'll email your receipt the moment it lands, and your order is already reserved."
      />
    );
  }

  const item = findPurchasable(checkout.tierSlug);

  return (
    <PurchaseSuccess
      receipt={{
        orderId: checkout.sessionId,
        tierName: item?.name ?? checkout.tierSlug,
        buyerEmail: checkout.buyerEmail,
      }}
    />
  );
}

function Notice({
  tone,
  title,
  body,
}: {
  tone: "warn" | "pending";
  title: string;
  body: string;
}) {
  const Icon = tone === "pending" ? Clock : AlertTriangle;
  const accent = tone === "pending" ? "text-electric" : "text-amber-300";

  return (
    <div className="glass-strong mx-auto max-w-xl rounded-3xl border border-white/10 p-10 text-center">
      <span className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/5 ${accent}`}>
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="mt-6 font-display text-2xl font-bold">{title}</h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">{body}</p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href={SITE.discordSupportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ size: "lg" })}
        >
          Open a ticket <ArrowRight className="h-4 w-4" />
        </a>
        <Link href="/checkout" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Back to checkout
        </Link>
      </div>
    </div>
  );
}
