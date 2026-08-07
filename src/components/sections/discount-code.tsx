"use client";

import Link from "next/link";
import { Check, Copy, Zap, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useCopyToClipboard } from "@/lib/use-copy-to-clipboard";
import { cn } from "@/lib/utils";

interface DiscountCodeProps {
  code: string;
  percentOff: number;
  eyebrow: string;
  body: string;
  label: string;
  hint: string;
  /** Optional "Buy now" link that pre-fills the code at checkout. */
  ctaHref?: string;
  ctaLabel?: string;
  className?: string;
}

/**
 * Partner discount panel: pitch on the left, a click-to-copy code on the
 * right. The whole code box is the button, so it works the same on touch as
 * it does with a mouse.
 */
export function DiscountCode({
  code,
  percentOff,
  eyebrow,
  body,
  label,
  hint,
  ctaHref,
  ctaLabel = "Buy with the discount",
  className,
}: DiscountCodeProps) {
  const { copy, isCopied } = useCopyToClipboard();
  const copied = isCopied(code);

  return (
    <div
      className={cn(
        "glass-strong spotlight-card relative overflow-hidden rounded-3xl border border-electric/25 p-8 sm:p-10",
        className,
      )}
    >
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />

      <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto_20rem] lg:gap-10">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-electric">
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            {eyebrow}
          </div>

          <div className="mt-4 font-display text-5xl font-bold leading-none text-cyan-accent sm:text-6xl">
            {percentOff}
            <span className="ml-1 align-top text-xl font-semibold uppercase tracking-wide text-foreground/80 sm:text-2xl">
              % off
            </span>
          </div>

          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">{body}</p>

          {ctaHref && (
            <Link href={ctaHref} className={buttonVariants({ className: "mt-7" })}>
              {ctaLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Dashed rule: vertical beside the code on wide screens, horizontal above it when stacked. */}
        <div
          aria-hidden="true"
          className="h-px w-full border-t border-dashed border-white/15 lg:h-40 lg:w-px lg:border-l lg:border-t-0"
        />

        <div className="text-center">
          <div className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </div>

          <button
            type="button"
            onClick={() => copy(code)}
            aria-label={`Copy discount code ${code}`}
            className="group mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-dashed border-cyan-accent/60 bg-white/[0.03] px-6 py-4 transition-all duration-300 hover:border-cyan-accent hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric"
          >
            <span className="font-mono text-2xl font-medium tracking-[0.12em] text-foreground">
              {code}
            </span>
            {copied ? (
              <Check className="h-5 w-5 shrink-0 text-cyan-accent" aria-hidden="true" />
            ) : (
              <Copy
                className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-cyan-accent"
                aria-hidden="true"
              />
            )}
          </button>

          <div aria-live="polite" className="mt-3 text-xs text-muted-foreground">
            {copied ? "Copied!" : hint}
          </div>
        </div>
      </div>
    </div>
  );
}
