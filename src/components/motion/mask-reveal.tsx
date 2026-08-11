"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

interface MaskRevealProps {
  children: ReactNode;
  className?: string;
  /**
   * Classes for the inner, text-bearing element. Paint effects that rely
   * on `background-clip: text` (our `text-gradient`) MUST go here rather
   * than on an ancestor: the ancestor's transparent text colour is
   * inherited by this element, but its gradient background is not, so a
   * gradient left on the outer heading renders the masked text invisible.
   */
  innerClassName?: string;
  delay?: number;
  duration?: number;
  /** Rendered element of the outer mask — use "span" inside a heading. */
  as?: "div" | "span";
}

/**
 * Masked line reveal, the signature move on eszterbial.com: an
 * `overflow: hidden` wrapper clips an inner element that starts pushed
 * fully below the mask and slides up to rest as it scrolls into view. The
 * text appears to rise out of nowhere instead of just fading.
 *
 * Their version drives it with GSAP (`gsap.to(".reveal-inner", { y: "0%",
 * stagger, ease: "power3.out" })`); this is the same effect on framer's
 * whileInView, with an expo-out ease for the same heavy, decisive settle.
 *
 * The mask is grown downward by `DESCENDER_PAD` (cancelled by an equal
 * negative margin, so layout is unchanged) because a mask clipped exactly
 * to the line box shears the tails off descenders — the "y" in "Every
 * layer", the "p" and "g" in "Deep professional knowledge". The travel
 * distance stays greater than that padding so the resting text is still
 * fully hidden before it animates.
 */
const DESCENDER_PAD = "0.18em";
const TRAVEL = "128%";

export function MaskReveal({
  children,
  className,
  innerClassName,
  delay = 0,
  duration = 1.1,
  as = "div",
}: MaskRevealProps) {
  const Wrapper = as === "span" ? motion.span : motion.div;
  const Inner = as === "span" ? motion.span : motion.div;

  // The in-view trigger has to sit on the *outer* wrapper, not the inner
  // element: the inner starts translated fully below the mask, so
  // `overflow: hidden` clips it out of the viewport entirely and an
  // IntersectionObserver watching it would never fire — the text would
  // stay hidden forever. The wrapper is never clipped, so it observes
  // reliably and hands the variant down to the inner element.
  return (
    <Wrapper
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      style={{
        overflow: "hidden",
        display: as === "span" ? "inline-block" : "block",
        paddingBottom: DESCENDER_PAD,
        marginBottom: `-${DESCENDER_PAD}`,
        verticalAlign: as === "span" ? "bottom" : undefined,
      }}
    >
      {/* No `will-change` here. It was pinned on permanently, which holds a
          compositor layer for the life of the page for an animation that runs
          once; framer sets and — importantly — releases it around the actual
          transition. */}
      <Inner
        className={innerClassName}
        style={{ display: as === "span" ? "inline-block" : "block" }}
        variants={{ hidden: { y: TRAVEL }, visible: { y: "0%" } }}
        transition={{ duration, delay, ease: EASE }}
      >
        {children}
      </Inner>
    </Wrapper>
  );
}

interface MaskRevealLinesProps {
  /** Each entry becomes its own masked line, revealed in sequence. */
  lines: string[];
  className?: string;
  lineClassName?: string;
  /** See MaskReveal.innerClassName — put `text-gradient` here, not above. */
  innerClassName?: string;
  stagger?: number;
}

/**
 * Multi-line variant: each line gets its own mask and rises a beat after
 * the previous one — the staggered heading treatment from the same site.
 */
export function MaskRevealLines({
  lines,
  className,
  lineClassName,
  innerClassName,
  stagger = 0.1,
}: MaskRevealLinesProps) {
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <MaskReveal
          key={line}
          className={lineClassName}
          innerClassName={innerClassName}
          delay={i * stagger}
        >
          {line}
        </MaskReveal>
      ))}
    </span>
  );
}
