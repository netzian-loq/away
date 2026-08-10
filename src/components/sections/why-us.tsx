import { Reveal } from "@/components/motion/reveal";
import { WHY_REASONS } from "@/content/why";

/**
 * A numbered editorial list, not a grid of icon cards.
 *
 * This section used to be seven `icon + heading + two lines` cards in a
 * three-column grid, each carrying a stacked `hover-lift glass spotlight-card`
 * treatment. That card is the single most recognisable tell of a generated
 * site, and the lucide icons beside each heading were decoration — a trophy
 * next to "Experienced Optimization" tells the reader nothing the words don't.
 *
 * Set as a two-column list of numbered entries instead: the index numerals do
 * the visual work, the seventh item is allowed to sit alone rather than being
 * padded to eight for symmetry's sake, and there is no card at all.
 */
export function WhyUs() {
  return (
    <section id="why" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-4">
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Why Away Tweaks
            </span>
            <h2 className="mt-5 font-display text-3xl leading-[1.05] font-bold tracking-[-0.02em] text-balance sm:text-4xl">
              Deep professional knowledge. Delivered fast.
            </h2>
          </Reveal>

          <ol className="lg:col-span-8 lg:columns-2 lg:gap-14">
            {WHY_REASONS.map((reason, i) => (
              <li
                key={reason.title}
                className="mb-8 break-inside-avoid border-t border-white/8 pt-5 first:border-t-0 first:pt-0 lg:first:border-t lg:first:pt-5"
              >
                <span className="font-mono text-xs text-muted-foreground/70 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-display font-semibold">{reason.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">
                  {reason.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
