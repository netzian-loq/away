import { Sparkles, Check, Disc } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { MaskReveal } from "@/components/motion/mask-reveal";
import { ScrollScale } from "@/components/motion/scroll-scale";
import { buttonVariants } from "@/components/ui/button";
import { FREE_UTILITY } from "@/content/free-utility";
import { SITE } from "@/content/site";

export function FreeUtility() {
  return (
    <section id="utility" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="glass-strong relative overflow-hidden rounded-3xl border border-white/10">
          <div className="absolute inset-0 -z-10">
            <div className="decor-blur absolute top-0 right-0 h-96 w-96 rounded-full bg-[radial-gradient(circle,var(--electric-glow)_0%,transparent_70%)] blur-3xl" />
            <div className="decor-blur absolute bottom-0 left-0 h-96 w-96 rounded-full bg-[radial-gradient(circle,oklch(0.5_0.2_300_/_0.25)_0%,transparent_70%)] blur-3xl" />
          </div>

          <div className="grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:gap-12 lg:p-16">
            <Reveal>
              <div>
                <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-electric">
                  <Sparkles className="h-3 w-3" /> {FREE_UTILITY.eyebrow}
                </span>
                <h2 className="mt-5 font-display text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                  <MaskReveal as="span" innerClassName="text-gradient">
                    {FREE_UTILITY.title}
                  </MaskReveal>
                </h2>
                <p className="mt-5 leading-relaxed text-muted-foreground">{FREE_UTILITY.body}</p>
                <ul className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {FREE_UTILITY.points.map((point) => (
                    <li key={point} className="flex items-center gap-2.5 text-sm">
                      <span className="grid h-5 w-5 place-items-center rounded-md border border-electric/30 bg-electric/15">
                        <Check className="h-3 w-3 text-electric" strokeWidth={3} />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <a
                    href={SITE.discordServerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ size: "lg" })}
                  >
                    <Disc className="h-4 w-4" /> Get it on Discord
                  </a>
                  <span className="text-xs text-muted-foreground">{FREE_UTILITY.ctaCaption}</span>
                </div>
              </div>
            </Reveal>

            <ScrollScale className="overflow-hidden rounded-2xl">
              <div className="relative overflow-hidden rounded-2xl border border-electric/20 bg-black shadow-glow-lg">
                <div className="relative aspect-video w-full">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${FREE_UTILITY.video.videoId}`}
                    title="Away Free Utility, in action"
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              </div>
            </ScrollScale>
          </div>
        </div>
      </div>
    </section>
  );
}
