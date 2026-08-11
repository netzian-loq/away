"use client";

import { useEffect, useRef } from "react";
import { scrollEngine } from "@/lib/scroll-engine";

/**
 * A hairline at the very top of the viewport that fills as the page is read.
 *
 * It earns its place on length alone: the home page runs past 10,000px, and
 * with the nav condensing on scroll there is otherwise nothing telling a
 * reader whether they're a third of the way down or nine tenths. Two pixels,
 * no chrome, no percentage label.
 *
 * Cost is one `transform` write per frame on a composited element, and only
 * while the page is actually moving — the engine's loop idles out with it.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    scrollEngine.mount();
    return scrollEngine.subscribe(({ progress }) => {
      bar.style.transform = `scaleX(${progress})`;
    });
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden"
    >
      <div
        ref={barRef}
        className="h-full origin-left bg-gradient-to-r from-electric to-cyan-accent"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
