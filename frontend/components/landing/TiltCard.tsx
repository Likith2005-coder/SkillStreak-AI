"use client";

/**
 * 3D tilt-on-mouse-move wrapper. Listens to pointer position relative to
 * the card and tilts it (rotateX/Y) so the card feels physical.
 *
 * Uses framer-motion's `useMotionValue` so the tilt is driven on the GPU
 * compositor — no React re-renders per pointer frame.
 *
 * Disabled when reduced-motion is requested.
 */

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  /** Max degrees of tilt on either axis. Default 5° — subtle, not gimmicky. */
  intensity?: number;
}

export function TiltCard({ children, className, intensity = 5 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();

  const x = useMotionValue(0); // -0.5 → 0.5
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 200, damping: 25 });
  const springY = useSpring(y, { stiffness: 200, damping: 25 });

  const rotateY = useTransform(springX, [-0.5, 0.5], [-intensity, intensity]);
  const rotateX = useTransform(springY, [-0.5, 0.5], [intensity, -intensity]);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        transformPerspective: 800,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
