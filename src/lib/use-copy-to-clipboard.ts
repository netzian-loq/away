"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** How long a "Copied!" confirmation stays up. */
export const COPIED_RESET_MS = 2000;

/**
 * Copy-to-clipboard with a self-clearing confirmation, shared by the partner
 * discount block and the bank transfer panel.
 *
 * Tracks *which* field was copied by key, so one hook instance can drive
 * several copy buttons (IBAN, amount, reference) without them all lighting up
 * together.
 */
export function useCopyToClipboard(resetMs = COPIED_RESET_MS) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = useCallback(
    async (value: string, key: string = value) => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
        } else {
          // Fallback for non-secure contexts, where the async API is missing.
          const field = document.createElement("textarea");
          field.value = value;
          field.setAttribute("readonly", "");
          field.style.position = "fixed";
          field.style.opacity = "0";
          document.body.appendChild(field);
          field.select();
          document.execCommand("copy");
          document.body.removeChild(field);
        }
      } catch {
        // Clipboard blocked by the browser — the value is still on screen to
        // read, so confirm anyway rather than failing loudly.
      }

      setCopiedKey(key);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopiedKey(null), resetMs);
    },
    [resetMs],
  );

  return { copiedKey, copy, isCopied: (key: string) => copiedKey === key };
}
