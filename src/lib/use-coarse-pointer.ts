"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(pointer: coarse)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Safe: a boolean is compared by value, so this never loops. */
const getSnapshot = () => window.matchMedia(QUERY).matches;

/**
 * The server has no idea what device is asking, so it reports `null` and
 * React swaps in the real value after hydration — no mismatch, no guess
 * rendered into the HTML.
 */
const getServerSnapshot = () => null;

/**
 * True on touch-primary devices (phones, tablets), false on mouse-driven ones,
 * `null` until hydrated. Callers should treat `null` as "not decided yet" and
 * render the cheap variant.
 *
 * This gates *cost*, not preference: it's how the heavy pointer-driven work
 * (smooth-scroll hijacking, autoplaying video) stays off phones. It is not a
 * prefers-reduced-motion check — this project intentionally does not gate on
 * that, since it broke SSR hydration on machines reporting `reduce`.
 *
 * Built on useSyncExternalStore rather than useState + useEffect: matchMedia
 * is an external store, and setting state from an effect to mirror it is the
 * pattern React 19's `set-state-in-effect` rule exists to stop.
 */
export function useCoarsePointer(): boolean | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
