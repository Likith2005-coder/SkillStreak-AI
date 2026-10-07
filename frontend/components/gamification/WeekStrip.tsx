"use client";

/**
 * This week, as a rhythm. Seven days, studied days lit in streak-energy lime,
 * today ringed. A streak count is a number; this shows the habit itself —
 * and on load the lit days ignite in order, so it reads like a signal
 * travelling through the week.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { fetchHeatmap } from "@/lib/api";
import { cn } from "@/lib/utils";

type Day = { key: string; label: string; active: boolean; today: boolean };

function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function WeekStrip({ className }: { className?: string }) {
  const reduce = useReducedMotionSafe();
  const [days, setDays] = useState<Day[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHeatmap()
      .then((h) => {
        if (cancelled) return;
        const counts = new Map(h.days.map((d) => [d.date.slice(0, 10), d.count]));
        const out: Day[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = isoDay(d);
          out.push({
            key,
            label: d.toLocaleDateString(undefined, { weekday: "narrow" }),
            active: (counts.get(key) ?? 0) > 0,
            today: i === 0,
          });
        }
        setDays(out);
      })
      .catch(() => !cancelled && setDays([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const studied = days?.filter((d) => d.active).length ?? 0;

  return (
    <div className={cn("rounded-2xl border border-border/70 bg-background/60 p-5", className)}>
      <div className="flex items-baseline justify-between gap-6">
        <h2 className="text-sm font-medium text-foreground">This week</h2>
        <p className="font-mono text-xs text-muted-foreground">
          <span className={studied ? "text-energy" : undefined}>{studied}</span>/7 days
        </p>
      </div>

      <ol className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2.5" aria-label={`Studied ${studied} of the last 7 days`}>
        {(days ?? Array.from({ length: 7 }, (_, i) => ({ key: String(i), label: "·", active: false, today: i === 6 }))).map(
          (d, i) => (
            <li key={d.key} className="flex min-w-0 flex-col items-center gap-2">
              <span className="relative flex aspect-square w-full max-w-[2.25rem] items-center justify-center">
                {/* base socket */}
                <span
                  className={cn(
                    "absolute inset-0 rounded-full border",
                    d.today ? "border-primary/70" : "border-border",
                  )}
                />
                {/* the lit core */}
                {d.active && (
                  <motion.span
                    className="absolute inset-[5px] rounded-full bg-energy shadow-[0_0_14px_hsl(var(--energy)/0.65)]"
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: reduce ? 0 : 0.45, delay: reduce ? 0 : 0.15 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
                <span className="sr-only">{d.active ? "studied" : "not studied"}</span>
              </span>
              <span className={cn("font-mono text-[11px]", d.today ? "text-primary" : "text-muted-foreground")}>
                {d.label}
              </span>
            </li>
          ),
        )}
      </ol>

      <p className="mt-4 text-xs text-muted-foreground">
        {studied === 0
          ? "Finish one topic or quiz today to light the first day."
          : studied === 7
            ? "A perfect week. Keep the chain going."
            : days?.[6]?.active
              ? "Today's lit. Come back tomorrow to keep it going."
              : "Today isn't lit yet — one topic does it."}
      </p>
    </div>
  );
}
