"use client";

import { motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";

/**
 * Scroll-reveal wrapper — content eases up + fades in as it enters the
 * viewport, once. The staggered, spring-timed entrance is what separates a
 * "premium, hand-directed" feel from a flat AI-generated page.
 */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
