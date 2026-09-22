"use client";

import { Check, Copy } from "lucide-react";
import { useCopyToClipboard } from "@/lib/use-copy-to-clipboard";
import { cn } from "@/lib/utils";

export interface PriceExample {
  /** Package the example is priced on, e.g. "Pro Level". */
  name: string;
  /** List price, already formatted for the visitor's currency. */
  listPrice: string;
  /** Price with the partner code, already formatted. */
  yourPrice: string;
  /** The euro amount actually charged, when the display currency differs. */
  chargedNote?: string;
}

interface PartnerCodeCardProps {
  code: string;
  percentOff: number;
  example: PriceExample;
  className?: string;
}

/**
 * The visual in a partner page's hero, and deliberately not a decoration.
 *
 * What someone arriving from a creator's link wants to know is "what do I
 * get", so the hero shows exactly that: the code, and one real package priced
 * with it. The numbers arrive pre-formatted from the server, computed from
 * the same catalog checkout charges from, so this card cannot advertise a
 * price that checkout then contradicts.
 *
 * Colour is kept to the code itself. It is the one thing on the card that
 * does something, so it is the one thing with an accent stroke; the rest
 * stays neutral.
 */
export function PartnerCodeCard({ code, percentOff, example, className }: PartnerCodeCardProps) {
  const { copy, isCopied } = useCopyToClipboard();
  const copied = isCopied(code);

  return (
    <div
      className={cn(
        "glass-strong relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm text-muted-foreground">Your code</span>
        <span className="font-display text-sm font-semibold text-foreground/90">
          {percentOff}% off everything
        </span>
      </div>

      <button
        type="button"
        onClick={() => copy(code)}
        aria-label={`Copy discount code ${code}`}
        className={cn(
          "group mt-3 flex w-full items-center justify-between gap-4 rounded-xl border border-dashed px-5 py-4",
          "border-electric/50 bg-white/[0.02] transition-colors duration-300",
          "hover:border-electric hover:bg-white/[0.04] active:scale-[0.99]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric",
        )}
      >
        <span className="font-mono text-2xl font-medium tracking-[0.14em] text-foreground sm:text-3xl">
          {code}
        </span>
        {copied ? (
          <Check className="h-5 w-5 shrink-0 text-electric" aria-hidden="true" />
        ) : (
          <Copy
            className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
            aria-hidden="true"
          />
        )}
      </button>
      <p aria-live="polite" className="mt-2 text-xs text-muted-foreground">
        {copied ? "Copied." : "Tap to copy. It is already on your order if you continue from here."}
      </p>

      {/* One real package, priced with the code. A percentage is abstract; a
          price the visitor would actually pay is not. */}
      <div className="mt-6 border-t border-white/10 pt-5">
        <div className="flex items-baseline justify-between gap-4 text-sm">
          <span className="text-muted-foreground">{example.name}</span>
          <span className="font-mono text-muted-foreground line-through">{example.listPrice}</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-4">
          <span className="text-sm text-foreground/90">With {code}</span>
          <span className="text-right">
            <span className="block font-display text-4xl font-bold text-gradient">
              {example.yourPrice}
            </span>
            {example.chargedNote && (
              <span className="block text-[11px] text-muted-foreground">{example.chargedNote}</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
