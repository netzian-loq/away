"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Scroll motion engine ported from slowertweaks.com: Lenis with their exact
 * tuning — duration 1.5, exponential ease-out, wheelMultiplier 0.9,
 * touchMultiplier 1.5, syncTouch — driven by a manual rAF loop.
 *
 * One addition over their config: `anchors: true`, so in-page links (the
 * hero's scroll-down chevron) glide through the same easing instead of
 * jumping natively. Like the source site, it runs unconditionally.
 */
export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
      syncTouch: true,
      anchors: true,
    });

    let frame: number;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
