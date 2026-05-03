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
            onExpire();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [paused, onExpire, resetKey]);

  const pct = Math.max(0, Math.min(100, (remaining / seconds) * 100));
  const danger = remaining <= 10;

  return (
    <div className="flex items-center gap-2">
      <Timer className={cn("h-3.5 w-3.5", danger ? "text-rose-400" : "text-muted-foreground")} />
      <div className="relative h-1 w-32 overflow-hidden rounded-full bg-card">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-1000 ease-linear",
            danger ? "bg-rose-500" : "bg-gradient-to-r from-indigo-500 to-violet-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn("w-10 text-right text-xs tabular-nums", danger && "text-rose-400")}>
        {remaining}s
      </span>
    </div>
  );
}
