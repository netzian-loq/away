"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Phase = "idle" | "in" | "out";

/**
 * Longest the cover waits for the new path before lifting anyway. Generous
 * because the route is already loading from the moment of the click: a slow
 * server render should still be covered, a broken one should not trap the
 * visitor behind the cover.
 */
const STUCK_MS = 8000;

/**
 * Page-change transition: a cover wipes up over the old page, the route
 * changes underneath it, then the cover carries on up and off the new page.
 *
 * The first version only mounted a cover after the route had already changed,
 * so the mark appeared from nowhere on top of the new page. A transition has
 * to start on the page being left, which means catching the click: internal
 * links to a different path start the wipe-in and the navigation together.
 *
 * Navigation starts at the click rather than after the wipe so the wipe hides
 * the load instead of adding to it. That leaves two independent events, the
 * wipe-in finishing and the new path arriving, and the cover lifts on
 * whichever comes second: lifting before the wipe ends would cut the movement
 * in half, lifting before the path changes would show the old page again.
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
  // The two halves of the lift condition. Both reset on every new click.
  const [wiped, setWiped] = useState(false);
  const [arrived, setArrived] = useState(false);

  // The new path has arrived. Adjusted during render so, when the wipe is
  // already done, the lift starts in the same commit as the page it reveals.
  if (seen !== pathname) {
    setSeen(pathname);
    if (phase === "in") {
      if (wiped) setPhase("out");
      else setArrived(true);
    }
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
      event.preventDefault();
      // Mid wipe-in a route is already on its way: a second push would race
      // it. Only this phase blocks; once the new page is showing, clicks on it
      // must always work, even while the cover is still travelling off.
      if (phase === "in") return;
      setWiped(false);
      setArrived(false);
      setPhase("in");
      router.push(url.pathname + url.search + url.hash);
    };
    // Capture phase: this has to run before next/link's own click handler.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router, phase]);

  // A route that never arrives (an error, a redirect back to this path) must
  // not leave the site behind a cover.
  useEffect(() => {
    if (phase !== "in" || arrived) return;
    const timer = window.setTimeout(() => setPhase("out"), STUCK_MS);
    return () => window.clearTimeout(timer);
  }, [phase, arrived]);

  if (phase === "idle") return null;

  return (
    <div
      aria-hidden="true"
      className={`route-curtain route-curtain-${phase}`}
      onAnimationEnd={(event) => {
        if (event.target !== event.currentTarget) return;
        if (phase === "in") {
          if (arrived) setPhase("out");
          else setWiped(true);
        } else if (phase === "out") {
          setPhase("idle");
        }
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark-192.webp" alt="" width={96} height={96} className="h-24 w-24 rounded-3xl" />
    </div>
  );
}
