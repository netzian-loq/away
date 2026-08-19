"use client";

import { useEffect } from "react";

/**
 * Fires one visit ping per browser session for a partner page. Renders nothing.
 *
 * Deduped through sessionStorage rather than counting every mount: React
 * strict mode mounts effects twice in development, and a reader who navigates
 * away and back would otherwise register as two people. Per-session is the
 * honest unit for "someone opened the page" without storing an identifier.
 *
 * Failures are swallowed. This is a counter — it must never surface an error
 * to a visitor or block anything the page is doing.
 */
export function VisitBeacon({ partner }: { partner: string }) {
  useEffect(() => {
    const key = `av:${partner}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Private mode or storage disabled: still count the visit rather than
      // silently under-reporting, and accept the possible duplicate.
    }

    const body = JSON.stringify({ partner });

    // sendBeacon survives the page being closed straight after load, which is
    // exactly the visit most likely to be lost by a normal fetch.
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/partner-visit", new Blob([body], { type: "application/json" }));
        return;
      }
    } catch {
      // fall through to fetch
    }

    fetch("/api/partner-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }, [partner]);

  return null;
}
