"use client";

import { useEffect, useSyncExternalStore } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const SIZE = 520;

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
 * A soft violet glow that trails the cursor with spring easing — desktop
 * only (skips touch/coarse pointers), off for prefers-reduced-motion and
 * perf-lite. Uses motion values, not React state, so the mousemove handler
 * never triggers a re-render — only a compositor-only transform update.
 *
 * `enabled` is read via useSyncExternalStore (not useState+useEffect) so
 * this browser-only check is safe under SSR without ever calling setState
 * inside an effect body.
 */
export function CursorGlow() {
  const enabled = useSyncExternalStore(subscribe, getEnabledSnapshot, getServerSnapshot);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 26, stiffness: 90, mass: 0.6 });
  const springY = useSpring(y, { damping: 26, stiffness: 90, mass: 0.6 });
  const translateX = useTransform(springX, (v) => v - SIZE / 2);
  const translateY = useTransform(springY, (v) => v - SIZE / 2);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 -z-10 rounded-full opacity-30 mix-blend-screen blur-[110px]"
      style={{
        width: SIZE,
        height: SIZE,
        x: translateX,
        y: translateY,
        background: "radial-gradient(circle, var(--electric-glow) 0%, transparent 70%)",
      }}
    />
  );
}
