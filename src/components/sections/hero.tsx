import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { Counter } from "@/components/motion/counter";
import { SITE } from "@/content/site";

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-32 pb-24">
      {/* No opaque background layer here on purpose — the sitewide
          AmbientBackground (rendered once in the root layout) shows through
          behind Hero the same way it does on the rest of the page. Just a
          light grid texture on top of it. */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <Reveal>
            <span className="inline-grid h-24 w-24 place-items-center overflow-hidden rounded-3xl ring-1 ring-electric/40 shadow-glow sm:h-32 sm:w-32">
              <Image src="/logo.png" alt="Away Tweaks" width={1024} height={1024} className="h-full w-full object-cover" />
            </span>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="mt-8 font-display text-[clamp(2.5rem,8vw,6rem)] font-bold leading-[0.95] tracking-tight">
              <span className="text-gradient">Away Tweaks.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Professional PC optimization for maximum gaming performance. FPS boost, latency
              reduction, and system tweaks engineered for competitive play.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Link href="/contact" className={buttonVariants({ size: "lg" })}>
                Contact now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/services" className={buttonVariants({ size: "lg", variant: "outline" })}>
                View PRO tweaks
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="mt-20 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-6">
              {SITE.stats.map((stat) => (
                <div key={stat.label} className="glass spotlight-card rounded-2xl border border-white/5 p-4 text-center sm:p-5">
                  <div className="font-display text-2xl font-bold text-gradient sm:text-3xl">
                    <Counter to={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      <a
        href="#services-teaser"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-muted-foreground/60 hover:text-electric"
        aria-label="Scroll to services"
      >
        <ChevronDown className="h-6 w-6 animate-bounce" />
      </a>
    </section>
  );
}
