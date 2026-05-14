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
        lerp: 0.1,
        duration: 1.05,
        wheelMultiplier: 1,
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
