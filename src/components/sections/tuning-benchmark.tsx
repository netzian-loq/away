"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";

const FPS_FROM = 144;
const FPS_TO = 547;
const LATENCY_FROM = 18.4;
const LATENCY_TO = 3.6;
const RING_RADIUS = 100;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function TuningBenchmark() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fpsRef = useRef<HTMLSpanElement>(null);
  const latencyRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  const ringOffset = useTransform(scrollYProgress, [0, 1], [RING_CIRCUMFERENCE, 0]);
  const fps = useTransform(scrollYProgress, [0, 1], [FPS_FROM, FPS_TO]);
  const latency = useTransform(scrollYProgress, [0, 1], [LATENCY_FROM, LATENCY_TO]);

  // Text content (FPS/latency numbers, the "tuning" status label) is updated
  // by writing directly to the DOM node instead of React state, so scrolling
  // never triggers a re-render — the same rAF-batched subscription Framer
  // Motion already uses for the ring's strokeDashoffset, just applied to
  // textContent instead of a style prop.
  useMotionValueEvent(fps, "change", (latest) => {
    if (fpsRef.current) fpsRef.current.textContent = String(Math.round(latest));
  });
  useMotionValueEvent(latency, "change", (latest) => {
    if (latencyRef.current) latencyRef.current.textContent = latest.toFixed(1);
  });
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (statusRef.current) statusRef.current.textContent = latest >= 0.92 ? "Tuned" : "Tuning…";
  });

  // Reduced motion: show the finished (tuned) state statically.
  useEffect(() => {
    if (!reducedMotion) return;
    if (fpsRef.current) fpsRef.current.textContent = String(FPS_TO);
    if (latencyRef.current) latencyRef.current.textContent = LATENCY_TO.toFixed(1);
    if (statusRef.current) statusRef.current.textContent = "Tuned";
  }, [reducedMotion]);

  return (
    <section ref={wrapperRef} className="relative h-[220vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden pt-28 sm:pt-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 h-[36rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,var(--electric-glow)_0%,transparent_70%)] blur-3xl opacity-50" />
        </div>

        <div className="mx-auto flex max-w-xl flex-col items-center px-4 text-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-electric">Scroll to tune</span>
          <h2 className="mt-4 font-display text-2xl font-bold sm:text-3xl">Watch your rig respond, live.</h2>

          <div className="relative mt-10 grid h-56 w-56 place-items-center sm:h-64 sm:w-64">
            <svg className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
              <circle
                cx="50%"
                cy="50%"
                r={RING_RADIUS}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="14"
              />
              <motion.circle
                cx="50%"
                cy="50%"
                r={RING_RADIUS}
                fill="none"
                stroke="var(--electric)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                style={{ strokeDashoffset: reducedMotion ? 0 : ringOffset }}
              />
            </svg>
            <div className="text-center">
              <span
                ref={statusRef}
                className="font-mono text-xs font-semibold uppercase tracking-widest text-electric"
              >
                Tuning…
              </span>
              <div className="mt-2 font-display text-sm text-muted-foreground">Away Tweaks</div>
            </div>
          </div>

          <div className="mt-10 grid w-full grid-cols-2 gap-4">
            <div className="glass spotlight-card rounded-2xl border border-white/5 p-5">
              <div className="flex items-center justify-center gap-1 text-xs font-semibold text-emerald-400">
                <ArrowUp className="h-3 w-3" /> FPS
              </div>
              <div className="mt-1 font-display text-3xl font-bold">
                <span ref={fpsRef}>{FPS_FROM}</span>
              </div>
            </div>
            <div className="glass spotlight-card rounded-2xl border border-white/5 p-5">
              <div className="flex items-center justify-center gap-1 text-xs font-semibold text-emerald-400">
                <ArrowDown className="h-3 w-3" /> Latency
              </div>
              <div className="mt-1 font-display text-3xl font-bold">
                <span ref={latencyRef}>{LATENCY_FROM.toFixed(1)}</span>
                <span className="text-lg">ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
