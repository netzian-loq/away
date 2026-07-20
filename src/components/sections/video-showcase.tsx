"use client";

import { useEffect, useRef } from "react";
import { Reveal } from "@/components/motion/reveal";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped YouTube IFrame API, no @types/youtube in this project
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const VIDEO_ID = "YdQl1PbTqRs";
const START = 50;
const END = 75;

function useAwayOsPlayer(containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped YouTube IFrame API player instance
    let player: any = null;

    const loadApi = () =>
      new Promise<void>((resolve) => {
        if (window.YT?.Player) return resolve();
        const existing = document.querySelector<HTMLScriptElement>(
          'script[src="https://www.youtube.com/iframe_api"]',
        );
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          prev?.();
          resolve();
        };
        if (!existing) {
          const script = document.createElement("script");
          script.src = "https://www.youtube.com/iframe_api";
          script.async = true;
          document.head.appendChild(script);
        }
      });

    const init = async () => {
      await loadApi();
      if (cancelled || !containerRef.current) return;
      player = new window.YT.Player(containerRef.current, {
        videoId: VIDEO_ID,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          start: START,
          end: END,
        },
        events: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped YouTube IFrame API event
          onReady: (e: any) => {
            e.target.mute();
            e.target.seekTo(START, true);
            e.target.playVideo();
            interval = setInterval(() => {
              const t = e.target.getCurrentTime?.();
              const state = e.target.getPlayerState?.();
              if ((typeof t === "number" && t >= END - 0.15) || state === 0 || state === 5) {
                e.target.seekTo(START, true);
                e.target.playVideo();
              }
            }, 250);
          },
        },
      });
    };

    let observer: IntersectionObserver | null = null;
    const el = containerRef.current;
    if (el) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            observer?.disconnect();
            init();
          }
        },
        { rootMargin: "300px" },
      );
      observer.observe(el);
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (interval) clearInterval(interval);
      player?.destroy?.();
    };
  }, [containerRef]);
}

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

  useAwayOsPlayer(containerRef);
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
