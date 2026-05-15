"use client";

/**
 * Cursor-following spotlight. Wraps a grid of cards in a container that
 * tracks the mouse position via CSS custom properties (`--mx`, `--my`) —
 * any child can pick those up with a radial-gradient overlay to get a
 * "lit by the cursor" effect.
 *
 * Perf: pointermove fires at every device polling rate (often 240Hz+).
 * We rAF-throttle so only one bounding-rect read + style write happens
 * per frame. Single passive listener, no React state, no re-renders.
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
    let raf = 0;
    let pendingX = 0;
    let pendingY = 0;

    function onMove(e: PointerEvent) {
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${pendingX - r.left}px`);
        el.style.setProperty("--my", `${pendingY - r.top}px`);
      });
    }

    el.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      el.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
