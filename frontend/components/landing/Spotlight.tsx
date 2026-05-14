"use client";

/**
 * Cursor-following spotlight. Wraps a grid of cards in a container that
 * tracks the mouse position via CSS custom properties (`--mx`, `--my`) —
 * any child can pick those up with a radial-gradient overlay to get a
 * "lit by the cursor" effect. Pure CSS rendering, single JS listener,
 * no React state, no per-frame re-renders.
 *
 * Used by the landing-page bento grid.
 */

import { useEffect, useRef } from "react";

interface SpotlightProps {
  children: React.ReactNode;
  className?: string;
}

export function Spotlight({ children, className }: SpotlightProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function onMove(e: PointerEvent) {
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    }
    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
