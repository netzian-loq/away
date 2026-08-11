"use client";

import { useEffect } from "react";
import { scrollEngine } from "@/lib/scroll-engine";

/**
 * Mounts the site's scroll engine. Renders nothing.
 *
 * All of the behaviour — Lenis smoothing on capable pointers, the shared frame
 * loop, the `data-scroll` phase attribute the stylesheet keys its quality
 * switches off, the geometry cache the scroll-linked effects read — lives in
 * `@/lib/scroll-engine`. This is only the React lifecycle around it, mounted
 * once from the root layout.
 */
export function SmoothScroll() {
  useEffect(() => {
    scrollEngine.mount();
    return () => scrollEngine.unmount();
  }, []);

  return null;
}
