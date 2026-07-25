"use client";

import { useEffect, useRef } from "react";

const GLOW_SIZE = 420;
const FOLLOW_LERP = 0.18;

/**
 * Motion cursor ported from xnettweaks.com: one large, blurred radial glow
 * that trails the pointer through an exponential lerp
 * (`pos += (target - pos) * 0.18`) inside a single rAF loop, fading in on the
 * first mouse move and out when the pointer leaves the page. It rides *above*
 * the content on `mix-blend-mode: screen` (their z-index: 2), so it washes
 * over cards instead of hiding behind them.
 *
 * The same source script also drives a per-card spotlight: while the pointer
 * moves over an element tagged `.spotlight-card`, its `--mx`/`--my` custom
 * props are updated so the card's ::after highlight follows the cursor.
 * That's handled here too, from the same mousemove listener.
 *
 * Matching the source site's gating: skipped on touch-only devices
 * (`hover: none`) and hidden on small screens via CSS. Like both reference
 * sites, it intentionally does not gate on prefers-reduced-motion.
 */
export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;
    const glow = glowRef.current;
    if (!glow) return;

    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let active = false;
    let frame: number;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!active) {
        active = true;
        // Snap to the pointer on the first move so the glow doesn't
        // visibly fly in from the top-left origin.
        cx = tx;
        cy = ty;
        glow.style.opacity = "1";
      }
      const card = (e.target as Element | null)?.closest?.(".spotlight-card");
      if (card instanceof HTMLElement) {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      }
    };

    const onLeave = () => {
      active = false;
      glow.style.opacity = "0";
    };

    const loop = () => {
      cx += (tx - cx) * FOLLOW_LERP;
      cy += (ty - cy) * FOLLOW_LERP;
      glow.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      frame = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    frame = requestAnimationFrame(loop);

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
      className="pointer-events-none fixed top-0 left-0 z-[2] hidden rounded-full opacity-0 mix-blend-screen blur-[10px] transition-opacity duration-300 will-change-transform sm:block"
      style={{
        width: GLOW_SIZE,
        height: GLOW_SIZE,
        background:
          "radial-gradient(closest-side, oklch(0.62 0.25 300 / 0.2), oklch(0.72 0.2 320 / 0.1) 40%, transparent 70%)",
      }}
    />
  );
}
