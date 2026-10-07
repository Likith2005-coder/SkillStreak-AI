"use client";

import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
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

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-xl border-2 border-b-4 px-2.5 py-1 text-sm font-black tabular-nums",
        danger ? "border-destructive-bright/60 text-destructive-text" : "border-border text-secondary",
      )}
      aria-label={`${remaining} seconds left`}
    >
      <Timer className={cn("h-4 w-4", danger && "animate-pulse motion-reduce:animate-none")} strokeWidth={2.75} aria-hidden />
      <span className="w-7 text-right">{remaining}s</span>
      <span className="sr-only">{pct}% of the time left</span>
    </div>
  );
}
