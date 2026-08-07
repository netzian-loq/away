import Link from "next/link";
import { Check } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { MaskReveal } from "@/components/motion/mask-reveal";
import { buttonVariants } from "@/components/ui/button";
import { PRICING_TIERS } from "@/content/pricing";

export function PricingTable() {
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-electric">Discount Packages</span>
          <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
            <MaskReveal as="span" innerClassName="text-gradient">
              Bundles that save you more.
            </MaskReveal>
          </h2>
          <p className="mt-4 text-muted-foreground">Stack services and pay less. Need something custom? Just ask — we build to spec.</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {PRICING_TIERS.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 0.06}>
              <div
                className={`hover-lift spotlight-card relative flex h-full flex-col rounded-3xl p-6 ${
                  tier.featured ? "glass-strong border border-electric/40" : "glass border border-white/5"
                }`}
              >
                {tier.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-electric to-cyan-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-background">
                    Most popular
                  </span>
                )}
                <div className="font-display text-lg font-semibold">{tier.name}</div>
                <div className="mt-4 font-display text-4xl font-bold text-gradient">{tier.price}€</div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{tier.description}</p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-foreground/90">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/checkout?tier=${tier.slug}`}
                  className={buttonVariants({
                    variant: tier.featured ? "primary" : "outline",
                    className: "mt-7 w-full",
                  })}
                >
                  Choose
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
