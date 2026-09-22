import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Check,
  Crosshair,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { MaskReveal } from "@/components/motion/mask-reveal";
import { PartnerCodeCard } from "@/components/partner/partner-code-card";
import { buttonVariants } from "@/components/ui/button";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { VisitBeacon } from "@/components/analytics/visit-beacon";
import { SINGLE_SERVICES } from "@/content/catalog";
import { JESTERFV } from "@/content/jesterfv";
import { PRICING_TIERS, type PricingTier } from "@/content/pricing";
import { SITE } from "@/content/site";
import { getDisplayCurrency } from "@/lib/currency.server";
import { applyDiscount, JESTER_DISCOUNT } from "@/lib/discounts";
import { chargedNote, formatIn, formatPrice, type DisplayCurrency } from "@/lib/money";
import { isPayPalConfigured } from "@/lib/paypal";
import { cn } from "@/lib/utils";

const TITLE = "Jesterfv1";
const CODE = JESTER_DISCOUNT.code;
const PERCENT = JESTER_DISCOUNT.percentOff;
const DESCRIPTION = `Away Tweaks x Jesterfv1. His viewers get ${PERCENT}% off every PC optimization package: higher FPS, lower input delay, no endgame stutter.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}/jesterfv1` },
  // Unlisted: reachable by the link Jesterfv1 shares. Kept out of the nav and
  // the sitemap; `follow` still lets the links on it pass value.
  robots: { index: false, follow: true },
  openGraph: {
    title: `${TITLE} × ${SITE.name}`,
    description: DESCRIPTION,
    url: `${SITE.url}/jesterfv1`,
  },
};

const PILLAR_ICONS: Record<string, LucideIcon> = {
  aim: Crosshair,
  frames: Gauge,
  endgame: Activity,
};

/** Package feature titles, shortened for a one-line summary on a small tile. */
const SHORT_FEATURE: Record<string, string> = {
  "Windows Tuning": "Windows",
  "BIOS Full Tuning": "BIOS",
  "CPU Overclocking": "CPU OC",
  "GPU Overclocking": "GPU OC",
  "RAM Overclocking": "RAM OC",
};

