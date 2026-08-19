import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { CheckoutClient } from "@/components/checkout/checkout-client";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { SITE } from "@/content/site";
import { generateOrderReference } from "@/lib/order-reference";
import { findDiscount } from "@/lib/discounts";
import { VisitBeacon } from "@/components/analytics/visit-beacon";
import { isStripeConfigured } from "@/lib/stripe";

const TITLE = "Checkout";
const DESCRIPTION =
  "Pick your Away Tweaks optimization package and pay securely by card, PayPal or bank transfer — no ticket needed.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}/checkout` },
  // A transactional page with no standalone content worth indexing.
  robots: { index: false, follow: true },
  openGraph: {
    title: `${TITLE} — ${SITE.name}`,
    description: DESCRIPTION,
    url: `${SITE.url}/checkout`,
  },
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const first = (value: string | string[] | undefined) =>
    (Array.isArray(value) ? value[0] : value) ?? "";

  // Partner attribution is counted here rather than on a landing page: the
  // link a partner shares drops people straight into checkout, so arriving
  // with a valid code IS the visit. Resolved server-side so an unknown or
  // invented code in the URL records nothing.
  const referral = findDiscount(first(params.code));

  return (
    <>
      <BreadcrumbJsonLd crumbs={[{ name: "Checkout", path: "/checkout" }]} />
      {referral && <VisitBeacon partner={referral.partner} />}

      <section className="relative pt-40 pb-10 sm:pt-48">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-electric">
              Secure checkout
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold text-gradient sm:text-5xl">
              Get optimized
            </h1>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Choose a package, apply your partner code, and pay by card, PayPal or bank transfer.
              We&apos;ll email your receipt and pick it up from there on Discord.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative pb-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* `item` is the current name; `tier` is still honoured so links
              shared before single services became buyable keep working. */}
          <CheckoutClient
            initialTier={first(params.item) || first(params.tier)}
            initialCode={first(params.code)}
            reference={generateOrderReference()}
            stripeEnabled={isStripeConfigured()}
          />
        </div>
      </section>
    </>
  );
}
