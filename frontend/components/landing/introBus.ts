"use client";

/**
 * Tiny shared signal for the landing boot intro.
 *
 * The intro overlay calls `introBus.finish()` the moment its curtain starts
 * lifting; the hero + nav subscribe via `useIntroDone()` and hold their
 * entrance choreography until then, so the page "powers on" in one continuous
 * move instead of animating unseen behind the overlay.
 *
 * Module-level state is intentional: it persists across SPA navigations, so
 * returning to the landing page mid-session shows everything instantly.
 */

import { useSyncExternalStore } from "react";

let done = false;
const subscribers = new Set<() => void>();

export const introBus = {
  isDone: () => done,
  finish() {
    if (done) return;
    done = true;
    subscribers.forEach((fn) => fn());
  },
  subscribe(fn: () => void) {
    subscribers.add(fn);
    return () => {
      subscribers.delete(fn);
    };
  },
};

/** True once the intro has started revealing the page (or was skipped). */
export function useIntroDone(): boolean {
  return useSyncExternalStore(introBus.subscribe, introBus.isDone, () => false);
}
