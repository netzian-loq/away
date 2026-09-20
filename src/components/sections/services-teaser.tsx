import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { MaskReveal } from "@/components/motion/mask-reveal";
import { SERVICE_CATEGORIES, servicesIn, type Service } from "@/content/services";
import { BASE_CURRENCY, chargedNote, formatPrice, type DisplayCurrency } from "@/lib/money";

/**
 * The first thing under the hero, and the first thing a visitor can act on.
 *
 * It used to sit fourth, after the manifesto and the video, as a teaser that
 * ended in "see all services" — three clicks and two scroll-throughs between
 * arriving and buying anything. It is now the opening section, every card is
 * priced, and every card is a link straight into checkout with that service
 * already selected. Someone who knows they want a BIOS tune can be on the
 * payment panel one click after landing.
 *
 * Split into the two categories rather than listed as nine cards, because
 * "which of these nine" is exactly the decision that costs people the time
 * this section is meant to save them.
 *
 * `currency` is passed in rather than resolved here: resolving it needs the
 * request, which would make this an async server component, and an async
 * component cannot be rendered by the test suite. The default keeps every
 * caller that does not care about currency working unchanged.
 */
export function ServicesTeaser({ currency = BASE_CURRENCY }: { currency?: DisplayCurrency }) {
  return (
    <section id="services-teaser" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-electric">
            Services
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
            <MaskReveal as="span" innerClassName="text-gradient">
              Pick it. Start today.
            </MaskReveal>
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Every service, priced up front. Tap one and you land on checkout with it already
            chosen — no forms, no quote, no waiting on a reply.
          </p>
        </Reveal>

        {SERVICE_CATEGORIES.map((category) => (
          <div key={category.id} className="mt-14 first:mt-12">
            <Reveal>
              <div className="flex flex-col gap-1 border-t border-white/10 pt-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <h3 className="font-display text-xl font-semibold sm:text-2xl">
                  {category.label}
                </h3>
                <p className="text-sm text-muted-foreground sm:max-w-md sm:text-right">
                  {category.note}
                </p>
              </div>
            </Reveal>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {servicesIn(category.id).map((service, i) => (
                <Reveal key={service.slug} delay={i * 0.05}>
                  <ServiceCard service={service} currency={currency} />
                </Reveal>
              ))}
            </div>
          </div>
        ))}

        {/* The details link is for people who want to read before they buy,
            which the cards deliberately do not make them do. The packages
            link points back up, because they are above this section now. */}
        <Reveal className="mt-12 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">
            Taking more than one? The packages above cost less than the sum of these.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link
              href="#pricing"
              className="inline-flex min-h-11 items-center gap-2 px-3 text-sm font-semibold text-electric hover:underline"
            >
              Back to the packages <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/services"
              className="inline-flex min-h-11 items-center gap-2 px-3 text-sm font-semibold text-muted-foreground hover:text-foreground hover:underline"
            >
              See all services <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/**
 * The whole card is the link, not a "book" button in the corner of it. The
 * card is already the thing being pointed at, and a separate target inside it
 * would mean a second decision about where to aim.
 */
function ServiceCard({
  service,
  currency,
}: {
  service: Service;
  currency: DisplayCurrency;
}) {
  const Icon = service.icon;
  const charged = chargedNote(service.priceValue, currency);

  return (
    <Link
      href={`/checkout?item=${service.slug}`}
      className="hover-lift glass spotlight-card group flex h-full flex-col rounded-2xl border border-white/5 p-6 transition-colors duration-300 hover:border-electric/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-electric/30 bg-electric/10">
          <Icon className="h-5 w-5 text-electric" strokeWidth={2} />
        </div>
        <span className="text-right">
          <span className="block font-mono text-lg font-semibold text-electric">
            {formatPrice(service.priceValue, currency)}
          </span>
          {charged && (
            <span className="block text-[10px] text-muted-foreground">{charged}</span>
          )}
        </span>
      </div>

      <h4 className="mt-4 flex flex-wrap items-center gap-2 font-display font-semibold">
        {service.title}
        {service.tag && (
          <span className="rounded-full border border-cyan-accent/40 bg-cyan-accent/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-cyan-accent">
            {service.tag}
          </span>
        )}
      </h4>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.summary}</p>

      <span className="mt-4 inline-flex items-center gap-1.5 pt-1 text-sm font-semibold text-electric">
        Start this
        <ArrowRight
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}
