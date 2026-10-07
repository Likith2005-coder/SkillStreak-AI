"use client";

/**
 * Hydration-safe prefers-reduced-motion.
 *
 * framer-motion's useReducedMotion returns the real preference on the very
 * first client render, but the server can't know it. Any component that
 * renders differently for reduced motion (`if (reduce) return <Static/>`)
 * therefore produced different HTML on server and client, which broke
 * hydration and made React discard the server markup for the whole page.
 *
 * useSyncExternalStore with a server snapshot fixes that by construction:
 * during hydration React uses `getServerSnapshot` (false, matching the server),
 * then immediately re-renders with the real value. Reduced-motion users get
 * their still version one frame later, and nobody gets a hydration error.
 */

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function useReducedMotionSafe(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
