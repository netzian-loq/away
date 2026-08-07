import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { MaskReveal } from "@/components/motion/mask-reveal";
import { SERVICES } from "@/content/services";

export function ServicesTeaser() {
  return (
    <section id="services-teaser" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-electric">Services</span>
          <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
            <MaskReveal as="span" innerClassName="text-gradient">
              Every layer, tuned.
            </MaskReveal>
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => {
            const Icon = service.icon;
            return (
              <Reveal key={service.slug} delay={i * 0.05}>
                <div className="hover-lift glass spotlight-card h-full rounded-2xl border border-white/5 p-6">
                  <div className="grid h-11 w-11 place-items-center rounded-xl border border-electric/30 bg-electric/10">
                    <Icon className="h-5 w-5 text-electric" strokeWidth={2} />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <h3 className="font-display font-semibold">{service.title}</h3>
                    <span className="font-mono text-sm font-semibold text-electric">{service.priceLabel}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.summary}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <Link href="/services" className="inline-flex min-h-11 items-center gap-2 px-3 text-sm font-semibold text-electric hover:underline">
            See all services <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
