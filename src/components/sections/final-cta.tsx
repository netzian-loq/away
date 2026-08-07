import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { MaskReveal } from "@/components/motion/mask-reveal";
import { buttonVariants } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <Reveal>
          <div className="glass-strong spotlight-card rounded-3xl border border-white/10 p-10 sm:p-16">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              <MaskReveal as="span" innerClassName="text-gradient">
                Ready to dominate?
              </MaskReveal>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Join the players who stopped blaming their hardware. Get your rig tuned by Away Tweaks.
            </p>
            <Link href="/contact" className={buttonVariants({ size: "lg", className: "mt-8" })}>
              Get Optimized <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
