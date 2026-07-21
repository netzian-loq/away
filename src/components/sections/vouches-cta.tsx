import Link from "next/link";
import { Disc } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { SITE } from "@/content/site";

export function VouchesCTA() {
  return (
    <section id="vouches" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <Reveal>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-electric">Private Vouches</span>
          <h2 className="mt-4 font-display text-3xl font-bold text-gradient sm:text-4xl">The proof is in the Discord.</h2>
          <p className="mt-4 text-muted-foreground">
            No staged testimonials here. Every vouch is written by a real client in our server —
            read them all, raw and unfiltered, then decide for yourself.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={SITE.discordVouchesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ size: "lg" })}
            >
              <Disc className="h-4 w-4" /> Read the vouches
            </a>
            <Link href="/contact" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Get optimized
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
