import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Crosshair,
  Gauge,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { MaskReveal } from "@/components/motion/mask-reveal";
import { BrandIcon } from "@/components/partner/brand-icons";
import { PartnerCodeCard } from "@/components/partner/partner-code-card";
import {
  FlowStep,
  PartnerPackages,
  partnerCheckoutHref,
} from "@/components/partner/partner-packages";
import { buttonVariants } from "@/components/ui/button";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { VisitBeacon } from "@/components/analytics/visit-beacon";
import { ONE_PRODIGE } from "@/content/oneprodige";
import { PRICING_TIERS } from "@/content/pricing";
import { SITE } from "@/content/site";
import { getDisplayCurrency } from "@/lib/currency.server";
import { applyDiscount, ONE_PRODIGE_DISCOUNT } from "@/lib/discounts";
import { chargedNote, formatIn, formatPrice } from "@/lib/money";
import { isPayPalConfigured } from "@/lib/paypal";
import { cn } from "@/lib/utils";

const TITLE = "One Prodige";
const PATH = "/oneprodige";
const CODE = ONE_PRODIGE_DISCOUNT.code;
const PERCENT = ONE_PRODIGE_DISCOUNT.percentOff;
const DESCRIPTION = `Away Tweaks x One Prodige (1P). The 1P community gets ${PERCENT}% off every PC optimization package: higher frame floor, lower input delay, cleaner endgames.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}${PATH}` },
  // Unlisted, like the other partner pages: reached by the link 1P shares,
  // kept out of the nav and the sitemap; `follow` still passes link value.
  robots: { index: false, follow: true },
  openGraph: {
    title: `${TITLE} × ${SITE.name}`,
    description: DESCRIPTION,
    url: `${SITE.url}${PATH}`,
  },
};

const PILLAR_ICONS: Record<string, LucideIcon> = {
  aim: Crosshair,
  frames: Gauge,
  endgame: Activity,
};

/** Shared by every link that leaves for 1P's own channels. */
const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" } as const;

/**
 * The page is laid out from oneprodige.com's own structure (hero, stat cards,
 * "La route vers les sommets" timeline, socials, club shop) and dressed in
 * their gold-on-black with Bebas Neue titles via `.theme-1p` from the segment
 * layout. The Away offer sits inside it: the code card in the hero and the
 * package grid, both computed from the catalog with their code applied.
 */
