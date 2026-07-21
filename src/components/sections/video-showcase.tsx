"use client";

import { useEffect, useRef } from "react";
import { Reveal } from "@/components/motion/reveal";
import { useYouTubeLoopPlayer } from "@/lib/use-youtube-loop-player";

const VIDEO_ID = "YdQl1PbTqRs";
const START = 50;
const END = 75;

function useVideoPinReveal(wrapRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.documentElement.classList.contains("perf-lite")) return;

    let cancelled = false;
    let cleanup = () => {};

    import("gsap").then(async ({ gsap }) => {
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      // A single scrub tween — deliberately not the old site's multi-stage
      // pinned timeline, which was the main source of scroll jank.
      const tween = gsap.fromTo(
        wrap,
        { scale: 0.85, opacity: 0.4 },
        {
          scale: 1,
          opacity: 1,
          ease: "none",
          scrollTrigger: { trigger: wrap, start: "top 85%", end: "top 35%", scrub: 0.5 },
        },
      );
      cleanup = () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [wrapRef]);
}

export function VideoShowcase() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useYouTubeLoopPlayer(containerRef, { videoId: VIDEO_ID, start: START, end: END });
  useVideoPinReveal(wrapRef);

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-electric/30 bg-electric/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-electric">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-electric" />
            AwayOS Preview
          </div>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
            See <span className="text-gradient">AwayOS</span> in action
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            A 25-second look at the custom gaming OS — stripped, tuned, and built for frames.
          </p>
        </Reveal>

        <div ref={wrapRef} className="relative">
          <div className="relative overflow-hidden rounded-2xl border border-electric/20 bg-black shadow-2xl">
            <div className="relative aspect-video w-full">
              <div ref={containerRef} className="pointer-events-none absolute inset-0 h-full w-full" />
              <div className="absolute inset-0 z-10 cursor-default" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
