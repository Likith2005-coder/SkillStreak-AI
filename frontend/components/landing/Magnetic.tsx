"use client";

/**
 * Magnetic interaction — a child element gently translates toward the
 * cursor while the cursor is inside the wrapper's bounding box. Releases
 * back to origin with a spring on leave.
 *
 * Used on the primary CTA. Disabled under prefers-reduced-motion.
 */

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

interface MagneticProps {
  children: React.ReactNode;
  /** Max pixels the element will drift from origin. Default 14. */
  strength?: number;
  className?: string;
}

export function Magnetic({ children, strength = 14, className }: MagneticProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 18, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 250, damping: 18, mass: 0.5 });

  // rAF-throttle pointer moves: one bounding-rect read + motion update per
  // frame, no matter the device polling rate.
  const rafRef = useRef(0);
  const pendingRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce || !ref.current) return;
    pendingRef.current = { x: e.clientX, y: e.clientY };
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const pos = pendingRef.current;
      if (!pos || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (pos.x - cx) / (r.width / 2);
      const dy = (pos.y - cy) / (r.height / 2);
      x.set(dx * strength);
      y.set(dy * strength);
    });
  }

  function onLeave() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    x.set(0);
    y.set(0);
  }

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ x: sx, y: sy }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
