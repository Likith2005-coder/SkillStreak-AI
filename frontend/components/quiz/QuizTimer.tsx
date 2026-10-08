"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Reset key — when it changes, the timer restarts */
  resetKey: string | number;
  /** Seconds. */
  seconds: number;
  /** Fires once when the timer reaches zero. */
  onExpire: () => void;
  /** Pauses the timer (e.g. after the question is revealed). */
  paused?: boolean;
};

export function QuizTimer({ resetKey, seconds, onExpire, paused = false }: Props) {
  const [remaining, setRemaining] = useState(seconds);
  const expiredRef = useRef(false);
  // Hold onExpire in a ref so the tick effect doesn't recreate the interval
  // when the parent re-renders with a new closure for the callback.
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    setRemaining(seconds);
    expiredRef.current = false;
  }, [resetKey, seconds]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpireRef.current();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [paused, resetKey]);

  const pct = Math.max(0, Math.min(100, (remaining / seconds) * 100));
  const danger = remaining <= 10;

  // A sleek pill with a ring that drains as time runs out; red under 10s.
  const R = 7;
  const C = 2 * Math.PI * R;
  return (
    <div
      className={cn(
        "flex h-9 items-center gap-2 rounded-full border px-3 font-mono text-xs font-medium tabular-nums transition-colors duration-300",
        danger
          ? "border-destructive/40 bg-destructive/10 text-destructive-text shadow-[0_0_20px_-6px_hsl(var(--destructive)/0.7)]"
          : "border-white/10 bg-white/[0.04] text-foreground",
      )}
      aria-label={`${remaining} seconds left`}
    >
      <svg viewBox="0 0 18 18" className={cn("h-[18px] w-[18px] -rotate-90", danger && "animate-pulse motion-reduce:animate-none")} aria-hidden>
        <circle cx="9" cy="9" r={R} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" />
        <circle
          cx="9"
          cy="9"
          r={R}
          fill="none"
          stroke={danger ? "hsl(var(--destructive))" : "hsl(var(--secondary))"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct / 100)}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none"
        />
      </svg>
      <span className="w-7 text-right">{remaining}s</span>
      <span className="sr-only">{pct}% of the time left</span>
    </div>
  );
}
