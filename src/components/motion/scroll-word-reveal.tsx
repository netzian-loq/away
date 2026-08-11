"use client";

import { Fragment, useRef } from "react";
import { useScrollTrack } from "@/lib/use-scroll-track";
import type { TrackOptions } from "@/lib/scroll-engine";
import { cn } from "@/lib/utils";

interface ScrollWordRevealProps {
  text: string;
  className?: string;
  /** Words rendered in electric purple once revealed (punctuation ignored). */
  highlights?: string[];
}

/** Top at 90% down the viewport → bottom at 45% down it. */
const RANGE: TrackOptions = { from: ["start", 0.9], to: ["end", 0.45] };

/** How many words wide the fade is, so neighbours overlap instead of ticking. */
const FADE_WORDS = 1.6;
/** Opacity a word rests at before the reveal front reaches it. */
const DIM = 0.1;
/** Lift, in em, of a word that hasn't landed yet. */
const LIFT_EM = 0.18;
/** Below this change a word is left alone — the move isn't visible. */
const EPSILON = 0.004;

/**
 * How far word `index` of `count` has settled, 0–1, at a given scroll
 * progress. Exported for its tests: the edges are the part worth pinning down
 * — the first word has to be lit early and the last one has to actually finish
 * before the paragraph leaves the range.
 */
export function wordSettle(progress: number, index: number, count: number): number {
  // The front travels over `count + FADE_WORDS - 1` so the last word still
  // gets its whole fade inside the range instead of topping out part-lit.
  const reach = progress * (count + FADE_WORDS - 1);
  const state = Math.min(1, Math.max(0, (reach - index) / FADE_WORDS));
  // Quantised, because the arithmetic lands a hair under 1 for some word
  // counts — 0.9999999999999998 rather than 1 — and the component keys "clear
  // the inline styles" off an exact 1. Four decimals is far finer than the
  // 0.004 the component already treats as invisible, so nothing is lost.
  return Math.round(state * 1e4) / 1e4;
}

/**
 * Scroll-scrubbed word reveal: each word starts dim and lifted, then settles
 * and brightens one after another as the paragraph crosses the viewport,
 * following the scroll in both directions. Highlighted words land on electric
 * purple.
 *
 * What matters here is how little runs per frame. The obvious build — and what
 * this was — gives every word its own motion values for opacity, y *and*
 * colour, so a forty-word paragraph wrote a hundred and twenty inline styles
 * every frame, held forty `will-change` compositor layers it never released,
 * and interpolated forty colours, which is paint work rather than compositing.
 * On this page it was the most expensive thing happening during a scroll.
 *
 * This version subscribes once, to the shared scroll engine, and on each frame
 * touches only the words whose state actually changed. Since the fade is 1.6
 * words wide, that's two or three spans per frame in the middle of the
 * paragraph and none at all once it has fully landed. Colour is static — the
 * dim-to-bright read comes from opacity over the dark background, which the
 * compositor can do on its own.
 */
export function ScrollWordReveal({ text, className, highlights = [] }: ScrollWordRevealProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const spans = useRef<(HTMLSpanElement | null)[]>([]);
  const settled = useRef<number[]>([]);

  useScrollTrack(
    ref,
    RANGE,
    (progress) => {
      const words = spans.current;

      for (let index = 0; index < words.length; index += 1) {
        const element = words[index];
        if (!element) continue;

        const state = wordSettle(progress, index, words.length);
        if (Math.abs(state - settled.current[index]) < EPSILON) continue;
        settled.current[index] = state;

        element.style.opacity = state === 1 ? "" : String(DIM + (1 - DIM) * state);
        element.style.transform =
          state === 1 ? "" : `translate3d(0, ${(1 - state) * LIFT_EM}em, 0)`;
      }
    },
    1, // resting state: fully revealed
  );

  const words = text.split(" ");
  const highlighted = new Set(highlights.map((word) => word.toLowerCase()));

  return (
    <p ref={ref} className={cn("word-reveal", className)}>
      {words.map((word, index) => {
        const bare = word.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
        return (
          <Fragment key={`${word}-${index}`}>
            {/* Spaces stay outside the animated spans, as text nodes of the
                paragraph — a lifted word shouldn't drag its gap up with it.
                And no inline styles here: the words render at rest, so the
                paragraph is readable before hydration and without JS. */}
            <span
              ref={(element) => {
                spans.current[index] = element;
              }}
              className={highlighted.has(bare) ? "text-electric" : undefined}
            >
              {word}
            </span>{" "}
          </Fragment>
        );
      })}
    </p>
  );
}
