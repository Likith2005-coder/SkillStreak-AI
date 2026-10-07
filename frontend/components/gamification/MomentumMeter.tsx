"use client";

/**
 * Momentum meter — the streak and level, live, on every screen.
 *
 * Momentum is the product's emotional core, but outside the dashboard it was
 * a muted "Level 1 · 0 XP" pill with no streak and no sense of progress. This
 * makes it an instrument: the flame is lit in streak-energy lime while the
 * streak is alive, a thin lime bar fills toward the next level, XP ticks up
 * when it's earned, and a level-up fires a single pulse.
 */

import { useEffect, useRef, useState } from "react";
import { animate, motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { fetchStreak, type Streak } from "@/lib/api";
import { levelForXp } from "@/lib/level";
import { cn } from "@/lib/utils";

export function MomentumMeter({ xp, className }: { xp: number; className?: string }) {
  const reduce = useReducedMotionSafe();
  const { level, into, span, nextAt } = levelForXp(xp);
  const pct = span > 0 ? Math.min(100, (into / span) * 100) : 0;

  // Streak refreshes whenever XP moves — earning XP is what extends it.
  const [streak, setStreak] = useState<Streak | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchStreak()
      .then((s) => !cancelled && setStreak(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [xp]);
  const days = streak?.currentStreak ?? 0;
  const alive = days > 0;

  // XP ticks from its previous value instead of jumping.
  const [shownXp, setShownXp] = useState(xp);
  const prevXp = useRef(xp);
  useEffect(() => {
    const from = prevXp.current;
    prevXp.current = xp;
    if (reduce || from === xp) {
      setShownXp(xp);
      return;
    }
    const c = animate(from, xp, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShownXp(Math.round(v)),
    });
    return () => c.stop();
  }, [xp, reduce]);

  // One pulse per level-up.
  const prevLevel = useRef(level);
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (level > prevLevel.current && !reduce) setPulse((n) => n + 1);
    prevLevel.current = level;
  }, [level, reduce]);

  return (
    <div
      role="status"
      aria-label={`${days}-day streak. Level ${level}, ${xp} of ${nextAt} XP to level ${level + 1}.`}
      className={cn(
        "relative flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full border border-border/70 bg-card/80 py-1 pl-2.5 pr-3 text-xs",
        className,
      )}
    >
      <span className={cn("flex items-center gap-1 font-mono", alive ? "text-energy" : "text-muted-foreground")}>
        <Flame
          className={cn("h-3.5 w-3.5", alive && "drop-shadow-[0_0_6px_hsl(var(--energy)/0.7)]")}
          fill={alive ? "currentColor" : "none"}
          aria-hidden
        />
        {days}d
      </span>

      <span className="h-3.5 w-px bg-border" aria-hidden />

      <span className="flex flex-col gap-1">
        <span className="flex items-baseline gap-1.5 leading-none">
          <span className="font-semibold text-foreground">Lv {level}</span>
          <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">{shownXp.toLocaleString()} XP</span>
        </span>
        <span className="relative h-[3px] w-16 overflow-hidden rounded-full bg-muted" aria-hidden>
          <motion.span
            className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-energy shadow-[0_0_8px_hsl(var(--energy)/0.6)]"
            initial={false}
            animate={{ scaleX: pct / 100 }}
            transition={{ duration: reduce ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </span>
      </span>

      <AnimatePresence>
        {pulse > 0 && (
          <motion.span
            key={pulse}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-energy"
            initial={{ opacity: 0.9, scale: 1 }}
            animate={{ opacity: 0, scale: 1.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
