"use client";

/**
 * The dashboard's right rail: the learner's vital signs as instrument panels.
 * Each panel owns one meaning and one colour — streak is ember, XP is gold,
 * level and league are violet — and nothing repeats a number another panel
 * already shows. The Arsenal sits at the bottom as a dark green terminal
 * "secret level" door.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "next-view-transitions";
import { ChevronRight, Crown, Flame, Snowflake, Star, Terminal } from "lucide-react";
import { fetchHeatmap, fetchLeaderboard, type LeaderboardEntry, type Streak } from "@/lib/api";
import { levelForXp } from "@/lib/level";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ── Streak panel: the flame + this week ──────────────────── */

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
  const alive = days > 0;
  const freezes = streak?.freezesAvailable ?? 0;
  const todayLit = week?.[6]?.active ?? false;

  return (
    <section className="card-chunky spotlight p-5 [--spot:var(--energy)]" aria-labelledby="streak-h">
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className={cn(
            "relative grid h-12 w-12 shrink-0 place-items-center rounded-xl ring-1",
            alive ? "bg-energy/10 text-energy ring-energy/30" : "bg-white/[0.04] text-muted-foreground ring-white/10",
          )}
        >
          {alive && (
            <span className="absolute inset-1 rounded-full bg-energy/30 blur-md" />
          )}
          <motion.span
            className="relative"
            animate={alive && !reduce ? { scale: [1, 1.1, 0.97, 1], rotate: [0, -3, 2, 0] } : undefined}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Flame
              className={cn("h-6 w-6", alive && "drop-shadow-[0_0_8px_hsl(var(--energy))]")}
              fill={alive ? "currentColor" : "none"}
              strokeWidth={1.75}
            />
          </motion.span>
        </span>
        <div className="min-w-0">
          <h2 id="streak-h" className="flex items-baseline gap-2">
            <span className={cn("font-display text-3xl tabular-nums leading-none", alive ? "text-energy" : "text-foreground")}>
              {days}
            </span>
            <span className="text-sm font-medium text-foreground">day streak</span>
          </h2>
          <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
            {days === 0 ? "Finish a topic today to light it." : todayLit ? "Today's done. See you tomorrow." : "Keep it alive: one topic today."}
          </p>
        </div>
      </div>

      <ol className="mt-5 grid grid-cols-7 gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-2 py-3" aria-label="This week">
        {(week ?? Array.from({ length: 7 }, (_, k) => ({ key: String(k), label: "·", active: false, today: k === 6 }))).map((d, k) => (
          <li key={d.key} className="flex flex-col items-center gap-2">
            <span className={cn("font-mono text-[10px] uppercase", d.today ? "text-energy" : "text-muted-foreground")}>{d.label}</span>
            <span className="relative grid h-6 w-6 place-items-center">
              {d.active ? (
                <motion.span
                  className="h-3.5 w-3.5 rounded-full bg-energy shadow-[0_0_12px_2px_hsl(var(--energy)/0.7)]"
                  initial={reduce ? false : { scale: 0.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : 0.1 + k * 0.06, ease: EASE }}
                />
              ) : d.today ? (
                <span className="h-3.5 w-3.5 rounded-full border border-dashed border-energy/70" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-white/[0.12]" />
              )}
              <span className="sr-only">{d.active ? "studied" : "not studied"}</span>
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Snowflake className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden />
        <span>
          {freezes > 0 ? (
            <>
              <span className="font-mono font-semibold text-secondary">{freezes}</span> streak freeze{freezes > 1 ? "s" : ""} ready. They cover a missed day automatically.
            </>
          ) : (
            "No freezes left. They refill on Monday."
          )}
        </span>
      </p>
    </section>
  );
}

/* ── Level panel ──────────────────────────────────────────── */

export function LevelCard({ xp }: { xp: number }) {
  const reduce = useReducedMotionSafe();
  const { level, into, span, nextAt } = levelForXp(xp);
  const pct = span > 0 ? Math.min(100, (into / span) * 100) : 0;
  return (
    <section className="card-chunky spotlight p-5 [--spot:var(--grape)]" aria-labelledby="level-h">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid h-9 w-9 place-items-center rounded-lg bg-grape/10 text-grape ring-1 ring-grape/25">
            <Star className="h-[18px] w-[18px]" fill="currentColor" strokeWidth={1.5} />
          </span>
          <h2 id="level-h" className="font-display text-xl text-foreground">
            Level <span className="tabular-nums">{level}</span>
          </h2>
        </div>
        <span className="label-mono text-grape">Next · L{level + 1}</span>
      </div>
      <div
        className="mt-4 h-2 rounded-full bg-white/[0.06]"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${xp} of ${nextAt} XP to level ${level + 1}`}
      >
        <motion.div
          className="h-full origin-left rounded-full bg-grape shadow-[0_0_12px_hsl(var(--grape)/0.7)]"
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: Math.max(pct, 2) / 100 }}
          transition={{ duration: reduce ? 0 : 0.9, ease: EASE }}
        />
      </div>
      <p className="mt-2.5 flex items-center justify-between font-mono text-xs text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">{into.toLocaleString()}</span> / {span.toLocaleString()} XP
        </span>
        <span>{Math.max(0, span - into).toLocaleString()} to go</span>
      </p>
    </section>
  );
}

/* ── League panel ─────────────────────────────────────────── */

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
  const medal = ["text-xp", "text-foreground/70", "text-energy"];
  return (
    <section className="card-chunky spotlight p-5 [--spot:var(--grape)]" aria-labelledby="league-h">
      <div className="flex items-center justify-between">
        <h2 id="league-h" className="font-display text-lg text-foreground">
          This week&apos;s league
        </h2>
        <Link
          href="/leaderboard"
          className="focus-ring -mr-1 inline-flex min-h-[44px] items-center gap-0.5 rounded-lg px-1 text-sm font-medium text-secondary hover:underline"
        >
          View <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <ol className="mt-2 divide-y divide-white/[0.06]">
        {rows === null &&
          [0, 1, 2].map((i) => <li key={i} className="my-1.5 h-9 animate-pulse rounded-lg bg-white/[0.04] motion-reduce:animate-none" />)}
        {rows?.length === 0 && (
          <li className="py-2 text-sm text-muted-foreground">No one has scored yet this week. Be first!</li>
        )}
        {rows?.map((r, i) => (
          <li
            key={r.userId}
            className={cn(
              "flex items-center gap-3 px-1 py-2.5",
              r.userId === me?.id && "-mx-1 rounded-lg border-transparent bg-secondary/10 px-2 ring-1 ring-secondary/25",
            )}
          >
            <span className="flex w-5 shrink-0 justify-center">
              {i === 0 ? (
                <Crown className={cn("h-4 w-4 drop-shadow-[0_0_6px_hsl(var(--xp)/0.8)]", medal[i])} fill="currentColor" aria-hidden />
              ) : (
                <span className={cn("font-mono text-xs font-semibold", medal[i])}>{i + 1}</span>
              )}
            </span>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-grape/10 text-sm font-semibold text-grape ring-1 ring-grape/25">
              {r.name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{r.name}</span>
            <span className="font-mono text-xs font-semibold tabular-nums text-xp">{r.xpThisWeek} XP</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ── The Arsenal: a dark green terminal "secret level" door ─ */

export function ArsenalCard() {
  return (
    <Link
      href="/toolkit"
      className="focus-ring group relative block overflow-hidden rounded-[1.1rem] border border-emerald-500/25 bg-[#030806] p-5 font-mono text-emerald-100 shadow-[inset_0_1px_0_rgb(52_211_153/0.08),0_12px_32px_-16px_rgb(0_0_0/0.8)] transition-[border-color,box-shadow] duration-300 hover:border-emerald-400/50 hover:shadow-[inset_0_1px_0_rgb(52_211_153/0.12),0_0_36px_-8px_rgb(16_185_129/0.45)]"
    >
      {/* phosphor grid + glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(52_211_153/0.06)_1px,transparent_1px),linear-gradient(90deg,rgb(52_211_153/0.06)_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:radial-gradient(ellipse_at_top_right,#000_20%,transparent_75%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/15 blur-2xl"
      />
      <span className="relative flex items-center justify-between">
        <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-emerald-400">
          <Terminal className="h-3.5 w-3.5" aria-hidden /> Secret level
        </span>
        <ChevronRight className="h-4 w-4 text-emerald-400 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
      <span className="relative mt-3 block font-sans text-lg font-semibold text-emerald-50 [text-shadow:0_0_18px_rgb(52_211_153/0.35)]">
        Ethical Hacking Arsenal
      </span>
      <span className="relative mt-1.5 block text-xs text-emerald-200/80">
        <span className="text-emerald-400">$</span> 37 real tools · 5 attack phases
        <span className="ml-1 inline-block h-3 w-1.5 translate-y-0.5 animate-pulse bg-emerald-400 motion-reduce:animate-none" />
      </span>
    </Link>
  );
}