function summarise(features: string[]): string {
  const parts = features.map((feature) => SHORT_FEATURE[feature] ?? feature);
  if (parts.length < 2) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/** Checkout with the package selected AND his code on, so nothing is lost. */
function checkoutFor(slug?: string): string {
  return slug ? `/checkout?item=${slug}&code=${CODE}` : `/checkout?code=${CODE}`;
}

export default async function JesterfvPage() {
  const currency = await getDisplayCurrency();

  const featured = PRICING_TIERS.find((tier) => tier.featured) ?? PRICING_TIERS[0];
  const rest = PRICING_TIERS.filter((tier) => tier !== featured);
  const featuredPrice = applyDiscount(featured.price, JESTER_DISCOUNT);

  const cheapestSingle = applyDiscount(
    Math.min(...SINGLE_SERVICES.map((item) => item.price)),
    JESTER_DISCOUNT,
  );

  // Derived from the same switch that draws the checkout tabs, so this page
  // never promises card payments while the Card tab still says "soon".
  const methods = isPayPalConfigured()
    ? "Card, PayPal, crypto or bank transfer."
    : "PayPal, crypto or bank transfer.";

  const claimHref = checkoutFor();

  return (
    <>
      <BreadcrumbJsonLd crumbs={[{ name: TITLE, path: "/jesterfv1" }]} />
      {/* Counts the visit against his partner slug, the same way arriving at
          checkout with his code does. Without it, the page he actually shares
          would be the one place his traffic goes unattributed. */}
      <VisitBeacon partner={JESTER_DISCOUNT.partner} />

      {/* ── Hero ────────────────────────────────────────────────────────
          Split, not centered: the pitch on the left, the offer on the right.
          The right side is the real code and one real price, which is the
          thing a viewer arriving from his link came to find out.
          Top padding clears the floating nav (about 5.5rem) and no more, so
          the hero sits at the top of the viewport instead of drifting down. */}
      <section className="relative pt-28 pb-10 sm:pt-32 lg:pb-14">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
          <Reveal className="min-w-0">
            <span className="glass inline-flex items-center rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-electric">
              {JESTERFV.eyebrow}
            </span>

            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
              <MaskReveal as="span">Play like</MaskReveal>
              {/* A space AND a <br>, not a `block` class. MaskReveal pins
                  `display: inline-block` as an inline style on span masks,
                  which outranks any class, so the two masks sat side by side
                  with nothing between them ("Play likeJesterfv1"). The space
                  keeps the accessible name reading as two words; the <br>
                  forces the same two-line break at every width. A div would
                  have been simpler, but a div is not allowed inside an h1. */}{" "}
              <br />
              {/* Accent on the name only. A gradient across the whole
                  headline is a large saturated fill, which is exactly what
                  gets rejected on this brand; one word of it is emphasis. */}
              <MaskReveal as="span" innerClassName="text-gradient" delay={0.08}>
                Jesterfv1.
              </MaskReveal>
            </h1>

            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
              {JESTERFV.heroSubtitle}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={claimHref} className={buttonVariants({ size: "lg" })}>
                Claim {PERCENT}% off <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#prices" className={buttonVariants({ variant: "outline", size: "lg" })}>
                See your prices
              </Link>
            </div>
          </Reveal>

          <Reveal className="min-w-0" delay={0.12}>
            <PartnerCodeCard
              code={CODE}
              percentOff={PERCENT}
              example={{
                name: featured.name,
                listPrice: formatIn(featured.price, currency),
                yourPrice: formatPrice(featuredPrice, currency),
                chargedNote: chargedNote(featuredPrice, currency) || undefined,
              }}
            />
          </Reveal>
        </div>
      </section>

      {/* ── Prices ──────────────────────────────────────────────────────
          Five packages, five cells: the most popular one large, the other
          four around it. Every number is computed from the catalog with his
          code applied, and every cell opens checkout with that package
          selected and the code already on. */}
      <section id="prices" className="relative scroll-mt-28 pt-8 pb-16 sm:pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold text-balance sm:text-4xl">{JESTERFV.pricesTitle}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{JESTERFV.pricesBody}</p>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Reveal className="min-w-0 sm:col-span-2 lg:row-span-2">
              <FeaturedPackage tier={featured} currency={currency} />
            </Reveal>
            {rest.map((tier, i) => (
              <Reveal key={tier.slug} className="min-w-0" delay={0.05 * (i + 1)}>
                <PackageTile tier={tier} currency={currency} />
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-6">
            <p className="text-sm text-muted-foreground">
              Only need one thing?{" "}
              <Link
                href={claimHref}
                className="inline-flex min-h-11 items-center gap-1 font-semibold text-electric hover:underline"
              >
                Single services start at {formatPrice(cheapestSingle, currency)} with his code
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Why ─────────────────────────────────────────────────────────
          Text on the left, three plain rows on the right. Rows rather than
          cards: nothing here is more important than its neighbour, so there
          is no hierarchy for card elevation to communicate. */}
      <section className="relative py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <Reveal className="min-w-0">
            <h2 className="font-display text-3xl font-bold text-balance sm:text-4xl">{JESTERFV.whyTitle}</h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">{JESTERFV.whyBody}</p>
          </Reveal>

          <ul className="min-w-0 divide-y divide-white/10 border-y border-white/10">
            {JESTERFV.pillars.map((pillar, i) => {
              const Icon = PILLAR_ICONS[pillar.icon];
              // The <li> is the list's direct child and Reveal sits inside it:
              // Reveal renders a div, and a div between a ul and its li is
              // invalid markup that screen readers stop counting as a list.
              return (
                <li key={pillar.title}>
                  <Reveal delay={i * 0.06} className="flex gap-4 py-6">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.03]">
                      <Icon className="h-5 w-5 text-electric" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-lg font-semibold">{pillar.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                        {pillar.body}
                      </span>
                    </span>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── Close ───────────────────────────────────────────────────────
          One panel, one ask. "How it works" is a single row of three verbs
          under the button, not a section of numbered cards: the buyer needs
          to know a Discord ticket follows payment, and nothing more. */}
      <section className="relative pb-24 pt-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <div className="glass-strong rounded-3xl border border-white/10 p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-12">
              <h2 className="font-display text-3xl font-bold text-balance sm:text-4xl">{JESTERFV.closeTitle}</h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{JESTERFV.closeBody}</p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href={claimHref} className={buttonVariants({ size: "lg" })}>
                  Claim {PERCENT}% off <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={SITE.discordSupportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  Ask us on Discord
                </a>
              </div>

              <ol className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-6 border-t border-white/10 pt-8 text-left sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/10">
                <FlowStep title="Pick a package" body="Your discount is already on it." />
                <FlowStep title="Pay your way" body={methods} />
                <FlowStep title="Book on Discord" body="Open a ticket and we schedule your session." />
              </ol>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/** The large cell: the most popular package, with everything it includes. */
function FeaturedPackage({ tier, currency }: { tier: PricingTier; currency: DisplayCurrency }) {
  const yours = applyDiscount(tier.price, JESTER_DISCOUNT);
  const charged = chargedNote(yours, currency);

  return (
    <Link
      href={checkoutFor(tier.slug)}
      className={cn(
        "group glass-strong spotlight-card hover-lift relative flex h-full flex-col rounded-3xl border border-electric/30 p-7 sm:p-8",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors duration-300 hover:border-electric/60 active:scale-[0.995]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-2xl font-semibold">{tier.name}</span>
        <span className="rounded-full border border-electric/40 px-2.5 py-0.5 text-xs font-semibold text-electric">
          Most popular
        </span>
      </div>

      <div className="mt-6 flex items-baseline gap-3">
        <span className="font-display text-5xl font-bold text-gradient sm:text-6xl">
          {formatPrice(yours, currency)}
        </span>
        <span className="font-mono text-base text-muted-foreground line-through">
          {formatIn(tier.price, currency)}
        </span>
      </div>
      {charged && <span className="mt-1 text-xs text-muted-foreground">{charged}</span>}

      <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{tier.description}</p>

      <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-foreground/90">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-electric" aria-hidden="true" />
            {feature}
          </li>
        ))}
      </ul>

      {/* Pinned to the bottom of the tall cell, with at least 2rem above it
          when the cell is only as tall as its content (single column). A
          span, not a button: the whole card is already the link. */}
      <span className="mt-auto pt-8">
        <span className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
          Choose {tier.name}{" "}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </span>
    </Link>
  );
}

/** A small cell: name, what is in it, and his price. The whole tile is the link. */
function PackageTile({ tier, currency }: { tier: PricingTier; currency: DisplayCurrency }) {
  const yours = applyDiscount(tier.price, JESTER_DISCOUNT);
  const charged = chargedNote(yours, currency);

  return (
    <Link
      href={checkoutFor(tier.slug)}
      className={cn(
        "group glass hover-lift flex h-full flex-col rounded-2xl border border-white/5 p-5",
        "transition-colors duration-300 hover:border-electric/40 active:scale-[0.99]",
      )}
    >
      <span className="font-display font-semibold">{tier.name}</span>
      <span className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {summarise(tier.features)}
      </span>

      <span className="mt-auto flex items-baseline justify-between gap-2 pt-5">
        <span>
          <span className="block font-display text-2xl font-bold">{formatPrice(yours, currency)}</span>
          {charged && <span className="block text-[11px] text-muted-foreground">{charged}</span>}
        </span>
        <span className="font-mono text-xs text-muted-foreground line-through">
          {formatIn(tier.price, currency)}
        </span>
      </span>
    </Link>
  );
}

function FlowStep({ title, body }: { title: string; body: string }) {
  return (
    <li className="sm:px-6 sm:first:pl-0 sm:last:pr-0">
      <span className="block font-display font-semibold">{title}</span>
      <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{body}</span>
    </li>
  );
}
