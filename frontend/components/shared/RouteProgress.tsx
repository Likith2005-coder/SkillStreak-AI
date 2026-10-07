"use client";

/**
 * Top-of-page route-change progress bar.
 *
 * App-Router doesn't expose explicit "navigation start/end" events, so we
 * fake it: every `<a>` / `<Link>` click on an in-app URL primes the bar; we
 * snap it to 100% once the new pathname has rendered. Acts as the visible
 * "something is happening" cue during slow Next.js dev compile and during
 * real route hops in prod.
 */

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";

type Phase = "idle" | "loading" | "finishing";

export function RouteProgress() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const lastPathRef = useRef(pathname);

  // Click handler primes the bar — listen at document level so we catch
  // clicks on every anchor without touching each Link.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const link = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href) return;
      if (href.startsWith("http") && !href.startsWith(window.location.origin)) return;
      if (href.startsWith("#") || link.target === "_blank") return;
      if (href === window.location.pathname) return;
      setPhase("loading");
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  // When the path actually changes, snap the bar to full + fade.
  useEffect(() => {
    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname;
      setPhase("finishing");
      const t = setTimeout(() => setPhase("idle"), 350);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  if (reduce) return null;

  const target =
    phase === "loading" ? { scaleX: 0.85, opacity: 1 }
      : phase === "finishing" ? { scaleX: 1, opacity: 1 }
      : { scaleX: 0, opacity: 0 };

  return (
    <motion.div
      // Juicy progress bar: brand-green fill with a gloss strip, no glow.
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1.5 origin-left rounded-r-full bg-primary-bright"
      initial={false}
      animate={target}
      transition={{
        scaleX:
          phase === "loading"
            ? { duration: 1.6, ease: [0.16, 1, 0.3, 1] }
            : phase === "finishing"
            ? { duration: 0.18, ease: "easeOut" }
            : { duration: 0.2, ease: "easeOut" },
        opacity: { duration: 0.2 },
      }}
    >
      <span className="absolute inset-x-2 top-[2px] h-0.5 rounded-full bg-white/40" />
    </motion.div>
  );
}
