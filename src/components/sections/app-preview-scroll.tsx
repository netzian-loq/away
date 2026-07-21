"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, Cpu, Gauge } from "lucide-react";
import { Counter } from "@/components/motion/counter";

const RING_RADIUS = 60;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function AppPreviewScroll() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  // The phone flies in during the first ~45% of this section's scroll
  // range, then holds in place — a short, bounded scroll distance (not the
  // old site's 7000px pinned timeline), driving only transform/opacity
  // (compositor-friendly, no layout/paint work) via scroll-linked motion
  // values instead of a second GSAP instance.
  const phoneOpacity = useTransform(scrollYProgress, [0, 0.35], [0, 1]);
  const phoneScale = useTransform(scrollYProgress, [0, 0.45], [0.7, 1]);
  const phoneRotateX = useTransform(scrollYProgress, [0, 0.45], [30, 0]);
  const phoneRotateY = useTransform(scrollYProgress, [0, 0.45], [-22, 0]);
  const phoneY = useTransform(scrollYProgress, [0, 0.45], [70, 0]);
  const ringOffset = useTransform(scrollYProgress, [0.2, 0.55], [RING_CIRCUMFERENCE, RING_CIRCUMFERENCE * 0.22]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.1, 0.22], [1, 1, 0]);
  const badgeOpacity = useTransform(scrollYProgress, [0.3, 0.55], [0, 1]);
  const badgeY = useTransform(scrollYProgress, [0.3, 0.55], [24, 0]);

  // Reduced-motion: skip the scroll-linked animation entirely and just show
  // the resting (fully revealed) state.
  const staticStyle = reducedMotion
    ? { opacity: 1, scale: 1, rotateX: 0, rotateY: 0, y: 0 }
    : undefined;

  return (
    <section ref={wrapperRef} className="relative h-[200vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--electric-glow)_0%,transparent_65%)] blur-3xl" />
        </div>

        <motion.div
          style={reducedMotion ? { opacity: 0 } : { opacity: hintOpacity }}
          className="absolute top-20 flex flex-col items-center gap-2 sm:top-24"
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-electric">Scroll to tune</span>
          <ChevronDown className="h-4 w-4 animate-bounce text-electric" />
        </motion.div>

        <motion.div
          style={
            staticStyle ?? {
              opacity: phoneOpacity,
              scale: phoneScale,
              rotateX: phoneRotateX,
              rotateY: phoneRotateY,
              y: phoneY,
            }
          }
          className="relative [perspective:1200px]"
        >
          <div className="relative h-[520px] w-[260px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0b0714] shadow-glow-lg sm:h-[560px] sm:w-[280px]">
            <div className="absolute inset-x-0 top-3 z-10 mx-auto h-5 w-24 rounded-full bg-black" />
            <div className="relative flex h-full flex-col px-5 pt-12 pb-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Live</div>
                  <div className="font-display text-lg font-bold">Performance</div>
                </div>
                <div className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-xs font-bold">
                  AT
                </div>
              </div>

              <div className="relative mx-auto my-8 grid h-40 w-40 place-items-center">
                <svg className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
                  <circle cx="80" cy="80" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                  <motion.circle
                    cx="80"
                    cy="80"
                    r={RING_RADIUS}
                    fill="none"
                    stroke="var(--electric)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    style={{ strokeDashoffset: reducedMotion ? RING_CIRCUMFERENCE * 0.22 : ringOffset }}
                  />
                </svg>
                <div className="text-center">
                  <div className="font-display text-3xl font-extrabold tracking-tight text-white">
                    <Counter to={600} duration={1.6} />
                  </div>
                  <div className="mt-0.5 text-[9px] font-bold tracking-[0.1em] text-electric/70 uppercase">
                    FPS Gained
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-electric/10">
                    <Cpu className="h-4 w-4 text-electric" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-1.5 w-20 rounded-full bg-white/15" />
                    <div className="h-1 w-12 rounded-full bg-white/8" />
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-accent/10">
                    <Gauge className="h-4 w-4 text-cyan-accent" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-1.5 w-16 rounded-full bg-white/15" />
                    <div className="h-1 w-24 rounded-full bg-white/8" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            style={reducedMotion ? { opacity: 1, y: 0 } : { opacity: badgeOpacity, y: badgeY }}
            className="glass absolute top-8 -left-4 hidden items-center gap-3 rounded-2xl border border-white/10 p-3 sm:-left-20 sm:flex"
          >
            <div className="grid h-9 w-9 place-items-center rounded-full border border-electric/30 bg-electric/10">
              <span aria-hidden="true">🔥</span>
            </div>
            <div>
              <p className="text-sm font-bold">+600 FPS</p>
              <p className="text-xs text-muted-foreground">Boost unlocked</p>
            </div>
          </motion.div>

          <motion.div
            style={reducedMotion ? { opacity: 1, y: 0 } : { opacity: badgeOpacity, y: badgeY }}
            className="glass absolute -right-4 bottom-16 hidden items-center gap-3 rounded-2xl border border-white/10 p-3 sm:-right-20 sm:flex"
          >
            <div className="grid h-9 w-9 place-items-center rounded-full border border-cyan-accent/30 bg-cyan-accent/10">
              <span aria-hidden="true">⚡</span>
            </div>
            <div>
              <p className="text-sm font-bold">0ms Delay</p>
              <p className="text-xs text-muted-foreground">Latency tuned</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
