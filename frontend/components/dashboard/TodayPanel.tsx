"use client";

/**
 * "Today": the learner's daily vital signs in one panel, split by hairlines.
 *   1. the daily-goal ring and what it takes to close it
 *   2. this week's XP as bars against the goal line
 *   3. the streak: flame, day count, the last seven days as dots, freezes
 * The ring draws in, the bars grow, the streak dots pop in with a stagger;
 * under reduced motion everything is simply there.
 */

import { useEffect, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { Flame, Snowflake, Target } from "lucide-react";
import { fetchHeatmap, type Streak, type TodayProgress } from "@/lib/api";
import { GoalRing, WeekBars, goalMessage } from "@/components/playground/DailyGoal";
import { useCountUp } from "@/hooks/useCountUp";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { Flare, GoalComet } from "@/components/dashboard/cinema";
import { cn } from "@/lib/utils";

type Day = { key: string; label: string; active: boolean; today: boolean };

function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The last seven local days, lit where the learner did anything. */
function useStreakWeek() {
  const [week, setWeek] = useState<Day[] | null>(null);
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
            return {
              key,
              label: d.toLocaleDateString(undefined, { weekday: "narrow" }),
              active: (counts.get(key) ?? 0) > 0,
              today: k === 6,
            };
          }),
        );
      })
      .catch(() => !cancelled && setWeek([]));
    return () => {
      cancelled = true;
    };
  }, []);
  return week;
}

export function TodayPanel({
  today,
  streak,
  className,
  style,
}: {
  today: TodayProgress | null;
  streak: Streak | null;
  /** Lets the dashboard's opening shot time this panel's entrance. */
  className?: string;
  style?: CSSProperties;
}) {
  const met = !!today && today.goalXp > 0 && today.xpToday >= today.goalXp;
  return (
    <section
      aria-labelledby="today-h"
      className={cn(
        "card-chunky spotlight flex h-full flex-col p-5 [--spot:var(--primary)] sm:p-6",
        met && "glow-primary",
        className,
      )}
      style={style}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="today-h" className="label-mono flex items-center gap-1.5 text-primary">
          <Target className="h-3.5 w-3.5" aria-hidden /> Today
        </h2>
        {today && (
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            Goal <span className="font-semibold text-foreground">{today.goalXp} XP</span>
          </span>
        )}
      </div>

      <GoalBlock today={today} />
      <div aria-hidden className="my-5 h-px bg-white/[0.06]" />
      {today ? (
        <WeekBars week={today.week} goal={today.goalXp} />
      ) : (
        <div aria-hidden className="h-[104px] animate-pulse rounded-lg bg-white/[0.03] motion-reduce:animate-none" />
      )}
      {/* Absorbs spare height when the hero beside it is taller. */}
      <div aria-hidden className="min-h-0 flex-1" />
      <div aria-hidden className="my-5 h-px bg-white/[0.06]" />
      <StreakBlock streak={streak} />
    </section>
  );
}

function GoalBlock({ today }: { today: TodayProgress | null }) {
  if (!today) {
    return (
      <div aria-hidden className="mt-4 flex items-center gap-4">
        <div className="h-[104px] w-[104px] shrink-0 animate-pulse rounded-full bg-white/[0.04] motion-reduce:animate-none" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-4/5 animate-pulse rounded bg-white/[0.05] motion-reduce:animate-none" />
          <div className="h-3.5 w-3/5 animate-pulse rounded bg-white/[0.04] motion-reduce:animate-none" />
        </div>
      </div>
    );
  }
  const did = [
    today.topicsToday > 0 && `${today.topicsToday} topic${today.topicsToday === 1 ? "" : "s"}`,
    today.quizzesToday > 0 && `${today.quizzesToday} quiz${today.quizzesToday === 1 ? "" : "zes"}`,
  ].filter(Boolean);
  return (
    <div className="mt-4 flex items-center gap-5">
      {/* overflow-visible: the ring's glow was being clipped square at the SVG box. */}
      <div className="relative shrink-0 [&_svg]:overflow-visible">
        <GoalRing xp={today.xpToday} goal={today.goalXp} size={104} />
        <GoalComet pct={today.goalXp > 0 ? Math.min(1, today.xpToday / today.goalXp) : 0} size={104} />
      </div>
      <div className="min-w-0">
        <p className="font-display text-xl leading-tight text-foreground [text-wrap:balance]">
          <span className="sr-only">
            {today.xpToday} of {today.goalXp} XP today.{" "}
          </span>
          {goalMessage(today.xpToday, today.goalXp)}
        </p>
        <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">
          {did.length > 0 ? `Today: ${did.join(" · ")}` : "Nothing logged yet today."}
        </p>
      </div>
    </div>
  );
}