export default async function OneProdigePage() {
  const currency = await getDisplayCurrency();

  const featured = PRICING_TIERS.find((tier) => tier.featured) ?? PRICING_TIERS[0];
  const featuredPrice = applyDiscount(featured.price, ONE_PRODIGE_DISCOUNT);

  // Derived from the same switch that draws the checkout tabs, so this page
  // never promises card payments while the Card tab still says "soon".
  const methods = isPayPalConfigured()
    ? "Card, PayPal, crypto or bank transfer."
    : "PayPal, crypto or bank transfer.";

  const claimHref = partnerCheckoutHref(ONE_PRODIGE_DISCOUNT);

  return (
    <>
      <BreadcrumbJsonLd crumbs={[{ name: TITLE, path: PATH }]} />
      {/* Counts the visit against their partner slug, the same way arriving
          at checkout with the code does, so the page 1P shares is counted on
          the dashboard too. */}
      <VisitBeacon partner={ONE_PRODIGE_DISCOUNT.partner} />

      {/* ── Hero ────────────────────────────────────────────────────────
          Their tagline as the headline, the offer on the right. The gold
          wash behind it is their site's own: one soft radial, not a fill. */}
      <section className="relative overflow-hidden pt-28 pb-12 sm:pt-32 lg:pb-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_65%_at_18%_0%,rgb(254_188_49/0.11),transparent_70%)]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
          <Reveal className="min-w-0">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pr-4 pl-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Image src="/oneprodige/logo-1p.png" alt="" width={20} height={19} className="h-[19px] w-5" />
              {ONE_PRODIGE.eyebrow}
            </span>

            <h1 className="mt-6 font-display text-6xl leading-[0.92] uppercase sm:text-7xl lg:text-8xl">
              <MaskReveal as="span">Performance &amp; excellence,</MaskReveal>
              {/* A space AND a <br>, never a `block` class: MaskReveal pins
                  `display: inline-block` inline on span masks, so a class
                  cannot break the line (see the Jesterfv1 page). */}{" "}
              <br />
              <MaskReveal as="span" innerClassName="text-electric" delay={0.08}>
                down to your PC.
              </MaskReveal>
            </h1>

            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
              {ONE_PRODIGE.heroSubtitle}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={claimHref} className={cn(buttonVariants({ size: "lg" }), "uppercase tracking-wide")}>
                Claim {PERCENT}% off <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#prices"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "uppercase tracking-wide")}
              >
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

      {/* ── Who they are ────────────────────────────────────────────────
          Their "Notre ADN" block and stat cards, as on their home page:
          the mark and one line on the left, four numbers on the right. */}
      <section className="relative py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <Reveal className="min-w-0">
            <Image src="/oneprodige/logo-1p.png" alt="One Prodige" width={64} height={61} className="h-[61px] w-16" />
            <h2 className="mt-6 font-display text-4xl uppercase sm:text-5xl">
              {ONE_PRODIGE.tagline}
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">{ONE_PRODIGE.about}</p>
            <a
              href={ONE_PRODIGE.site}
              {...EXTERNAL}
              className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-electric hover:underline"
            >
              oneprodige.com <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </Reveal>

          <dl className="grid min-w-0 grid-cols-2 gap-3">
            {ONE_PRODIGE.facts.map((fact, i) => (
              // Reveal's div is the one wrapper a <dl> allows around a dt/dd
              // pair. The pair is flipped visually only: the number reads
              // first, as on their cards, while the markup keeps term, value.
              <Reveal
                key={fact.label}
                delay={i * 0.05}
                className="flex flex-col-reverse rounded-[20px] border border-white/[0.06] bg-white/[0.02] px-5 py-7 text-center transition-colors duration-300 hover:border-electric/30"
              >
                <dt className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {fact.label}
                </dt>
                <dd className="font-display text-5xl leading-none text-electric">{fact.value}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* ── The road to the top ─────────────────────────────────────────
          Their chronology, row for row: outlined number, event and date,
          then who 1P sent and where they placed. */}
      <section className="relative py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <span className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Chronology</span>
            <h2 className="mt-2 font-display text-4xl uppercase sm:text-5xl">{ONE_PRODIGE.roadTitle}</h2>
          </Reveal>

          <ol className="mt-8 border-t border-white/10">
            {ONE_PRODIGE.road.map((step, i) => (
              <li key={step.event} className="border-b border-white/10">
                <Reveal delay={i * 0.05} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 py-6 sm:grid-cols-[5rem_minmax(0,1fr)]">
                  <span
                    aria-hidden="true"
                    className="font-display text-5xl leading-none text-transparent [-webkit-text-stroke:1px_rgb(254_188_49/0.75)] sm:text-6xl"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3 className="font-display text-2xl uppercase sm:text-3xl">{step.event}</h3>
                      <span className="text-sm text-muted-foreground">{step.date}</span>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {step.results.map((result) => (
                        <li key={result.player} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                          <span className="rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                            {result.country}
                          </span>
                          <span className="font-semibold">{result.player}</span>
                          <span className="font-display text-xl leading-none text-electric">{result.place}</span>
                          {result.note && (
                            <span className="rounded-full border border-electric/40 px-2 py-0.5 text-xs font-semibold text-electric">
                              {result.note}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              </li>
            ))}
            <li>
              <Reveal className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-4 py-6 sm:grid-cols-[5rem_minmax(0,1fr)]">
                <span className="grid h-11 w-11 place-items-center rounded-full border border-electric/40">
                  <MapPin className="h-4 w-4 text-electric" aria-hidden="true" />
                </span>
                <p className="min-w-0">
                  <span className="block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    {ONE_PRODIGE.next.label}
                  </span>
                  <span className="mt-1 block font-display text-2xl uppercase sm:text-3xl">
                    {ONE_PRODIGE.next.body}
                  </span>
                </p>
              </Reveal>
            </li>
          </ol>
        </div>
      </section>

      {/* ── Prices ──────────────────────────────────────────────────────
          The shared partner grid: every number computed from the catalog
          with their code applied, every cell opening checkout with it on. */}
      <section id="prices" className="relative scroll-mt-28 pt-12 pb-16 sm:pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="max-w-2xl">
            <h2 className="font-display text-4xl uppercase text-balance sm:text-5xl">{ONE_PRODIGE.pricesTitle}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{ONE_PRODIGE.pricesBody}</p>
          </Reveal>

          <PartnerPackages discount={ONE_PRODIGE_DISCOUNT} currency={currency} singlesSuffix="with the 1P code" />
        </div>
      </section>

      {/* ── Why ─────────────────────────────────────────────────────────
          Same three rows as the other partner pages, in Fortnite terms. */}
      <section className="relative py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <Reveal className="min-w-0">
            <h2 className="font-display text-4xl uppercase text-balance sm:text-5xl">{ONE_PRODIGE.whyTitle}</h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">{ONE_PRODIGE.whyBody}</p>
          </Reveal>

          <ul className="min-w-0 divide-y divide-white/10 border-y border-white/10">
            {ONE_PRODIGE.pillars.map((pillar, i) => {
              const Icon = PILLAR_ICONS[pillar.icon];
              return (
                <li key={pillar.title}>
                  <Reveal delay={i * 0.06} className="flex gap-4 py-6">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.03]">
                      <Icon className="h-5 w-5 text-electric" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-2xl uppercase">{pillar.title}</span>
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

      {/* ── Follow ──────────────────────────────────────────────────────
          Their official channels and club shop, exactly as linked from
          oneprodige.com. Sending 1P's community back to 1P is part of the
          deal, not a leak. */}
      <section className="relative py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <Reveal className="min-w-0">
            <h2 className="font-display text-4xl uppercase sm:text-5xl">{ONE_PRODIGE.followTitle}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{ONE_PRODIGE.followBody}</p>

            <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ONE_PRODIGE.socials.map((social) => (
                <li key={social.platform} className="min-w-0">
                  <a
                    href={social.href}
                    {...EXTERNAL}
                    aria-label={`One Prodige on ${social.name}`}
                    className="group glass hover-lift flex min-h-16 items-center gap-4 rounded-2xl border border-white/5 px-4 py-3 transition-colors duration-300 hover:border-electric/40"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-foreground transition-colors group-hover:text-electric">
                      <BrandIcon name={social.platform} className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{social.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{social.handle}</span>
                    </span>
                    <ArrowUpRight
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-electric"
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="min-w-0" delay={0.1}>
            <a
              href={ONE_PRODIGE.shop.href}
              {...EXTERNAL}
              className="group glass-strong hover-lift flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 transition-colors duration-300 hover:border-electric/40"
            >
              <span className="relative block aspect-[6/5] bg-[radial-gradient(60%_60%_at_50%_45%,rgb(254_188_49/0.14),transparent_70%)]">
                <Image
                  src="/oneprodige/jersey.webp"
                  alt="The One Prodige jersey, gold with black trim, front and back"
                  fill
                  sizes="(min-width: 1024px) 26rem, 100vw"
                  className="object-contain p-6 transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </span>
              <span className="flex flex-1 flex-col p-6 pt-2">
                <span className="font-display text-3xl uppercase">{ONE_PRODIGE.shop.title}</span>
                <span className="mt-1 text-sm leading-relaxed text-muted-foreground">{ONE_PRODIGE.shop.body}</span>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-electric">
                  Shop on Kapoli <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </span>
            </a>
          </Reveal>
        </div>
      </section>

      {/* ── Close ───────────────────────────────────────────────────────
          One panel, one ask, and the three steps after paying. */}
      <section className="relative pb-24 pt-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <div className="glass-strong rounded-3xl border border-white/10 p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-12">
              <h2 className="font-display text-4xl uppercase text-balance sm:text-5xl">{ONE_PRODIGE.closeTitle}</h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{ONE_PRODIGE.closeBody}</p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href={claimHref} className={cn(buttonVariants({ size: "lg" }), "uppercase tracking-wide")}>
                  Claim {PERCENT}% off <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={SITE.discordSupportUrl}
                  {...EXTERNAL}
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "uppercase tracking-wide")}
                >
                  Ask us on Discord
                </a>
              </div>

              <ol className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-6 border-t border-white/10 pt-8 text-left sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/10">
                <FlowStep title="Pick a package" body={`Your ${PERCENT}% is already on it.`} />
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
