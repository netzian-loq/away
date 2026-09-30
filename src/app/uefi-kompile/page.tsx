import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Coins, Cpu, Gauge, Layers, ShieldCheck, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { MaskReveal } from "@/components/motion/mask-reveal";
import { buttonVariants } from "@/components/ui/button";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { UEFI_KOMPILE, type UefiKompileIcon } from "@/content/uefi-kompile";
import { SITE } from "@/content/site";
import { getDisplayCurrency } from "@/lib/currency.server";
import { chargedNote, formatPrice } from "@/lib/money";

const PATH = UEFI_KOMPILE.path;

export const metadata: Metadata = {
  title: UEFI_KOMPILE.name,
  description: UEFI_KOMPILE.description,
  alternates: { canonical: `${SITE.url}${PATH}` },
  openGraph: {
    title: `${UEFI_KOMPILE.name} — ${SITE.name}`,
    description: UEFI_KOMPILE.description,
    url: `${SITE.url}${PATH}`,
  },
};

const FEATURE_ICONS: Record<UefiKompileIcon, LucideIcon> = {
  depth: Layers,
  presets: Cpu,
  latency: Gauge,
  safe: ShieldCheck,
};

/** Buyers get the tool through a Discord ticket, the same path every manual
 *  order on the site takes; there is no checkout item for it yet. The price
 *  rides on the button so nobody opens a ticket without knowing it. */
function GetButton({ label, price, outline = false }: { label: string; price: string; outline?: boolean }) {
  return (
    <a
      href={SITE.discordSupportUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({ variant: outline ? "outline" : "primary", size: "lg" })}
    >
      {label} · {price} <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </a>
  );
}

