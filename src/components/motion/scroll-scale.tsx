"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { ReactNode } from "react";

interface ScrollScaleProps {
  children: ReactNode;
  className?: string;
  /** Starting scale as the element enters; settles to 1 mid-viewport. */
  from?: number;
}

/**
 * Scroll-linked media scale, mirroring the `data-img-scale` treatment on
 * eszterbial.com: the card starts slightly oversized and eases down to its
 * true size as it rises through the viewport, so imagery feels like it
 * settles into place rather than popping in.
 *
 * `overflow-hidden` on the wrapper keeps the oversized frame from bleeding
 * past its own corners.
 */
export function ScrollScale({ children, className, from = 1.12 }: ScrollScaleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [from, 1]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ scale, willChange: "transform" }}>{children}</motion.div>
    </div>
  );
}
