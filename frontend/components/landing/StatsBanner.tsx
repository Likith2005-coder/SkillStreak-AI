"use client";

/**
 * Stats banner — four big numbers that count up when they enter view.
 * Sits between the domain marquee and the BurstSection to give the page
 * a moment of "here's the scope of what's here."
 */

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { BookOpen, Layers, ListChecks, Trophy } from "lucide-react";

type Stat = {
  icon: React.ReactNode;
  value: number;
  suffix?: string;
  label: string;
  hint: string;
  accent: string;
};

const STATS: Stat[] = [
  {
    icon: <BookOpen className="h-5 w-5" />,
    value: 9,
    label: "Tech domains",
    hint: "Cybersecurity to Cloud",
    accent: "text-rose-300",
  },
  {
    icon: <Layers className="h-5 w-5" />,
    value: 90,
    suffix: "+",
    label: "Curated topics",
    hint: "Across 5 deep roadmaps",
    accent: "text-violet-300",
  },
  {
    icon: <ListChecks className="h-5 w-5" />,
    value: 5,
    label: "AI MCQs / topic",
    hint: "Validated by a 2nd-pass LLM",
    accent: "text-emerald-300",
  },
  {
    icon: <Trophy className="h-5 w-5" />,
    value: 8,
    label: "Unlockable badges",
    hint: "Streaks, perfect quizzes, more",
    accent: "text-amber-300",
  },
];

export function StatsBanner() {
  return (
    <section className="relative px-4 py-16 lg:px-12 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">
            By the numbers
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Built end-to-end. <span className="gradient-text">Live today.</span>
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <StatCard key={s.label} stat={s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ stat, index }: { stat: Stat; index: number }) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(cardRef, { once: true, amount: 0.5 });
  const display = useCountUp(stat.value, inView, 1100);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card/50 p-6 backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
    >
      <div className={`flex items-center gap-2 ${stat.accent}`}>
        {stat.icon}
        <span className="text-[11px] uppercase tracking-[0.18em]">
          {stat.label}
        </span>
      </div>
      <div className="mt-4 text-5xl font-bold tabular-nums tracking-tight text-foreground">
        {display}
        {stat.suffix && (
          <span className="text-3xl text-muted-foreground">{stat.suffix}</span>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{stat.hint}</p>
    </motion.div>
  );
}

// rAF count-up triggered when `start` flips true. Honors reduced-motion.
function useCountUp(target: number, start: boolean, durationMs: number): number {
  const reduce = useReducedMotion();
  const [v, setV] = useState(0);

  useEffect(() => {
    if (!start) return;
    if (reduce) {
      setV(target);
      return;
    }
    const startTime = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, durationMs, reduce]);

  return v;
}
