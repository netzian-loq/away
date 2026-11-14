import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { OVERTUNER } from "@/content/overtuner";
import { UEFI_KOMPILE } from "@/content/uefi-kompile";

const TOOLS = [
  { name: UEFI_KOMPILE.name, href: UEFI_KOMPILE.path, line: "BIOS tuning tool" },
  { name: OVERTUNER.name, href: OVERTUNER.path, line: "Nvidia GPU overclocking and tuning app" },
];

/**
 * The two apps, linked from the home page. Before this the only way to them
 * was the nav, so the page with the most link weight on the site passed none
 * of it to either product page.
 *
 * Deliberately plain: rule-separated rows like the hero stats, no cards. It
 * is a signpost between two larger sections, not a section to compete with
 * them.
 */
export function SoftwareLinks() {
  return (
    <section aria-labelledby="software-title" className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal>
          <h2 id="software-title" className="font-display text-2xl font-bold sm:text-3xl">
            Our own tools
          </h2>
          <ul className="mt-6 divide-y divide-white/8 border-y border-white/8">
            {TOOLS.map((tool) => (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  className="group flex min-h-11 items-baseline justify-between gap-6 py-4"
                >
                  <span className="min-w-0">
                    <span className="font-display text-lg font-semibold group-hover:text-electric">
                      {tool.name}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{tool.line}</span>
                  </span>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-electric"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
