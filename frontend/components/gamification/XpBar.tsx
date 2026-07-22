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
    <div className="relative overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-card/40 to-card/40 p-6 backdrop-blur">
      {/* violet bloom behind the level numeral */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-violet-500/20 blur-3xl"
      />

      <div className="relative flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Trophy className="h-4 w-4 text-amber-300 [filter:drop-shadow(0_0_8px_rgba(251,191,36,0.5))]" />
            Level
          </div>
          <div
            className="mt-1 text-5xl font-bold tabular-nums tracking-tight text-violet-300"
            style={{ textShadow: "0 0 36px rgba(167,139,250,0.5)" }}
          >
            {level}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold tabular-nums text-foreground">
            {displayXp}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Total XP
          </div>
        </div>
      </div>

      {/* power meter — thicker bar, glowing head, shimmer along the fill */}
      <div className="relative mt-4 h-3 overflow-hidden rounded-full bg-muted/40">
        <motion.div
          className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
          style={{ boxShadow: "0 0 16px rgba(167,139,250,0.55)" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: reduce ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* slow shimmer sweep across the filled portion */}
          {!reduce && pct > 0 && (
            <motion.span
              aria-hidden
              className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ["-4rem", "110%"] }}
              transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
            />
          )}
        </motion.div>
      </div>

      <div className="relative mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {into} / {span} to level {level + 1}
        </span>
        <span className="tabular-nums">{pct}%</span>
      </div>
    </div>
  );
}
