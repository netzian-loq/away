"use client";

import { useRef, type ReactNode } from "react";
import { useScrollTrack } from "@/lib/use-scroll-track";
import type { TrackOptions } from "@/lib/scroll-engine";

interface ScrollScaleProps {
  children: ReactNode;
  className?: string;
  /** Starting scale as the element enters; settles to 1 mid-viewport. */
  from?: number;
}

/** Top at the viewport's bottom edge → element centred in the viewport. */
const RANGE: TrackOptions = { from: ["start", 1], to: ["center", 0.5] };

/**
 * Scroll-linked media scale, mirroring the `data-img-scale` treatment on
 * eszterbial.com: the card starts slightly oversized and eases down to its
 * true size as it rises through the viewport, so imagery feels like it settles
 * into place rather than popping in.
 *
 * The scale is written to the inner element and measured from the outer one,
 * which is what keeps the effect from reading back its own transform.
 * `overflow-hidden` on the wrapper keeps the oversized frame inside its own
 * corners.
 */
export function ScrollScale({ children, className, from = 1.12 }: ScrollScaleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useScrollTrack(
    ref,
    RANGE,
    (progress) => {
      const inner = innerRef.current;
      if (inner) inner.style.transform = `scale(${from + (1 - from) * progress})`;
    },
    1, // resting state: true size
  );

  return (
    <div ref={ref} className={className}>
      {/* Rendered at true size, not at `from`: the engine writes the real
          scale on mount, which for anything below the fold happens long
          before it is on screen. Starting oversized instead would show a
          visible snap to 1 whenever the page loads already scrolled past it. */}
      <div ref={innerRef} style={{ willChange: "transform" }}>
        {children}
      </div>
    </div>
  );
}
