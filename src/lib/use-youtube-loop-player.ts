"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped YouTube IFrame API, no @types/youtube in this project
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubeLoopOptions {
  videoId: string;
  start: number;
  end: number;
  /**
   * Whether the embed starts muted. Defaults to true, since most browsers
   * block autoplay-with-sound outright — an unmuted player will still try
   * to autoplay, but on browsers that block it, the viewer sees a paused
   * frame and has to press play themselves (standard, unavoidable browser
   * behavior, not a bug in this hook).
   */
  muted?: boolean;
}

/**
 * Lazy-loads the YouTube IFrame API once a container scrolls near the
 * viewport, then autoplays/loops the given [start, end) range — shared by
 * every section that embeds a looping product-demo clip.
 */
export function useYouTubeLoopPlayer(
  containerRef: React.RefObject<HTMLDivElement | null>,
  { videoId, start, end, muted = true }: YouTubeLoopOptions,
) {
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
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 1,
          mute: muted ? 1 : 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          start,
          end,
        },
        events: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped YouTube IFrame API event
          onReady: (e: any) => {
            if (muted) {
              e.target.mute();
            } else {
              e.target.unMute();
            }
            e.target.seekTo(start, true);
            e.target.playVideo();
            interval = setInterval(() => {
              const t = e.target.getCurrentTime?.();
              const state = e.target.getPlayerState?.();
              if ((typeof t === "number" && t >= end - 0.15) || state === 0 || state === 5) {
                e.target.seekTo(start, true);
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
  }, [containerRef, videoId, start, end, muted]);
}
