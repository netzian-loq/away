import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { SINGLE_SERVICES } from "@/content/catalog";
import { PRICING_TIERS, popularityBadge, type PricingTier } from "@/content/pricing";
import { applyDiscount, type Discount } from "@/lib/discounts";
import { chargedNote, formatIn, formatPrice, type DisplayCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";

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

/** Checkout with the package selected AND the partner code on, so nothing is lost. */
export function partnerCheckoutHref(discount: Discount, slug?: string): string {
  return slug
    ? `/checkout?item=${slug}&code=${discount.code}`
    : `/checkout?code=${discount.code}`;
}

/**
 * The package grid on a partner page. Five packages, five cells: the most
 * popular one large, the other four around it. Every number is computed from
 * the catalog with the partner's code applied, and every cell opens checkout
 * with that package selected and the code already on.
 *
 * `singlesSuffix` finishes the singles line in the page's own voice, e.g.
 * "with his code".
 */
export function PartnerPackages({
  discount,
  currency,
  singlesSuffix,
}: {
  discount: Discount;
  currency: DisplayCurrency;
  singlesSuffix: string;
}) {
  const featured = PRICING_TIERS.find((tier) => tier.featured) ?? PRICING_TIERS[0];
  const rest = PRICING_TIERS.filter((tier) => tier !== featured);
  const cheapestSingle = applyDiscount(
    Math.min(...SINGLE_SERVICES.map((item) => item.price)),
    discount,
  );

  return (
    <>
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Reveal className="min-w-0 sm:col-span-2 lg:row-span-2">
          <FeaturedPackage tier={featured} discount={discount} currency={currency} />
        </Reveal>
        {rest.map((tier, i) => (
          <Reveal key={tier.slug} className="min-w-0" delay={0.05 * (i + 1)}>
            <PackageTile tier={tier} discount={discount} currency={currency} />
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-6">
        <p className="text-sm text-muted-foreground">
          Only need one thing?{" "}
          <Link
            href={partnerCheckoutHref(discount)}
            className="inline-flex min-h-11 items-center gap-1 font-semibold text-electric hover:underline"
          >
            Single services start at {formatPrice(cheapestSingle, currency)} {singlesSuffix}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </p>
      </Reveal>
    </>
  );
}

/** The large cell: the most popular package, with everything it includes. */
function FeaturedPackage({
  tier,
  discount,
  currency,
}: {
  tier: PricingTier;
  discount: Discount;
  currency: DisplayCurrency;
}) {
  const yours = applyDiscount(tier.price, discount);
  const charged = chargedNote(yours, currency);

  return (
    <Link
      href={partnerCheckoutHref(discount, tier.slug)}
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

/** A small cell: name, what is in it, and the partner price. The whole tile is the link. */
function PackageTile({
  tier,
  discount,
  currency,
}: {
  tier: PricingTier;
  discount: Discount;
  currency: DisplayCurrency;
}) {
  const yours = applyDiscount(tier.price, discount);
  const charged = chargedNote(yours, currency);
  const badge = popularityBadge(tier);

  return (
    <Link
      href={partnerCheckoutHref(discount, tier.slug)}
      className={cn(
        "group glass hover-lift flex h-full flex-col rounded-2xl border p-5",
        "transition-colors duration-300 hover:border-electric/40 active:scale-[0.99]",
        badge ? "border-electric/25" : "border-white/5",
      )}
    >
      <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <span className="font-display font-semibold">{tier.name}</span>
        {badge && (
          <span className="rounded-full border border-electric/40 px-2 py-0.5 text-[11px] font-semibold text-electric">
            {badge}
          </span>
        )}
      </span>
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

/** One step of the "how it works" row under a partner page's closing button. */
export function FlowStep({ title, body }: { title: string; body: string }) {
  return (
    <li className="sm:px-6 sm:first:pl-0 sm:last:pr-0">
      <span className="block font-display font-semibold">{title}</span>
      <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{body}</span>
    </li>
  );
}
