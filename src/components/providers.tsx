"use client";

import type { ReactNode } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";

export function MotionProviders({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig
        reducedMotion="user"
        transition={{
          duration: 0.2,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
