"use client";

import { useState } from "react";
import { Play } from "lucide-react";

/**
 * Click-to-play YouTube poster.
 *
 * An embedded YouTube iframe pulls roughly 2MB of player script before anyone
 * has asked to watch anything — measured on this site's home page. That's the
 * single biggest cost on a phone. This renders YouTube's own poster image
 * (~15KB) and only mounts the real iframe once the viewer taps play.
 *
 * The poster is a plain <img> rather than next/image on purpose: it's a
 * third-party host, so routing it through the optimizer would mean whitelisting
 * i.ytimg.com in next.config for no gain — it's already a compressed JPEG.
 */
interface VideoFacadeProps {
  videoId: string;
  title: string;
  /** Seconds to start at when played. */
  start?: number;
  className?: string;
}

export function VideoFacade({ videoId, title, start, className }: VideoFacadeProps) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    const params = new URLSearchParams({
      autoplay: "1",
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
      ...(start ? { start: String(start) } : {}),
    });
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?${params}`}
        title={title}
        className={className ?? "absolute inset-0 h-full w-full"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
      className="group absolute inset-0 h-full w-full cursor-pointer overflow-hidden bg-black"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- third-party host;
          routing it through next/image would mean whitelisting i.ytimg.com for
          no gain, since YouTube already serves a compressed ~15KB JPEG. */}
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        width={480}
        height={360}
        className="h-full w-full scale-[1.35] object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-95"
      />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid h-16 w-16 place-items-center rounded-full border border-white/20 bg-black/55 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
          <Play className="ml-0.5 h-6 w-6 fill-white text-white" aria-hidden="true" />
        </span>
      </span>
    </button>
  );
}
