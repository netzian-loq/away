import { Reveal } from "@/components/motion/reveal";
import { WHY_REASONS } from "@/content/why";

export function WhyUs() {
  return (
    <section id="why" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-electric">Why Away Tweaks</span>
          <h2 className="mt-4 font-display text-3xl font-bold text-gradient sm:text-4xl">
            Deep professional knowledge. Delivered fast.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_REASONS.map((reason, i) => {
            const Icon = reason.icon;
            return (
              <Reveal key={reason.title} delay={i * 0.05}>
                <div className="hover-lift glass spotlight-card flex h-full gap-4 rounded-2xl border border-white/5 p-6">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-electric/30 bg-electric/10">
                    <Icon className="h-5 w-5 text-electric" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">{reason.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{reason.description}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
