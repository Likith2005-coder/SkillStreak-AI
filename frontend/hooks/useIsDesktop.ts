"use client";

/**
 * True only on viewports that can actually benefit from the heavy WebGL
 * surfaces: wide enough to see them, with a fine pointer to drive them.
 *
 * Both the SignalBot (three.js, ~667 kB raw) and the MeshText wordmark exist
 * for cursor interaction. On a phone they cost seconds of main-thread time to
 * deliver an effect the input device cannot trigger, so we don't load them at
 * all — this hook is the gate.
 *
 * Starts `false` so the server render and the first client paint agree
 * (no hydration mismatch) and mobile never even begins the download.
 */

import { useEffect, useState } from "react";

const QUERY = "(min-width: 1024px) and (pointer: fine)";

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isDesktop;
}
