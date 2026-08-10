import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SITE } from "@/content/site";

/**
 * Asymmetric 7/5 split rather than the centred stack this used to be.
 *
 * The old version put the logo, an H1 that just said "Away Tweaks.", a generic
 * subhead and four glass stat cards down the middle of the page — the exact
 * shape of every AI-generated hero. Nothing about it argued for the service.
 *
 * This one leads with the claim the whole business rests on (your hardware is
 * fine, the software is what's slow), states concretely what a session does,
 * and demotes the numbers to a quiet typographic rail on the right where they
 * support the claim instead of competing with it.
 */
export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-36 pb-24">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_at_30%_40%,black_20%,transparent_70%)]" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
          {/* 7 of 12 — the argument. */}
          <div className="lg:col-span-7">
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
              PC optimization · booked on Discord
            </span>

            {/* Deliberately about the reader's problem, not the method. The
                Manifesto section directly below already opens with "Your rig
                is capable of more. We strip Windows down to the metal…" — an
                earlier draft of this headline made the same argument in the
                same words one scroll earlier. The hero states the pain; the
                manifesto answers it. */}
            <h1 className="mt-6 font-display text-[clamp(2.75rem,7vw,5.25rem)] leading-[0.95] font-bold tracking-[-0.03em] text-balance">
              Stop losing fights to your own PC.
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
              A one-to-one tuning session for competitive players. You keep your install, every
              change is backed up and reversible, and nothing is signed off until it has held
              stable under load.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/checkout" className={buttonVariants({ size: "lg" })}>
                See packages and prices <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="tap-target text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline sm:ml-2"
              >
                Or tell us your specs first
              </Link>
            </div>
          </div>

          {/* 5 of 12 — supporting evidence, deliberately quieter. */}
          <div className="lg:col-span-5 lg:pl-10">
            <span className="inline-grid h-16 w-16 place-items-center overflow-hidden rounded-2xl ring-1 ring-white/10">
              <Image
                src="/logo.png"
                alt="Away Tweaks"
                width={1024}
                height={1024}
                className="h-full w-full object-cover"
                priority
                fetchPriority="high"
              />
            </span>

            {/* A rule-separated list, not a card grid. No count-up: the numbers
                are the point, the animation was decoration. */}
            <dl className="mt-8 divide-y divide-white/8 border-y border-white/8">
              {SITE.stats.map((stat) => (
                <div key={stat.label} className="flex items-baseline justify-between gap-6 py-4">
                  <dt className="text-sm text-muted-foreground">{stat.label}</dt>
                  <dd className="font-display text-2xl font-bold tabular-nums">
                    {stat.value}
                    <span className="text-muted-foreground">{stat.suffix}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
