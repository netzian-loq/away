"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { ReactNode } from "react";

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  /** Total drift in px across the element's pass through the viewport. */
  speed?: number;
}

/**
 * Soft decorative parallax for background glows and textures: the wrapped
 * element drifts `speed`px slower than the page as it crosses the viewport.
 * Transform-only, so it stays compositor-friendly.
 */
export function Parallax({ children, className, speed = 40 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);

  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}
