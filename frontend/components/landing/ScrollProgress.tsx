"use client";

/**
 * A thin glowing volt line that fills as the user scrolls the landing page.
 * Driven by framer-motion's useScroll + useSpring so the fill trails
 * the scroll with a gentle spring rather than a 1:1 jitter.
 *
 * Sits at the very top of the page (top-0, z-60). Pointer-events:none
 * so it never interferes with clicks.
 */

import { motion, useScroll, useSpring } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";

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
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] bg-[linear-gradient(90deg,hsl(var(--aurora-3)),hsl(var(--primary)))] shadow-[0_0_10px_hsl(var(--primary)/0.8),0_0_2px_hsl(var(--primary))]"
    />
  );
}
