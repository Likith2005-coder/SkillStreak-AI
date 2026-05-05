"use client";

/**
 * Thin gradient bar at the very top of the landing page that fills based
 * on scroll position. Uses framer-motion's `useScroll` + `useSpring` so the
 * bar trails the scroll with a gentle spring, not a jittery 1:1 follow.
 */

import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX, transformOrigin: "0% 50%" }}
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-400 shadow-[0_0_12px_rgba(217,70,239,0.55)]"
    />
  );
}
