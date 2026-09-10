"use client";

/**
 * Lenis smooth-scroll wrapper. Mounts a single Lenis instance for the
 * lifetime of the page it lives on. Honors prefers-reduced-motion (Lenis
 * effectively becomes a no-op).
 *
 * Drop it inside the landing layout — NOT the dashboard. Dashboard pages
 * have their own scroll containers and won't benefit, and we don't want
 * Lenis hijacking quick keyboard navigation in the chat sidebar.
 */

import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let raf: number | null = null;
    let lenis: { raf(time: number): void; destroy(): void } | null = null;

    let cancelled = false;
    (async () => {
      const { default: Lenis } = await import("lenis");
      if (cancelled) return;
      lenis = new Lenis({
        // Smooth wheel + touchpad; touch left native so mobile feels normal.
        smoothWheel: true,
        // lerp is the fraction of the REMAINING distance covered per frame.
        // At 0.1 it takes ~22 frames (~370ms) to reach 90% of the target,
        // which is long enough to read as input lag rather than smoothness —
        // and every one of those frames fires a scroll event that framer's
        // useScroll trackers answer with layout reads. 0.18 settles in ~11
        // frames (~180ms): still smooth, no longer mushy, half the events.
        // ONE model only. Lenis checks `duration && easing` before `lerp`
        // (lenis.mjs Animate.advance), so passing both silently disables lerp
        // and every wheel notch restarts a fixed-length eased animation that
        // always runs to completion — emitting a scroll event every frame of
        // it. With lerp alone the tail is proportional and actually finishes
        // early: ~0.5s instead of a hard 1.05s, ~40% fewer scroll events.
        lerp: 0.14,
        wheelMultiplier: 1,
        syncTouch: false,
      });
      const tick = (time: number) => {
        lenis?.raf(time);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    })();

    return () => {
      cancelled = true;
      if (raf !== null) cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, []);

  return null;
}
