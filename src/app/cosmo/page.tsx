import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LineChart, MessagesSquare, Route, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { MaskReveal } from "@/components/motion/mask-reveal";
import { DiscountCode } from "@/components/sections/discount-code";
import { buttonVariants } from "@/components/ui/button";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { COSMO } from "@/content/cosmo";
import { SITE } from "@/content/site";
import { COSMO_DISCOUNT } from "@/lib/discounts";

const TITLE = "Cosmo eSports";
const DESCRIPTION =
  "Away Tweaks x Cosmo eSports — Cosmo players and community get 10% off every PC optimization package. Use code COSMO10 at checkout.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}/cosmo` },
  // Unlisted: reachable only by the link Cosmo shares. Kept out of the nav and
  // the sitemap too — `follow` still lets any links on the page pass value.
  robots: { index: false, follow: true },
  openGraph: {
    title: `${TITLE} — ${SITE.name}`,
    description: DESCRIPTION,
    url: `${SITE.url}/cosmo`,
  },
};

const PILLAR_ICONS: Record<string, LucideIcon> = {
  pathway: Route,
  standards: LineChart,
  community: MessagesSquare,
};

const CLAIM_STEPS = [
  {
    title: "Copy the code",
    body: "Tap the COSMO10 box above — it copies straight to your clipboard.",
  },
  {
    title: "Pick your package",
    body: "Choose the tuning package that fits your rig, from Standard all the way to Extreme.",
  },
  {
    title: "Pay and get tuned",
    body: "Pay with PayPal on the site, then open a ticket in our Discord and we'll book your session.",
  },
];

export default function CosmoPage() {
  const checkoutHref = `/checkout?code=${COSMO_DISCOUNT.code}`;

  return (
    <>
      <BreadcrumbJsonLd crumbs={[{ name: "Cosmo eSports", path: "/cosmo" }]} />

      <section className="relative pt-40 pb-16 sm:pt-48">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <span className="glass inline-flex items-center rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-electric">
              {COSMO.eyebrow}
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold sm:text-5xl">
              <MaskReveal as="span" innerClassName="text-gradient">
                {COSMO.heroTitle}
              </MaskReveal>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-muted-foreground">
              {COSMO.heroSubtitle}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14">
          <Reveal>
            <div className="space-y-6">
              {COSMO.aboutParagraphs.map((paragraph, i) => (
                <p key={i} className="leading-relaxed text-foreground/85">
                  {paragraph.map((segment, j) =>
                    segment.strong ? (
                      <strong key={j} className="font-semibold text-foreground">
                        {segment.text}
                      </strong>
                    ) : (
                      <span key={j}>{segment.text}</span>
                    ),
                  )}
                </p>
              ))}
            </div>
          </Reveal>

          <div className="space-y-4">
            {COSMO.pillars.map((pillar, i) => {
              const Icon = PILLAR_ICONS[pillar.icon];
              return (
                <Reveal key={pillar.title} delay={i * 0.06}>
                  <div className="glass hover-lift spotlight-card rounded-2xl border border-white/5 border-l-2 border-l-electric p-6">
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0 text-electric" aria-hidden="true" />
                      <h2 className="font-display text-sm font-semibold uppercase tracking-wider">
                        {pillar.title}
                      </h2>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section id="discount" className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <DiscountCode
              code={COSMO_DISCOUNT.code}
              percentOff={COSMO_DISCOUNT.percentOff}
              eyebrow={COSMO.offer.eyebrow}
              body={COSMO.offer.body}
              label={COSMO.offer.label}
              hint={COSMO.offer.hint}
              ctaHref={checkoutHref}
            />
          </Reveal>
        </div>
      </section>

      <section className="relative py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal className="text-center">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">How to claim it</h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {CLAIM_STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.06}>
                <div className="glass hover-lift h-full rounded-2xl border border-white/5 p-6">
                  <div className="font-mono text-xs text-electric">0{i + 1}</div>
                  <h3 className="mt-2 font-display font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <div className="glass-strong rounded-3xl border border-white/10 p-10 sm:p-14">
              <h2 className="font-display text-3xl font-bold text-gradient">{COSMO.ctaTitle}</h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{COSMO.ctaBody}</p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href={checkoutHref} className={buttonVariants({ size: "lg" })}>
                  Buy with {COSMO_DISCOUNT.percentOff}% off <ArrowRight className="h-4 w-4" />
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
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
