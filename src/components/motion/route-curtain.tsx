"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "in" | "out";

/** Longest the cover waits for the next page before lifting anyway. */
const STUCK_MS = 4000;

/**
 * Page-change transition: a cover wipes up over the old page, the route
 * changes underneath it, then the cover carries on up and off the new page.
 *
 * The first version only mounted a cover after the route had already changed,
 * so the mark appeared from nowhere on top of the new page. A transition has
 * to start on the page being left, which means catching the click: internal
 * links to a different path are held for the length of the wipe-in, and only
 * then handed to the router.
 *
 * Everything else is left alone and navigates normally: new-tab and modified
 * clicks, external links, downloads, in-page anchors, and links that only
 * change the query string (the path stays the same, so there would be no
 * route change to lift the cover on).
 */
export function RouteCurtain() {
  const pathname = usePathname();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [seen, setSeen] = useState(pathname);
  const target = useRef<string | null>(null);

  // The new page has arrived: lift. Adjusted during render so the lift starts
  // in the same commit as the page it reveals.
  if (seen !== pathname) {
    setSeen(pathname);
    if (phase === "in") setPhase("out");
  }

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      if (target.current) {
        // Already wiping in: swallow the second click rather than racing it.
        event.preventDefault();
        return;
      }
      event.preventDefault();
      target.current = url.pathname + url.search + url.hash;
      router.prefetch(target.current);
      setPhase("in");
    };
    // Capture phase: this has to run before next/link's own click handler.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  // A route that never arrives (an error, a redirect back to this path) must
  // not leave the site behind a cover.
  useEffect(() => {
    if (phase !== "in") return;
    const timer = window.setTimeout(() => setPhase("out"), STUCK_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === "idle") return null;

  return (
    <div
      aria-hidden="true"
      className={`route-curtain route-curtain-${phase}`}
      onAnimationEnd={(event) => {
        if (event.target !== event.currentTarget) return;
        if (phase === "in" && target.current) {
          router.push(target.current);
        } else if (phase === "out") {
          target.current = null;
          setPhase("idle");
        }
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.png" alt="" width={96} height={96} className="h-24 w-24 rounded-3xl" />
    </div>
  );
}
