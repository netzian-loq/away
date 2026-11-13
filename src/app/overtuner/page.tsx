import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Icon3d, type Icon3dName } from "@/components/ui/icon-3d";
import { Reveal } from "@/components/motion/reveal";
import { MaskReveal } from "@/components/motion/mask-reveal";
import { buttonVariants } from "@/components/ui/button";
import { SoftwareJsonLd } from "@/components/seo/software-json-ld";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { OVERTUNER, type OverTunerIcon } from "@/content/overtuner";
import { SITE } from "@/content/site";
import { getDisplayCurrency } from "@/lib/currency.server";
import { chargedNote, formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";

const PATH = OVERTUNER.path;

export const metadata: Metadata = {
  title: `${OVERTUNER.name}: Nvidia GPU Overclocking and Game Optimization App`,
  description: OVERTUNER.description,
  alternates: { canonical: `${SITE.url}${PATH}` },
  openGraph: {
    title: `${OVERTUNER.name} - ${SITE.name}`,
    description: OVERTUNER.description,
    url: `${SITE.url}${PATH}`,
  },
};

const GROUP_ICONS: Record<OverTunerIcon, Icon3dName> = {
  gpu: "gpu",
  game: "gamepad",
  system: "bios",
};

/** Sold through a Discord ticket, like every manual order on the site. The
 *  price rides on the button so nobody opens a ticket without knowing it. */
function GetButton({ price, className }: { price?: string; className?: string }) {
  return (
    <a
      href={SITE.discordSupportUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ size: "lg" }), className)}
    >
      {OVERTUNER.cta}
      {price && ` · ${price}`} <ArrowRight className="h-4 w-4" />
    </a>
  );
}

export default async function OverTunerPage() {
  const currency = await getDisplayCurrency();
  const price = formatPrice(OVERTUNER.yearlyPrice, currency);
  const charged = chargedNote(OVERTUNER.yearlyPrice, currency);
  const [gpu, ...rest] = OVERTUNER.groups;

  return (
    <>
      <BreadcrumbJsonLd crumbs={[{ name: OVERTUNER.name, path: PATH }]} />
      <SoftwareJsonLd
        name={OVERTUNER.name}
        path={PATH}
        description={OVERTUNER.description}
        image="/overtuner/main.webp"
        price={OVERTUNER.yearlyPrice}
        priceNote="Per year"
      />

      {/* Hero: the pitch on the left, the real app on the right. */}
      <section className="relative pt-28 pb-14 sm:pt-32 lg:pb-20">
        <div aria-hidden="true" className="stage" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
          <Reveal className="min-w-0">

            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.04] tracking-tight sm:text-6xl">
              <MaskReveal as="span" innerClassName="text-gradient">
                {OVERTUNER.name}
              </MaskReveal>
            </h1>

            <p className="mt-5 font-display text-xl font-semibold text-foreground/90 sm:text-2xl">
              {OVERTUNER.tagline}
            </p>
            <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">{OVERTUNER.heroSubtitle}</p>

            <p className="mt-7 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-4xl font-bold text-gradient">{price}</span>
              <span className="text-sm text-muted-foreground">per year{charged && ` · ${charged}`}</span>
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <GetButton />
              <Link href="#features" className={buttonVariants({ variant: "outline", size: "lg" })}>
                What it does
              </Link>
            </div>
          </Reveal>

          <Reveal className="min-w-0" delay={0.12}>
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-glow-lg">
              <Image
                src="/overtuner/main.webp"
                alt="OverTuner: the overclocking window with core and memory offset sliders, power and thermal limits, and the OPTIA game optimization window"
                width={1919}
                height={1032}
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="h-auto w-full"
                loading="eager"
                fetchPriority="high"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* The preview video, on its own row and at full width: it is the one
          place the app is seen moving. Not autoplayed, it has sound. */}
      <section className="relative py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">See it run.</h2>
            <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-black">
              <video
                controls
                preload="none"
                playsInline
                poster="/overtuner/poster.jpg"
                className="aspect-video h-auto w-full"
                aria-label="OverTuner preview video"
              >
                <source src="/overtuner/preview.mp4" type="video/mp4" />
              </video>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Features: one wide cell for the GPU side, which is most of the app,
          and two narrower ones beside it. Three groups, three cells. */}
      <section id="features" className="relative scroll-mt-28 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <h2 className="max-w-2xl font-display text-3xl font-bold sm:text-4xl">
              Every surface a normal optimization skips.
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <Reveal className="min-w-0">
              <div className="glass spotlight-card hover-lift relative h-full overflow-hidden rounded-3xl p-7 sm:p-9">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full"
                  style={{ background: "radial-gradient(circle, oklch(0.5 0.24 300 / 0.35), transparent 70%)" }}
                />
                <Icon3d name={GROUP_ICONS[gpu.icon]} size={88} className="-ml-2" />
                <h3 className="mt-5 font-display text-2xl font-bold">{gpu.title}</h3>
                <p className="mt-2 text-muted-foreground">{gpu.body}</p>
                <ul className="mt-8 grid gap-4">
                  {gpu.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-base text-foreground/90">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-electric" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <div className="grid min-w-0 gap-5">
              {rest.map((group, i) => {
                return (
                  <Reveal key={group.title} delay={0.08 * (i + 1)} className="min-w-0">
                    <div className="glass spotlight-card hover-lift h-full rounded-3xl p-7">
                      <Icon3d name={GROUP_ICONS[group.icon]} size={64} className="-ml-1.5" />
                      <h3 className="mt-4 font-display text-xl font-bold">{group.title}</h3>
                      <p className="mt-1.5 text-sm text-muted-foreground">{group.body}</p>
                      <ul className="mt-5 grid gap-2.5">
                        {group.points.map((point) => (
                          <li key={point} className="flex items-start gap-2.5 text-sm text-foreground/90">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Price: one plan, stated once, with the other terms in plain words. */}
      <section id="pricing" className="relative scroll-mt-28 pt-8 pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Reveal>
            <div className="glass-strong rounded-3xl border border-electric/25 p-8 text-center sm:p-12">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">One price, the whole app.</h2>
              <p className="mt-6 flex items-baseline justify-center gap-2">
                <span className="font-display text-6xl font-bold text-gradient">{price}</span>
                <span className="text-muted-foreground">per year</span>
              </p>
              {charged && <p className="mt-2 text-sm text-muted-foreground">{charged}</p>}
              <p className="mx-auto mt-5 max-w-md text-muted-foreground">{OVERTUNER.otherTerms}</p>
              <div className="mt-8 flex justify-center">
                <GetButton price={`${price} / year`} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
