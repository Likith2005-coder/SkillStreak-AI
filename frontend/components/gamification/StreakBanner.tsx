"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Flame, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Streak } from "@/lib/api";

type Props = {
  streak: Streak | null;
};

export function StreakBanner({ streak }: Props) {
  const reduce = useReducedMotion();
  const days = streak?.currentStreak ?? 0;
  const longest = streak?.longestStreak ?? 0;
  const freezes = streak?.freezesAvailable ?? 0;

  // Flame scales with streak length: 1d → 1.0, 7d → 1.2, 30d+ → 1.5
  const scale = days >= 30 ? 1.5 : days >= 7 ? 1.25 : days >= 1 ? 1.1 : 1;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-5 backdrop-blur sm:flex-row sm:items-center sm:gap-5",
        days >= 1
          ? "border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent"
          : "border-border bg-card/40"
      )}
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={
            reduce || days < 1
              ? undefined
              : {
                  scale: [scale, scale * 1.06, scale],
                  rotate: [0, -3, 3, 0],
                }
          }
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            days >= 1
              ? "bg-orange-500/20 text-orange-300"
              : "bg-muted/40 text-muted-foreground"
          )}
        >
          <Flame className="h-6 w-6" />
        </motion.div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-tight tabular-nums">{days}</span>
            <span className="text-sm text-muted-foreground">day{days === 1 ? "" : "s"}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {days === 0
              ? "No streak yet — finish a topic or take a quiz today."
              : days === 1
                ? "Day 1. Keep it alive tomorrow."
                : `Longest: ${longest}d`}
          </div>
        </div>
      </div>

      <div className="ml-0 flex flex-wrap items-center gap-3 sm:ml-auto">
        {Array.from({ length: Math.max(freezes, 0) }).map((_, i) => (
          <div
            key={i}
            title="Streak freeze (auto-spent on a missed day)"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
          >
            <Snowflake className="h-3.5 w-3.5" />
          </div>
        ))}
        {freezes === 0 && (
          <span className="text-xs text-muted-foreground">No freezes — refill on Monday.</span>
        )}
      </div>
    </div>
  );
}
