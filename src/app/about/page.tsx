import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Counter } from "@/components/motion/counter";
import { Button } from "@/components/ui/button";
import { ABOUT } from "@/content/about";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "About",
  description: "Away Tweaks is a private PC optimization service for competitive gamers — our mission, method, and results.",
  alternates: { canonical: `${SITE.url}/about` },
};

export default function AboutPage() {
  return (
    <>
      <section className="relative pt-40 pb-16 sm:pt-48">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-electric">{ABOUT.eyebrow}</span>
            <h1 className="mt-4 font-display text-4xl font-bold text-gradient sm:text-5xl">{ABOUT.heroTitle}</h1>
            <p className="mt-5 leading-relaxed text-muted-foreground">{ABOUT.heroBody}</p>
          </Reveal>
        </div>
      </section>

      <section className="relative py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Reveal>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">{ABOUT.missionTitle}</h2>
            <p className="mt-4 leading-relaxed text-foreground/85">{ABOUT.missionBody}</p>
          </Reveal>
        </div>
      </section>

      <section className="relative py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal className="text-center">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Our method</h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ABOUT.methodSteps.map((step, i) => (
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

      <section className="relative py-16">
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:gap-6 sm:px-6">
          {SITE.stats.map((stat) => (
            <div key={stat.label} className="glass rounded-2xl border border-white/5 p-5 text-center">
              <div className="font-display text-2xl font-bold text-gradient sm:text-3xl">
                <Counter to={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <div className="glass-strong rounded-3xl border border-white/10 p-10 sm:p-14">
              <h2 className="font-display text-3xl font-bold text-gradient">{ABOUT.ctaTitle}</h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{ABOUT.ctaBody}</p>
              <Link href="/contact" className="mt-8 inline-block">
                <Button size="lg">
                  Get Optimized <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
