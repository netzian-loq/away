"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";

// Dim resting state -> bright revealed state. Normal words land on the
// site's foreground white; highlighted words land on electric purple.
const DIM_COLOR = "oklch(0.42 0.07 300)";
const BRIGHT_COLOR = "oklch(0.97 0.012 300)";
const ELECTRIC_COLOR = "oklch(0.74 0.21 305)";

interface ScrollWordRevealProps {
  text: string;
  className?: string;
  /** Words rendered in electric purple once revealed (punctuation ignored). */
  highlights?: string[];
}

interface RevealWordProps {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  highlight: boolean;
}

function RevealWord({ children, progress, range, highlight }: RevealWordProps) {
  const opacity = useTransform(progress, range, [0.08, 1]);
  const y = useTransform(progress, range, [14, 0]);
  const color = useTransform(progress, range, [DIM_COLOR, highlight ? ELECTRIC_COLOR : BRIGHT_COLOR]);

  return (
    <motion.span className="inline-block will-change-transform" style={{ opacity, y, color }}>
      {children}
    </motion.span>
  );
}

/**
 * Scroll-scrubbed word reveal: each word starts dim, lifted and nearly
 * transparent, then fades in, settles and brightens one after another as
 * the paragraph crosses the viewport — scrubbing follows the scroll in
 * both directions (driven by Lenis' smoothed scroll position). Highlighted
 * words resolve to electric purple instead of white.
 *
 * Transform/opacity/color only — no layout work per frame.
 */
export function ScrollWordReveal({ text, className, highlights = [] }: ScrollWordRevealProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "end 0.45"],
  });

  const words = text.split(" ");
  const highlightSet = new Set(highlights.map((w) => w.toLowerCase()));
  const step = 1 / words.length;

  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => {
        const start = i * step;
        const end = Math.min(1, start + step * 1.6);
        const bare = word.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
        return (
          <span key={`${word}-${i}`}>
            <RevealWord progress={scrollYProgress} range={[start, end]} highlight={highlightSet.has(bare)}>
              {word}
            </RevealWord>{" "}
          </span>
        );
      })}
    </p>
  );
}
