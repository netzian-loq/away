import { Check } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SERVICES } from "@/content/services";

export function ServicesFull() {
  return (
    <div className="space-y-10">
      {SERVICES.map((service, i) => {
        const Icon = service.icon;
        return (
          <Reveal key={service.slug} delay={i * 0.04}>
            <article className="glass rounded-3xl border border-white/5 p-6 sm:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl border border-electric/40 bg-gradient-to-br from-electric/25 to-cyan-accent/10">
                  <Icon className="h-5 w-5 text-electric" strokeWidth={2} />
                </div>
                <h2 className="font-display text-2xl font-bold">{service.title}</h2>
                <span className="rounded-lg border border-electric/30 bg-electric/10 px-2.5 py-1 font-mono text-sm font-semibold text-electric">
                  {service.priceLabel}
                </span>
              </div>

              <p className="mt-5 max-w-3xl leading-relaxed text-foreground/85">{service.description}</p>

              {service.highlight && (
                <div className="mt-5 flex gap-3 rounded-xl border border-electric/40 bg-electric/10 p-4">
                  <p className="text-sm leading-relaxed text-foreground/90">{service.highlight}</p>
                </div>
              )}

              {service.images && service.images.length > 0 && (
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {service.images.map((image) => (
                    <figure key={image.src} className="glass overflow-hidden rounded-xl border border-white/10">
                      <img src={image.src} alt={image.alt} className="block h-auto w-full" loading="lazy" />
                      <figcaption className="px-3 py-2 font-mono text-xs text-muted-foreground">{image.caption}</figcaption>
                    </figure>
                  ))}
                </div>
              )}

              <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground/85">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}
