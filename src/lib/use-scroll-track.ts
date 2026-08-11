"use client";

import { useEffect, useRef, type RefObject } from "react";
import { trackElement, type TrackOptions } from "@/lib/scroll-engine";

/**
 * Subscribes an element to the scroll engine for the life of the component.
 *
 * `onProgress` is held in a ref so passing an inline arrow — which every
 * caller does — doesn't tear the subscription down and re-measure on each
 * render.
 *
 * When motion is turned down (`perf-lite`: prefers-reduced-motion, or no GPU)
 * nothing is tracked at all. The effect is applied once at `settled` — the
 * value it would hold at rest — so the page looks finished rather than frozen
 * mid-animation.
 */
export function useScrollTrack(
  ref: RefObject<HTMLElement | null>,
  options: TrackOptions,
  onProgress: (progress: number) => void,
  settled: number,
) {
  const callback = useRef(onProgress);
  useEffect(() => {
    callback.current = onProgress;
  }, [onProgress]);

  const { from, to, overscan } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (document.documentElement.classList.contains("perf-lite")) {
      callback.current(settled);
      return;
    }

    return trackElement(
      element,
      { from, to, overscan },
      (progress) => callback.current(progress),
    );
    // `from`/`to` are literal tuples defined at module scope by every caller,
    // so this settles on mount and never re-subscribes.
  }, [ref, from, to, overscan, settled]);
}
