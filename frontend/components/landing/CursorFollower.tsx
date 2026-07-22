"use client";

/**
 * Soft glowing orb that trails the cursor on the landing page. Uses
 * framer-motion's motion values + spring so movement is smooth and runs
 * entirely on the compositor — no React state per pointermove frame.
 *
 * Pointer-events:none — never blocks clicks. Disabled under
 * prefers-reduced-motion.
 */

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

const SIZE = 320;

export function CursorFollower() {
  const reduce = useReducedMotion();
  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);
  const sx = useSpring(x, { stiffness: 90, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 90, damping: 18, mass: 0.6 });

  useEffect(() => {
    if (reduce) return;
    function onMove(e: PointerEvent) {
      x.set(e.clientX - SIZE / 2);
      y.set(e.clientY - SIZE / 2);
    }
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, x, y]);

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[5] hidden rounded-full md:block"
      style={{
        x: sx,
        y: sy,
        width: SIZE,
        height: SIZE,
        // The radial gradient is already soft (transparent falloff at 70%),
        // so no CSS blur filter is needed. A `filter: blur()` on a fixed,
        // continuously-moving 320px layer forces a per-frame repaint that
        // competes with scroll — dropping it keeps the same soft look for free.
        willChange: "transform",
        background:
          "radial-gradient(closest-side, hsl(290 75% 60% / 0.22), hsl(243 75% 59% / 0.11) 40%, transparent 70%)",
      }}
    />
  );
}
