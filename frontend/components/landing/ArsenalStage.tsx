"use client";

/**
 * The Arsenal panel's entrance: it arrives tilted slightly back in space
 * (rotateX ~9°), lower and dimmer, and rights itself as it reaches the centre
 * of the screen while its phosphor glow brightens. Scroll-linked, so it reads
 * like a camera move rather than a one-off animation. Transform/opacity only.
 * Reduced motion: upright, lit and still.
 */

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

export function ArsenalStage({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotionSafe();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.4, restDelta: 0.001 });
  const rotateX = useTransform(p, [0, 1], [9, 0]);
  const y = useTransform(p, [0, 1], [70, 0]);
  const scale = useTransform(p, [0, 1], [0.96, 1]);
  const opacity = useTransform(p, [0, 0.45], [0.35, 1]);
  const glow = useTransform(p, [0.3, 1], [0, 1]);

  return (
    <div ref={ref} className="relative [perspective:1600px]">
      {/* Phosphor glow pooled under the panel: brightens as it arrives. */}
      <motion.div
        aria-hidden
        style={reduce ? { opacity: 1 } : { opacity: glow }}
        className="pointer-events-none absolute inset-x-[6%] -bottom-10 top-[20%] rounded-[2rem] will-change-[opacity] bg-[radial-gradient(closest-side,rgb(16_185_129/0.32),transparent)] blur-2xl"
      />
      <motion.div
        style={reduce ? undefined : { rotateX, y, scale, opacity, transformOrigin: "50% 100%" }}
        // Its own layer: the panel is big and shadowed, repainting it on every
        // scroll frame would be the expensive part of this effect.
        className={reduce ? "relative" : "relative will-change-transform"}
      >
        {children}
      </motion.div>
    </div>
  );
}
