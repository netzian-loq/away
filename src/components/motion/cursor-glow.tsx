"use client";

import { useEffect, useRef } from "react";

const GLOW_SIZE = 420;
const FOLLOW_LERP = 0.18;
/** Below this the glow has caught up with the pointer and the loop can stop. */
const SETTLED_PX = 0.15;

/**
 * Motion cursor ported from xnettweaks.com: one large, soft radial glow that
 * trails the pointer through an exponential lerp inside a rAF loop, riding
 * *above* the content on `mix-blend-mode: screen` so it washes over cards
 * instead of hiding behind them.
 *
 * The same loop drives the per-card spotlight: while the pointer is over an
 * element tagged `.spotlight-card`, its `--mx`/`--my` are updated so the card's
 * ::after highlight follows the cursor.
 *
 * Three things keep it off the critical path, all of which it used to get
 * wrong:
 *
 * - The loop stops. It used to run forever at 60fps, writing a transform to a
 *   blended, filtered layer on every one of those frames whether or not the
 *   pointer had moved — a repaint of the blend region for nothing. It now
 *   parks itself once the glow has caught up, and the next mousemove restarts
 *   it.
 * - The card spotlight is written from the loop rather than from the mousemove
 *   handler, so a 120Hz mouse can't invalidate a card's styles 120 times a
 *   second.
 * - No `filter: blur()`. The gradient's own falloff already reads as soft; the
 *   blur on top of it forced an offscreen render pass of a 420px layer on
 *   every frame it moved.
 *
 * Gating: skipped on touch-only devices (`hover: none`), hidden below `sm` in
 * CSS, skipped entirely under `perf-lite`, and hidden by the stylesheet while
 * the page is scrolling fast — blending a full-viewport layer is exactly the
 * work to shed there, and nobody is watching their cursor mid-flick.
 */
export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;
    if (document.documentElement.classList.contains("perf-lite")) return;

    const glow = glowRef.current;
    if (!glow) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let card: HTMLElement | null = null;
    let active = false;
    let frame = 0;
    let running = false;

    const loop = () => {
      const dx = targetX - currentX;
      const dy = targetY - currentY;
      currentX += dx * FOLLOW_LERP;
      currentY += dy * FOLLOW_LERP;
      glow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;

      if (card) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${targetX - rect.left}px`);
        card.style.setProperty("--my", `${targetY - rect.top}px`);
      }

      // Settling is allowed even while a card is hovered: the card's --mx/--my
      // were just written from the pointer's current position, and they can't
      // go stale without a mousemove, which restarts the loop anyway.
      if (Math.abs(dx) < SETTLED_PX && Math.abs(dy) < SETTLED_PX) {
        running = false;
        return;
      }
      frame = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(loop);
    };

    const onMove = (event: MouseEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!active) {
        active = true;
        // Snap on the first move so the glow doesn't fly in from the origin.
        currentX = targetX;
        currentY = targetY;
        glow.style.opacity = "1";
      }
      const hovered = (event.target as Element | null)?.closest?.(".spotlight-card");
      card = hovered instanceof HTMLElement ? hovered : null;
      start();
    };

    const onLeave = () => {
      active = false;
      card = null;
      glow.style.opacity = "0";
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      className="cursor-glow pointer-events-none fixed top-0 left-0 z-[2] hidden rounded-full opacity-0 mix-blend-screen transition-opacity duration-300 will-change-transform sm:block"
      style={{
        width: GLOW_SIZE,
        height: GLOW_SIZE,
        background:
          "radial-gradient(closest-side, oklch(0.62 0.25 300 / 0.2), oklch(0.72 0.2 320 / 0.1) 40%, transparent 70%)",
      }}
    />
  );
}
