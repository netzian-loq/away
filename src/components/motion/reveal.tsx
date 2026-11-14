"use client";

import { domAnimation, LazyMotion, m } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}

// `m` + LazyMotion with the DOM animation feature set instead of `motion`:
// `motion.*` bundles every feature (drag, layout animation and the rest) into
// the client JS of each page, and these reveals only use in-view animation.
export function Reveal({ children, delay = 0, className, y = 16 }: RevealProps) {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className={className}
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2, margin: "-40px" }}
        transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
