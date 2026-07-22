"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Flame, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Streak } from "@/lib/api";

type Props = {
  streak: Streak | null;
};

/**
 * Streak — the ember card. An active streak burns: big glowing numeral,
 * flickering flame, warm bloom. Even at 0 days it smoulders faintly and
 * invites you to light it, instead of sitting there dead grey.
 * All glow is static CSS (blurred blobs on their own layer) — no per-frame
 * cost; only the small flame icon animates, and it respects reduced motion.
 */
export function StreakBanner({ streak }: Props) {
  const reduce = useReducedMotion();
  const days = streak?.currentStreak ?? 0;
  const longest = streak?.longestStreak ?? 0;
  const freezes = streak?.freezesAvailable ?? 0;
  const lit = days >= 1;

  // Flame grows with streak length.
  const scale = days >= 30 ? 1.4 : days >= 7 ? 1.2 : days >= 1 ? 1.05 : 1;

  return (
    <div
      className={cn(
        "relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-6 backdrop-blur sm:flex-row sm:items-center sm:gap-6",
        lit
          ? "border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent"
          : "border-border bg-gradient-to-br from-orange-500/[0.06] via-card/40 to-card/40"
      )}
    >
      {/* ember bloom behind the flame */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -left-12 -top-12 h-52 w-52 rounded-full blur-3xl",
          lit ? "bg-orange-500/25 animate-cta-breathe" : "bg-orange-500/10"
        )}
      />

      <div className="relative flex items-center gap-4">
        <motion.div
          animate={
            reduce || !lit
              ? undefined
              : {
                  scale: [scale, scale * 1.07, scale],
                  rotate: [0, -3, 3, 0],
                }
          }
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1",
            lit
              ? "bg-orange-500/20 text-orange-300 ring-orange-400/30 [filter:drop-shadow(0_0_14px_rgba(251,146,60,0.5))]"
              : "bg-muted/30 text-orange-300/40 ring-border/60"
          )}
        >
          <Flame className="h-7 w-7" />
        </motion.div>
        <div>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "text-5xl font-bold tracking-tight tabular-nums",
                lit ? "text-orange-300" : "text-foreground/80"
              )}
              style={
                lit
                  ? { textShadow: "0 0 36px rgba(251,146,60,0.5)" }
                  : undefined
              }
            >
              {days}
            </span>
            <span className="text-sm text-muted-foreground">
              day{days === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {days === 0
              ? "No streak yet — light the flame: finish a topic or quiz today."
              : days === 1
                ? "Day 1. Keep it alive tomorrow."
                : `Longest: ${longest}d — keep it burning.`}
          </div>
        </div>
      </div>

      <div className="relative ml-0 flex flex-wrap items-center gap-2.5 sm:ml-auto">
        {Array.from({ length: Math.max(freezes, 0) }).map((_, i) => (
          <div
            key={i}
            title="Streak freeze (auto-spent on a missed day)"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 [filter:drop-shadow(0_0_8px_rgba(34,211,238,0.35))]"
          >
            <Snowflake className="h-4 w-4" />
          </div>
        ))}
        {freezes === 0 && (
          <span className="text-xs text-muted-foreground">
            No freezes — refill on Monday.
          </span>
        )}
      </div>
    </div>
  );
}
