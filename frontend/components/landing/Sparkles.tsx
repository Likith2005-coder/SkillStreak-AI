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

// Deterministic per-index PRNG (mulberry32). The server-rendered HTML and the
// client hydration pass must produce identical positions — Math.random here
// caused a React prop-mismatch warning on every landing load.
function seeded(i: number): () => number {
  let a = (i + 1) * 0x9e3779b9;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Sparkles({ count = 18, className }: SparklesProps) {
  const reduce = useReducedMotion();

  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const rand = seeded(i);
        return {
          // Stable id derived from index — survives renders, never collides.
          id: `sp-${i}`,
          left: rand() * 100,
          delay: rand() * 6,
          duration: 6 + rand() * 6,
          size: 1.5 + rand() * 2.5,
          opacity: 0.4 + rand() * 0.5,
        };
      }),
    [count]
  );

  if (reduce) return null;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
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
