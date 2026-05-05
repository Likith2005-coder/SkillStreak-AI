"use client";

import { Suspense, lazy, useEffect, useRef, useState } from "react";
import type { Application } from "@splinetool/runtime";

// Spline ships a sizeable runtime; lazy-load it so the landing page TTFB
// isn't dragged down by code that's only used in the hero.
const Spline = lazy(() => import("@splinetool/react-spline"));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

/**
 * Hero 3D scene. Pauses its WebGL render loop when scrolled out of view —
 * Spline will otherwise keep ticking the GPU at 60fps forever, which is the
 * single biggest perf cost on the landing page.
 */
export function SplineScene({ scene, className }: SplineSceneProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e) setInView(e.isIntersecting);
      },
      { rootMargin: "100px 0px" }
    );
    obs.observe(wrapperRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const app = appRef.current;
    if (!app) return;
    if (inView) {
      app.play?.();
    } else {
      app.stop?.();
    }
  }, [inView]);

  return (
    <div ref={wrapperRef} className={className}>
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center">
            <span className="loader" />
          </div>
        }
      >
        <Spline
          scene={scene}
          className={className}
          onLoad={(app) => {
            appRef.current = app as unknown as Application;
          }}
        />
      </Suspense>
    </div>
  );
}
