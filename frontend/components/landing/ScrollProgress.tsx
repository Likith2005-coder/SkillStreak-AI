"use client";

/**
 * Thin gradient bar that fills as the user scrolls the landing page.
 * Driven by framer-motion's useScroll + useSpring so the fill trails
 * the scroll with a gentle spring rather than a 1:1 jitter.
 *
 * Sits at the very top of the page (top-0, z-60). Pointer-events:none
 * so it never interferes with clicks.
 */

import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";

export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.001,
  });

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden
      style={{ scaleX, transformOrigin: "0% 50%" }}
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2.5px] bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-400 shadow-[0_0_12px_rgba(217,70,239,0.55)]"
    />
  );
}
