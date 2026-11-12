"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

/**
 * Replays the opening curtain on every page change.
 *
 * The first-load curtain is plain server-rendered CSS in the root layout and
 * plays once. This is its client-side twin: when the path changes, the new
 * page is already in place, so a fresh curtain is mounted covering it and the
 * same CSS animation lifts it away. A new `key` per navigation is what
 * restarts the animation. Nothing is rendered until the first navigation, so
 * the two curtains never overlap.
 */
export function RouteCurtain() {
  const pathname = usePathname();
  const [seen, setSeen] = useState(pathname);
  const [count, setCount] = useState(0);

  // Adjusting state during render, not in an effect: the curtain has to be in
  // the same commit as the new page or one frame of it shows uncovered.
  if (seen !== pathname) {
    setSeen(pathname);
    setCount(count + 1);
  }

  if (count === 0) return null;

  return (
    <div key={count} aria-hidden="true" className="curtain curtain-route">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.png" alt="" width={96} height={96} className="h-24 w-24 rounded-3xl" />
    </div>
  );
}
