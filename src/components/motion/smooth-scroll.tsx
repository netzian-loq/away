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
 * jumping natively.
 *
 * Skipped entirely on touch devices. `syncTouch` takes over native scrolling
 * and re-drives it from JS every frame, which on a phone replaces the
 * compositor's own momentum scrolling — smooth and off the main thread — with
 * a JS loop that has to keep up with the finger. Measured on an iPhone 12
 * profile it was the main source of dropped frames while scrolling the home
 * page. Native scrolling is already better here; CSS keeps anchors eased.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

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
