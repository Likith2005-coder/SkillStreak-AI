"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Trophy } from "lucide-react";

type Props = {
  level: number;
  xp: number;
};

// Mirror of backend levelForXp.
function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * level * Math.log2(level + 1));
}
function levelForXp(xp: number) {
  let level = 1;
  while (xpRequiredForLevel(level + 1) <= xp) level++;
  const base = xpRequiredForLevel(level);
  const next = xpRequiredForLevel(level + 1);
  return { level, into: xp - base, span: next - base };
}

export function XpBar({ level, xp }: Props) {
  const reduce = useReducedMotion();
  const { into, span } = levelForXp(xp);
  const pct = span > 0 ? Math.min(100, Math.round((into / span) * 100)) : 0;

  // Animate XP number on change.
  const [displayXp, setDisplayXp] = useState(xp);
  useEffect(() => {
    if (reduce) {
      setDisplayXp(xp);
      return;
    }
    const start = displayXp;
    const delta = xp - start;
    if (delta === 0) return;
    const duration = Math.min(1200, 400 + Math.abs(delta) * 5);
    const startTime = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - startTime) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayXp(Math.round(start + delta * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xp]);

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 backdrop-blur">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
        <span className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          Level {level}
        </span>
        <span className="tabular-nums text-foreground">{displayXp} XP</span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/40">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: reduce ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{into} / {span} to level {level + 1}</span>
        <span>{pct}%</span>
      </div>
    </div>
  );
}
