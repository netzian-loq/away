import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { SERVICE_CATEGORIES, servicesIn } from "@/content/services";
import { BASE_CURRENCY, chargedNote, formatPrice, type DisplayCurrency } from "@/lib/money";

export function ServicesFull({ currency = BASE_CURRENCY }: { currency?: DisplayCurrency }) {
  return (
    <div className="space-y-16">
      {SERVICE_CATEGORIES.map((category) => (
        <section key={category.id} className="space-y-10">
          <Reveal>
            <div className="flex flex-col gap-1 border-b border-white/10 pb-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">{category.label}</h2>
              <p className="text-sm text-muted-foreground sm:max-w-md sm:text-right">
                {category.note}
              </p>
            </div>
          </Reveal>

          {servicesIn(category.id).map((service, i) => {
        const Icon = service.icon;
        return (
          <Reveal key={service.slug} delay={i * 0.04}>
            <article className="glass rounded-3xl border border-white/5 p-6 sm:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl border border-electric/40 bg-gradient-to-br from-electric/25 to-cyan-accent/10">
                  <Icon className="h-5 w-5 text-electric" strokeWidth={2} />
                </div>
                <h3 className="font-display text-2xl font-bold">{service.title}</h3>
                {service.tag && (
                  <span className="rounded-full border border-cyan-accent/40 bg-cyan-accent/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-cyan-accent">
                    {service.tag}
                  </span>
                )}
                <span className="rounded-lg border border-electric/30 bg-electric/10 px-2.5 py-1 font-mono text-sm font-semibold text-electric">
                  {formatPrice(service.priceValue, currency)}
                </span>
                {chargedNote(service.priceValue, currency) && (
                  <span className="text-xs text-muted-foreground">
                    {chargedNote(service.priceValue, currency)}
                  </span>
                )}
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
                      <Image
                        src={image.src}
                        alt={image.alt}
                        width={1280}
                        height={800}
                        className="w-full h-auto block"
                      />
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

              <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-white/5 pt-6">
                <Link
                  href={`/checkout?item=${service.slug}`}
                  className={buttonVariants({ size: "lg" })}
                >
                  Buy {formatPrice(service.priceValue, currency)}{" "}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <span className="text-xs text-muted-foreground">
                  Pay by card, PayPal, crypto or bank transfer.
                </span>
              </div>
            </article>
          </Reveal>
            );
          })}
        </section>
      ))}
    </div>
  );
}
