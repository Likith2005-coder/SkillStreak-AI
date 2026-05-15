"use client";

/**
 * Ambient floating sparkles. Random small dots drift upward and fade.
 * GPU-cheap: pure transform + opacity, capped at N=18 for the whole hero.
 *
 * Hidden under prefers-reduced-motion.
 */

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface SparklesProps {
  count?: number;
  className?: string;
}

export function Sparkles({ count = 18, className }: SparklesProps) {
  const reduce = useReducedMotion();

  const particles = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 6,
        duration: 6 + Math.random() * 6,
        size: 1.5 + Math.random() * 2.5,
        opacity: 0.4 + Math.random() * 0.5,
      })),
    [count]
  );

  if (reduce) return null;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
    >
      {particles.map((p, idx) => (
        <motion.span
          key={idx}
          className="absolute bottom-0 rounded-full bg-white"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 4}px hsl(290 75% 70%)`,
          }}
          initial={{ y: 20 }}
          animate={{ y: "-110vh" }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
