"use client";

import { useEffect, useSyncExternalStore } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const OUTER_SIZE = 640;
const CORE_SIZE = 220;

function getEnabledSnapshot() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const liteMode = document.documentElement.classList.contains("perf-lite");
  return !reduced && finePointer && !liteMode;
}

function getServerSnapshot() {
  return false;
}

// No real "change" event to subscribe to — these capabilities don't
// change after mount — so this is a permanent no-op subscription.
function subscribe() {
  return () => {};
}

/**
 * A violet glow that trails the cursor with spring easing — desktop only
 * (skips touch/coarse pointers), off for prefers-reduced-motion and
 * perf-lite. Two layers (a big soft outer glow + a smaller, brighter core)
 * for more visual punch than a single flat blob. Uses motion values, not
 * React state, so the mousemove handler never triggers a re-render — only
 * compositor-only transform updates.
 *
 * `enabled` is read via useSyncExternalStore (not useState+useEffect) so
 * this browser-only check is safe under SSR without ever calling setState
 * inside an effect body.
 *
 * The same mousemove listener also drives the per-card spotlight effect:
 * while the pointer is over an element carrying the `spotlight-card`
 * utility, its --mx/--my custom properties are updated so that card's own
 * CSS-driven radial highlight follows the cursor (see globals.css).
 */
export function CursorGlow() {
  const enabled = useSyncExternalStore(subscribe, getEnabledSnapshot, getServerSnapshot);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Core tracks the cursor closely (snappy); the outer glow lags slightly
  // behind it (softer trail) — the gap between the two is what reads as
  // "extreme" energy rather than a static blob sitting under the pointer.
  const coreX = useSpring(x, { damping: 22, stiffness: 260, mass: 0.4 });
  const coreY = useSpring(y, { damping: 22, stiffness: 260, mass: 0.4 });
  const outerX = useSpring(x, { damping: 24, stiffness: 90, mass: 0.7 });
  const outerY = useSpring(y, { damping: 24, stiffness: 90, mass: 0.7 });

  const coreTranslateX = useTransform(coreX, (v) => v - CORE_SIZE / 2);
  const coreTranslateY = useTransform(coreY, (v) => v - CORE_SIZE / 2);
  const outerTranslateX = useTransform(outerX, (v) => v - OUTER_SIZE / 2);
  const outerTranslateY = useTransform(outerY, (v) => v - OUTER_SIZE / 2);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);

      const card = (e.target as Element | null)?.closest?.(".spotlight-card");
      if (card instanceof HTMLElement) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        card.style.setProperty("--my", `${e.clientY - rect.top}px`);
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 -z-10 rounded-full opacity-50 mix-blend-screen blur-[120px]"
        style={{
          width: OUTER_SIZE,
          height: OUTER_SIZE,
          x: outerTranslateX,
          y: outerTranslateY,
          background: "radial-gradient(circle, var(--electric-glow) 0%, transparent 70%)",
        }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 -z-10 rounded-full opacity-70 mix-blend-screen blur-[60px]"
        style={{
          width: CORE_SIZE,
          height: CORE_SIZE,
          x: coreTranslateX,
          y: coreTranslateY,
          background: "radial-gradient(circle, var(--electric) 0%, transparent 70%)",
        }}
      />
    </>
  );
}