function StreakBlock({ streak }: { streak: Streak | null }) {
  const reduce = useReducedMotionSafe();
  const week = useStreakWeek();
  const days = streak?.currentStreak ?? 0;
  const shown = useCountUp(days, 800);
  const alive = days > 0;
  const freezes = streak?.freezesAvailable ?? 0;
  const todayLit = week?.[6]?.active ?? false;
  const slots: Day[] =
    week && week.length === 7
      ? week
      : Array.from({ length: 7 }, (_, k) => ({ key: String(k), label: "·", active: false, today: k === 6 }));

  return (
    <div>
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className={cn(
            "relative grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1",
            alive ? "bg-energy/10 text-energy ring-energy/30" : "bg-white/[0.04] text-muted-foreground ring-white/10",
          )}
        >
          {alive && <span className="absolute inset-1 rounded-full bg-energy/30 blur-md" />}
          <span className={cn("relative", alive && "anim-flame")}>
            <Flame
              className={cn("h-[22px] w-[22px]", alive && "drop-shadow-[0_0_8px_hsl(var(--energy))]")}
              fill={alive ? "currentColor" : "none"}
              strokeWidth={1.75}
            />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-2">
            <span className={cn("font-display text-[1.75rem] tabular-nums leading-none", alive ? "text-energy" : "text-foreground")}>
              <Flare shown={shown} target={days} color="var(--energy)">
                {shown}
              </Flare>
            </span>
            <span className="text-sm font-medium text-foreground">day streak</span>
          </p>
          <p className="mt-1 truncate text-[13px] leading-snug text-muted-foreground">
            {days === 0 ? "Finish a topic today to light it." : todayLit ? "Today's done. See you tomorrow." : "Keep it alive: one topic today."}
          </p>
        </div>
      </div>

      <ol className="mt-4 grid grid-cols-7 gap-1.5" aria-label="Last 7 days">
        {slots.map((d, k) => (
          <li key={d.key} className="flex flex-col items-center gap-1.5">
            <span className="relative grid h-6 w-6 place-items-center">
              {d.active ? (
                <motion.span
                  className="h-3.5 w-3.5 rounded-full bg-energy shadow-[0_0_12px_2px_hsl(var(--energy)/0.6)]"
                  initial={reduce ? false : { scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={
                    reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 18, delay: 0.25 + k * 0.05 }
                  }
                />
              ) : d.today ? (
                <span className="h-3.5 w-3.5 rounded-full border border-dashed border-energy/70" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-white/[0.12]" />
              )}
              <span className="sr-only">{d.active ? "studied" : "not studied"}</span>
            </span>
            <span aria-hidden className={cn("font-mono text-[10px] uppercase", d.today ? "text-energy" : "text-muted-foreground")}>
              {d.label}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Snowflake className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden />
        <span>
          {freezes > 0 ? (
            <>
              <span className="font-mono font-semibold text-secondary">{freezes}</span> streak freeze
              {freezes > 1 ? "s" : ""} ready. They cover a missed day.
            </>
          ) : (
            "No freezes left. They refill on Monday."
          )}
        </span>
      </p>
    </div>
  );
}
