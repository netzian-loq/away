"use client";

import { useRef } from "react";
import { Reveal } from "@/components/motion/reveal";
import { MaskReveal } from "@/components/motion/mask-reveal";
import { ScrollScale } from "@/components/motion/scroll-scale";
import { VideoFacade } from "@/components/motion/video-facade";
import { useCoarsePointer } from "@/lib/use-coarse-pointer";
import { useYouTubeLoopPlayer } from "@/lib/use-youtube-loop-player";

const VIDEO_ID = "YdQl1PbTqRs";
const START = 50;
const END = 75;

export function VideoShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const coarse = useCoarsePointer();

  // The silent autoplay loop is a desktop flourish. On touch it would cost a
  // couple of megabytes and constant video decode for something nobody asked
  // to watch, so phones get a tappable poster instead.
  useYouTubeLoopPlayer(containerRef, {
    videoId: VIDEO_ID,
    start: START,
    end: END,
    enabled: coarse === false,
  });

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-electric/30 bg-electric/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-electric">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-electric" />
            AwayOS Preview
          </div>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
            <MaskReveal as="span">
              See <span className="text-gradient">AwayOS</span> in action
            </MaskReveal>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            A 25-second look at the custom gaming OS — stripped, tuned, and built for frames.
          </p>
        </Reveal>

        <ScrollScale className="relative overflow-hidden rounded-2xl">
          <div className="relative overflow-hidden rounded-2xl border border-electric/20 bg-black shadow-2xl">
            <div className="relative aspect-video w-full">
              {coarse ? (
                <VideoFacade videoId={VIDEO_ID} title="AwayOS in action" start={START} />
              ) : (
                <>
                  <div
                    ref={containerRef}
                    className="pointer-events-none absolute inset-0 h-full w-full"
                  />
                  <div className="absolute inset-0 z-10 cursor-default" aria-hidden="true" />
                </>
              )}
            </div>
          </div>
        </ScrollScale>
      </div>
    </section>
  );
}
