"use client";

/**
 * The dashboard's right rail: the learner's vital signs, game-style.
 * Each card owns one meaning and one colour — streak is orange fire, XP is
 * gold, level and league are grape — and nothing repeats a number another
 * card already shows.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "next-view-transitions";
import { ChevronRight, Crown, Flame, Gem, Snowflake, Star, Terminal } from "lucide-react";
import { fetchHeatmap, fetchLeaderboard, type LeaderboardEntry, type Streak } from "@/lib/api";
import { levelForXp } from "@/lib/level";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ── Streak card: the flame + this week ───────────────────── */

function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function StreakCard({ streak }: { streak: Streak | null }) {
  const reduce = useReducedMotionSafe();
  const [week, setWeek] = useState<{ key: string; label: string; active: boolean; today: boolean }[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchHeatmap()
      .then((h) => {
        if (cancelled) return;
        const counts = new Map(h.days.map((d) => [d.date.slice(0, 10), d.count]));
        setWeek(
          Array.from({ length: 7 }, (_, k) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - k));
            const key = isoDay(d);
            return { key, label: d.toLocaleDateString(undefined, { weekday: "narrow" }), active: (counts.get(key) ?? 0) > 0, today: k === 6 };
          }),
        );
      })
      .catch(() => !cancelled && setWeek([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const days = streak?.currentStreak ?? 0;
  const freezes = streak?.freezesAvailable ?? 0;
  const todayLit = week?.[6]?.active ?? false;

  return (
    <section className="card-chunky p-5" aria-labelledby="streak-h">
      <div className="flex items-center gap-3">
        <motion.span
          aria-hidden
          animate={days > 0 && !reduce ? { scale: [1, 1.12, 1], rotate: [0, -4, 0] } : undefined}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", days > 0 ? "bg-energy-bright/15" : "bg-muted")}
        >
          <Flame className={cn("h-7 w-7", days > 0 ? "text-energy-bright" : "text-muted-foreground")} fill="currentColor" />
        </motion.span>
        <div>
          <h2 id="streak-h" className="text-xl font-black text-foreground">
            {days} day streak
          </h2>
          <p className="text-sm font-semibold text-muted-foreground">
            {days === 0 ? "Finish a topic today to light it." : todayLit ? "Today's done. See you tomorrow!" : "Keep it alive — one topic today."}
          </p>
        </div>
      </div>

      <ol className="mt-4 grid grid-cols-7 gap-1.5" aria-label="This week">
        {(week ?? Array.from({ length: 7 }, (_, k) => ({ key: String(k), label: "·", active: false, today: k === 6 }))).map((d, k) => (
          <li key={d.key} className="flex flex-col items-center gap-1.5">
            <span className={cn("text-xs font-extrabold", d.today ? "text-energy" : "text-muted-foreground")}>{d.label}</span>
            <span
              className={cn(
                "relative flex aspect-square w-full max-w-[2.25rem] items-center justify-center rounded-full border-2",
                d.active ? "border-transparent" : d.today ? "border-energy-bright" : "border-border bg-muted",
              )}
            >
              {d.active && (
                <motion.span
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-energy-bright"
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : 0.1 + k * 0.06, ease: EASE }}
                >
                  <Flame className="h-4 w-4 text-white" fill="currentColor" aria-hidden />
                </motion.span>
              )}
              <span className="sr-only">{d.active ? "studied" : "not studied"}</span>
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-4 flex items-center gap-1.5 text-xs font-bold text-secondary">
        <Snowflake className="h-4 w-4" aria-hidden />
        {freezes > 0 ? `${freezes} streak freeze${freezes > 1 ? "s" : ""} ready — they cover a missed day automatically.` : "No freezes left — they refill on Monday."}
      </p>
    </section>
  );
}

/* ── Level card ───────────────────────────────────────────── */

export function LevelCard({ xp }: { xp: number }) {
  const reduce = useReducedMotionSafe();
  const { level, into, span, nextAt } = levelForXp(xp);
  const pct = span > 0 ? Math.min(100, (into / span) * 100) : 0;
  return (
    <section className="card-chunky p-5" aria-labelledby="level-h">
      <div className="flex items-center justify-between">
        <h2 id="level-h" className="text-lg font-black text-foreground">
          Level {level}
        </h2>
        <span className="text-sm font-extrabold text-grape">→ Level {level + 1}</span>
      </div>
      <div className="mt-3 h-5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${xp} of ${nextAt} XP to level ${level + 1}`}>
        <motion.div
          className="relative h-full w-full origin-left rounded-full bg-grape-bright"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: Math.max(pct, 3) / 100 }}
          transition={{ duration: reduce ? 0 : 0.9, ease: EASE }}
        >
          {/* glossy highlight — the juicy-bar detail */}
          <span className="absolute inset-x-2 top-1 h-1.5 rounded-full bg-white/35" />
        </motion.div>
      </div>
      <p className="mt-2 text-sm font-bold text-muted-foreground">
        <span className="text-foreground">{into.toLocaleString()}</span> / {span.toLocaleString()} XP
      </p>
    </section>
  );
}

/* ── League card ──────────────────────────────────────────── */

export function LeagueCard() {
  const me = useUserStore((s) => s.user);
  const [rows, setRows] = useState<LeaderboardEntry[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchLeaderboard()
      .then((r) => !cancelled && setRows(r.slice(0, 3)))
      .catch(() => !cancelled && setRows([]));
    return () => {
      cancelled = true;
    };
  }, []);
  const medal = ["text-xp-bright", "text-muted-foreground", "text-energy-bright"];
  return (
    <section className="card-chunky p-5" aria-labelledby="league-h">
      <div className="flex items-center justify-between">
        <h2 id="league-h" className="text-lg font-black text-foreground">
          This week&apos;s league
        </h2>
        <Link href="/leaderboard" className="focus-ring rounded-lg text-sm font-extrabold uppercase tracking-wide text-secondary hover:underline">
          View
        </Link>
      </div>
      <ol className="mt-3 space-y-2">
        {rows === null &&
          [0, 1, 2].map((i) => <li key={i} className="h-10 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />)}
        {rows?.length === 0 && <li className="text-sm font-semibold text-muted-foreground">No one has scored yet this week. Be first!</li>}
        {rows?.map((r, i) => (
          <li
            key={r.userId}
            className={cn("flex items-center gap-3 rounded-xl px-2 py-1.5", r.userId === me?.id && "bg-secondary/10")}
          >
            <Crown className={cn("h-5 w-5 shrink-0", medal[i])} fill="currentColor" aria-hidden />
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-grape/15 text-sm font-black text-grape">
              {r.name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{r.name}</span>
            <span className="text-sm font-black tabular-nums text-xp">{r.xpThisWeek} XP</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ── The Arsenal: a dark "secret level" door ──────────────── */

export function ArsenalCard() {
  return (
    <Link
      href="/toolkit"
      className="dark focus-ring group block overflow-hidden rounded-[1.25rem] border-2 border-b-[5px] border-emerald-500/40 bg-[#04070a] p-5 font-mono text-emerald-100 transition-transform duration-100 active:translate-y-[3px]"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-400">
          <Terminal className="h-4 w-4" aria-hidden /> Secret level
        </span>
        <ChevronRight className="h-4 w-4 text-emerald-400 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </div>
      <p className="mt-3 font-sans text-lg font-black text-white">Ethical Hacking Arsenal</p>
      <p className="mt-1 text-xs text-emerald-200/80">
        <span className="text-emerald-400">$</span> 37 real tools · 5 attack phases
        <span className="ml-1 inline-block h-3 w-1.5 translate-y-0.5 animate-pulse bg-emerald-400 motion-reduce:animate-none" />
      </p>
    </Link>
  );
}
