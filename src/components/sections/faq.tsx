import { Plus } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { FAQ } from "@/content/faq";

/**
 * The questions people otherwise ask in a ticket before buying, answered on
 * the page that sells the services.
 *
 * Native <details>/<summary>: open and close work without any script, the
 * answers are in the HTML for crawlers, and the browser handles keyboard and
 * screen-reader behaviour. Rule-separated rows like the rest of the site's
 * lists, no cards.
 */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="relative scroll-mt-28 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal>
          <h2 id="faq-title" className="font-display text-3xl font-bold sm:text-4xl">
            Questions
          </h2>
        </Reveal>
        <div className="mt-8 divide-y divide-white/8 border-y border-white/8">
          {FAQ.map((entry) => (
            <details key={entry.question} className="group">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {entry.question}
                <Plus
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-45"
                  aria-hidden="true"
                />
              </summary>
              <p className="max-w-2xl pb-5 leading-relaxed text-muted-foreground">{entry.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