export default async function UefiKompilePage() {
  const currency = await getDisplayCurrency();
  const plans = UEFI_KOMPILE.plans;
  // The entry price: the hero and the closing ask quote "from" the cheaper
  // version, the pricing cards give each its own.
  const fromEuros = Math.min(...plans.map((p) => p.price));
  const from = `from ${formatPrice(fromEuros, currency)}`;
  const charged = chargedNote(fromEuros, currency);
  const pro = plans.find((p) => p.id === "pro");
  const upgrade = UEFI_KOMPILE.upgrade;
  const pack = UEFI_KOMPILE.coinPack;
  const packPrice = formatPrice(pack.price, currency);

  return (
    <>
      <BreadcrumbJsonLd crumbs={[{ name: UEFI_KOMPILE.name, path: PATH }]} />

      {/* ── Hero ────────────────────────────────────────────────────────
          Split: the pitch on the left, the real app on the right. The
          screenshot is the proof - a BIOS tool that shows its settings list
          and coins is more convincing than any illustration of one. */}
      <section className="relative pt-28 pb-10 sm:pt-32 lg:pb-14">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
          <Reveal className="min-w-0">
            <span className="glass inline-flex items-center rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-electric">
              {UEFI_KOMPILE.eyebrow}
            </span>

            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.04] tracking-tight sm:text-6xl">
              {/* Accent on the name only: one word of gradient is emphasis, a
                  whole gradient headline is the large saturated fill this
                  brand rejects. */}
              <MaskReveal as="span" innerClassName="text-gradient">
                {UEFI_KOMPILE.name}
              </MaskReveal>
            </h1>

            <p className="mt-5 font-display text-xl font-semibold text-foreground/90 sm:text-2xl">
              {UEFI_KOMPILE.tagline}
            </p>
            <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">{UEFI_KOMPILE.heroSubtitle}</p>

            <p className="mt-7 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-sm text-muted-foreground">From</span>
              <span className="font-display text-4xl font-bold text-gradient">{formatPrice(fromEuros, currency)}</span>
              <span className="text-sm text-muted-foreground">
                Normal{pro && ` · Pro ${formatPrice(pro.price, currency)}`} · {UEFI_KOMPILE.freeCoins} coins included
                {charged && ` · ${charged}`}
              </span>
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <GetButton label={UEFI_KOMPILE.cta} price={from} />
              <Link href="#pricing" className={buttonVariants({ variant: "outline", size: "lg" })}>
                See pricing
              </Link>
            </div>
          </Reveal>

          <Reveal className="min-w-0" delay={0.12}>
            <div className="glass-strong overflow-hidden rounded-2xl border border-white/10 shadow-glow-lg">
              <Image
                src="/uefi-kompile/main.webp"
                alt="Uefi-Kompile main window: a BIOS settings list, the selected setting's details, a Pro account and 25 coins available"
                width={1212}
                height={690}
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="h-auto w-full"
                loading="eager"
                fetchPriority="high"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Facts ───────────────────────────────────────────────────────
          The three numbers from the brief, as a rule-separated row - the
          same construction as the home page's stats, not three cards. */}
      <section className="relative pb-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <dl className="grid grid-cols-1 divide-y divide-white/10 border-y border-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {UEFI_KOMPILE.facts.map((fact) => (
                // dt before dd, as a dl requires; flex-col-reverse shows the
                // number on top without reordering the markup.
                <div key={fact.label} className="flex min-w-0 flex-col-reverse gap-1 py-5 sm:px-6 sm:first:pl-0">
                  <dt className="text-sm text-muted-foreground">{fact.label}</dt>
                  <dd className="font-display text-3xl font-bold tabular-nums">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ── Updates ─────────────────────────────────────────────────────
          The owner's changelog (2026-09-30). One quiet panel with the label
          on the left and the items as plain rows - news, not a feature grid.
          The version choice links down to the cards that price it. */}
      <section aria-labelledby="updates-title" className="relative pt-10 pb-2">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="glass grid gap-6 rounded-3xl border border-white/10 p-6 sm:p-8 md:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)] md:gap-10">
              <div className="min-w-0">
                <span className="inline-flex items-center rounded-full border border-electric/40 bg-electric/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-electric">
                  New
                </span>
                <h2 id="updates-title" className="mt-3 font-display text-2xl font-bold">
                  {UEFI_KOMPILE.updatesTitle}
                </h2>
              </div>
              <ul className="min-w-0 divide-y divide-white/10">
                {UEFI_KOMPILE.updates.map((update) => (
                  <li key={update.title} className="py-4 first:pt-0 last:pb-0">
                    <span className="block font-display text-lg font-semibold">{update.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{update.body}</span>
                  </li>
                ))}
                <li className="pt-4">
                  <Link
                    href="#pricing"
                    className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-electric hover:underline"
                  >
                    Compare Normal and Pro <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── What it does ────────────────────────────────────────────────
          Text on the left, plain rows on the right: nothing here outranks
          its neighbour, so there is no hierarchy for cards to express. */}
      <section className="relative py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <Reveal className="min-w-0">
            <h2 className="font-display text-3xl font-bold text-balance sm:text-4xl">{UEFI_KOMPILE.featuresTitle}</h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">{UEFI_KOMPILE.featuresBody}</p>
          </Reveal>

          <ul className="min-w-0 divide-y divide-white/10 border-y border-white/10">
            {UEFI_KOMPILE.features.map((feature, i) => {
              const Icon = FEATURE_ICONS[feature.icon];
              // The <li> stays the list's direct child with Reveal inside it:
              // a div between a ul and its li is invalid markup.
              return (
                <li key={feature.title}>
                  <Reveal delay={i * 0.06} className="flex gap-4 py-6">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.03]">
                      <Icon className="h-5 w-5 text-electric" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-lg font-semibold">{feature.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{feature.body}</span>
                    </span>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── Presets ─────────────────────────────────────────────────────
          The Preset Manager, with the exact settings a preset writes blurred
          in the screenshot: what the presets change is kept private. */}
      <section className="relative py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14">
          <Reveal className="min-w-0 lg:order-last">
            <h2 className="font-display text-3xl font-bold text-balance sm:text-4xl">{UEFI_KOMPILE.presetsTitle}</h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">{UEFI_KOMPILE.presetsBody}</p>

            <div className="mt-8 flex max-w-md items-start gap-4 rounded-2xl border border-electric/30 bg-electric/[0.06] p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-electric/30 bg-electric/15">
                <Coins className="h-5 w-5 text-electric" strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-lg font-semibold">{UEFI_KOMPILE.coinsTitle}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                  {UEFI_KOMPILE.coinsBody} More are {packPrice} for {pack.coins}.
                </span>
              </span>
            </div>
          </Reveal>

          <Reveal className="min-w-0" delay={0.08}>
            <div className="glass-strong overflow-hidden rounded-2xl border border-white/10 shadow-glow-lg">
              <Image
                src="/uefi-kompile/presets.webp"
                alt="The Uefi-Kompile Preset Manager with the X3D recommended profile set on the rows, ready to apply"
                width={1081}
                height={695}
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="h-auto w-full"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────
          The two versions side by side, then the two smaller buys under
          them: the upgrade and the coin top-up. Every figure is computed from
          the content numbers. Pro is the accented card (the site's
          featured-tier construction): it is the exception; Normal is the
          plain, affordable default. */}
      <section id="pricing" className="relative scroll-mt-28 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold text-balance sm:text-4xl">{UEFI_KOMPILE.pricingTitle}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{UEFI_KOMPILE.pricingBody}</p>
          </Reveal>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {plans.map((plan, i) => {
              const featured = plan.id === "pro";
              const planPrice = formatPrice(plan.price, currency);
              const planCharged = chargedNote(plan.price, currency);
              return (
                <Reveal key={plan.id} className="min-w-0" delay={i * 0.06}>
                  <div
                    className={`flex h-full flex-col rounded-3xl p-7 sm:p-8 ${
                      featured
                        ? "glass-strong border border-electric/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                        : "glass border border-white/10"
                    }`}
                  >
                    <span className="flex flex-wrap items-center gap-3">
                      <span className="font-display text-2xl font-semibold">
                        {UEFI_KOMPILE.name} {plan.name}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                          featured
                            ? "border border-electric/40 bg-electric/10 text-electric"
                            : "border border-white/15 bg-white/[0.04] text-muted-foreground"
                        }`}
                      >
                        {plan.audience}
                      </span>
                    </span>
                    <span className={`mt-4 font-display text-5xl font-bold ${featured ? "text-gradient" : ""}`}>{planPrice}</span>
                    {planCharged && <span className="mt-1 text-xs text-muted-foreground">{planCharged}</span>}
                    <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{plan.summary}</p>
                    <ul className="mt-5 flex-1 space-y-2.5">
                      {plan.points.map((point) => (
                        <li key={point} className="flex items-start gap-2 text-sm text-foreground/90">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-electric" aria-hidden="true" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                    <span className="pt-8">
                      <GetButton label={`Get ${plan.name}`} price={planPrice} outline={!featured} />
                    </span>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* The two smaller buys, both through a ticket like the versions.
              Outline buttons, so neither competes with a version's CTA. */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              {
                key: "upgrade",
                title: `Upgrade ${upgrade.title}`,
                price: upgrade.price,
                line: upgrade.line,
                action: "Upgrade on Discord",
              },
              {
                key: "coins",
                title: `${pack.coins} coins`,
                price: pack.price,
                line: UEFI_KOMPILE.coinPackLine,
                action: "Top up on Discord",
              },
            ].map((buy, i) => (
              <Reveal key={buy.key} className="min-w-0" delay={0.12 + i * 0.06}>
                <div className="glass flex h-full flex-col gap-5 rounded-3xl border border-white/10 p-6 sm:flex-row sm:items-center sm:p-7">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-display text-lg font-semibold">
                      {buy.key === "coins" && <Coins className="h-5 w-5 text-electric" strokeWidth={2} aria-hidden="true" />}
                      {buy.title}
                      <span className="ml-auto font-display text-2xl font-bold sm:ml-2">{formatPrice(buy.price, currency)}</span>
                    </span>
                    {chargedNote(buy.price, currency) && (
                      <span className="mt-0.5 block text-xs text-muted-foreground">{chargedNote(buy.price, currency)}</span>
                    )}
                    <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">{buy.line}</span>
                  </span>
                  <a
                    href={SITE.discordSupportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "outline", size: "lg", className: "shrink-0" })}
                  >
                    {buy.action}
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Close ───────────────────────────────────────────────────────
          One panel, one ask, and the three real steps under it: the tool
          only opens an account on a PC that has been activated, so the PC ID
          step is part of getting it, not a footnote. */}
      <section id="how" className="relative scroll-mt-28 pb-24 pt-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <div className="glass-strong rounded-3xl border border-white/10 p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-12">
              <h2 className="font-display text-3xl font-bold text-balance sm:text-4xl">{UEFI_KOMPILE.closeTitle}</h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{UEFI_KOMPILE.closeBody}</p>

              <div className="mt-8 flex justify-center">
                <GetButton label={UEFI_KOMPILE.cta} price={from} />
              </div>

              <ol className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-6 border-t border-white/10 pt-8 text-left sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/10">
                {UEFI_KOMPILE.steps.map((step) => (
                  <li key={step.title} className="sm:px-6 sm:first:pl-0 sm:last:pr-0">
                    <span className="block font-display font-semibold">{step.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{step.body}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
