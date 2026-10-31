"use client";

/**
 * Daily-goal parts: a glowing volt ring that fills toward the daily XP goal,
 * and a seven-bar strip of the week's XP. The ring draws in on mount; under
 * reduced motion it is simply drawn. The dashboard's Today panel composes
 * them; celebration (confetti) is owned by the page so it fires once.
 */

import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import type { TodayProgress } from "@/lib/api";
import { useCountUp } from "@/hooks/useCountUp";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

// XP a topic pays: 10 for the topic, +10 first-of-day, +5 streak day on the
// first action of the day (see backend gamification.service XP_AMOUNTS).
const FIRST_TOPIC_XP = 25;
const NEXT_TOPIC_XP = 10;
const QUIZ_PASS_XP = 15;

export function goalMessage(xp: number, goal: number): string {
  if (xp >= goal * 2) return "Double goal. Unreal.";
  if (xp >= goal) return "Goal smashed!";
  const left = goal - xp;
  const topicXp = xp === 0 ? FIRST_TOPIC_XP : NEXT_TOPIC_XP;
  if (left <= topicXp) return xp === 0 ? "One topic gets you there." : `${left} XP to go. One topic gets you there.`;
  if (left <= topicXp + QUIZ_PASS_XP) return `${left} XP to go. A topic and a quiz will do it.`;
  return `${left} XP to go. Keep stacking.`;
}

/** Aurora-coloured burst; respects reduced motion inside canvas-confetti. */
export function fireGoalConfetti() {
  const colors = ["#b6ff3b", "#7c5cff", "#4f7dff", "#22d3ee"];
  const shot = (ratio: number, opts: confetti.Options) =>
    confetti({
      origin: { y: 0.35, x: 0.75 },
      particleCount: Math.floor(120 * ratio),
      spread: 70,
      startVelocity: 35,
      colors,
      disableForReducedMotion: true,
      ...opts,
    });
  shot(0.35, { spread: 30, startVelocity: 50 });
  shot(0.3, { spread: 70 });
  shot(0.35, { spread: 110, decay: 0.92, scalar: 0.85 });
}

export function GoalRing({ xp, goal, size }: { xp: number; goal: number; size: number }) {
  const reduce = useReducedMotionSafe();
  const shown = useCountUp(xp, 1000);
  const stroke = size >= 110 ? 10 : 8;
  const r = (size - stroke) / 2 - 4; // 4px room for the glow
  const c = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(1, xp / goal) : 0;
  const met = xp >= goal && goal > 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {met && (
        <span
          aria-hidden
          className="anim-halo absolute inset-2 rounded-full bg-primary/25 blur-md"
        />
      )}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="relative -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.07)" strokeWidth={stroke} />
        {pct > 0 && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={reduce ? false : { strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - pct) }}
            transition={{ duration: reduce ? 0 : 1.1, ease: EASE, delay: reduce ? 0 : 0.15 }}
            style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.75))" }}
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          {met ? (
            <Trophy className="mx-auto mb-0.5 h-4 w-4 text-primary drop-shadow-[0_0_6px_hsl(var(--primary))]" aria-hidden />
          ) : null}
          <div
            className={cn(
              "font-display tabular-nums leading-none",
              size >= 110 ? "text-[1.9rem]" : "text-2xl",
              met ? "text-primary text-glow" : "text-foreground",
            )}
          >
            {shown}
          </div>
          <div className="label-mono mt-1 text-[10px] text-muted-foreground">/ {goal} XP</div>
        </div>
      </div>
    </div>
  );
}

function utcLabel(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "narrow", timeZone: "UTC" });
}
function utcLong(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "long", timeZone: "UTC" });
}

export function WeekBars({ week, goal }: { week: TodayProgress["week"]; goal: number }) {
  const reduce = useReducedMotionSafe();
  const max = Math.max(goal, ...week.map((d) => d.xp), 1);
  const goalPct = (goal / max) * 100;
  const total = week.reduce((s, d) => s + d.xp, 0);
  const daysMet = week.filter((d) => d.xp >= goal).length;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="label-mono text-muted-foreground">This week</span>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          <span className="font-semibold text-xp">{total.toLocaleString()} XP</span>
          {daysMet > 0 && <> · {daysMet}/7 goals</>}
        </span>
      </div>
      <div className="relative mt-3 h-16">
        {/* goal line */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-primary/30"
          style={{ bottom: `${goalPct}%` }}
        />
        <ol className="relative grid h-full grid-cols-7 items-end gap-1.5" aria-label="XP per day, last 7 days">
          {week.map((d, i) => {
            const isToday = i === week.length - 1;
            const h = d.xp > 0 ? Math.max(8, (d.xp / max) * 100) : 4;
            const met = d.xp >= goal;
            return (
              <li key={d.date} className="flex h-full items-end justify-center" title={`${utcLong(d.date)}: ${d.xp} XP`}>
                <motion.span
                  className={cn(
                    "block w-full max-w-[22px] origin-bottom rounded-t-[5px] rounded-b-[2px]",
                    isToday
                      ? "bg-primary shadow-[0_0_14px_hsl(var(--primary)/0.75)]"
                      : met
                        ? "bg-primary/55"
                        : d.xp > 0
                          ? "bg-white/25"
                          : "bg-white/[0.08]",
                  )}
                  style={{ height: `${h}%` }}
                  initial={reduce ? false : { scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.2 + i * 0.05, ease: EASE }}
                />
                <span className="sr-only">
                  {utcLong(d.date)}: {d.xp} XP{isToday ? " (today)" : ""}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <div aria-hidden className="mt-1.5 grid grid-cols-7 gap-1.5">
        {week.map((d, i) => (
          <span
            key={d.date}
            className={cn(
              "text-center font-mono text-[10px] uppercase",
              i === week.length - 1 ? "font-semibold text-primary" : "text-muted-foreground",
            )}
          >
            {utcLabel(d.date)}
          </span>
        ))}
      </div>
    </div>
  );
}
