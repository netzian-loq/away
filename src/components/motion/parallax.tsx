"use client";

import { useRef, type ReactNode } from "react";
import { useScrollTrack } from "@/lib/use-scroll-track";
import type { TrackOptions } from "@/lib/scroll-engine";

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  /** Total drift in px across the element's pass through the viewport. */
  speed?: number;
}

/** Top at the viewport's bottom edge → bottom at its top edge. */
const RANGE: TrackOptions = { from: ["start", 1], to: ["end", 0] };

/**
 * Soft decorative parallax for background glows and textures: the wrapped
 * element drifts `speed`px slower than the page as it crosses the viewport.
 *
 * Driven straight off the shared scroll engine and written as a
 * `translate3d` — one composited property, one style write per frame, and no
 * per-frame measurement (the engine caches the element's layout position and
 * re-reads it only on resize).
 */
export function Parallax({ children, className, speed = 40 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useScrollTrack(
    ref,
    RANGE,
    (progress) => {
      const element = ref.current;
      if (element) {
        element.style.transform = `translate3d(0, ${speed - progress * speed * 2}px, 0)`;
      }
    },
    0.5, // resting position: mid-drift, i.e. no offset
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
