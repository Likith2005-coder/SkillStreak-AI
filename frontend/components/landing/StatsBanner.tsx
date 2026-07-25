"use client";

/**
 * Stats banner — a cinematic "counter wall" between the domain marquee and
 * the BurstSection. Four huge accent-glow numerals on an open strip (no
 * boxed cards — the bento below already owns that shape), separated by
 * hairline dividers, sitting on a faint light-seam. Numbers count up on
 * entry and give a small scale "pop" when they land.
 *
 * Perf notes: every background layer here is static CSS (no blend modes,
 * no filters, no per-frame work) — the count-up rAF runs once per card and
 * stops. Honors prefers-reduced-motion throughout.
 */

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Layers, ListChecks, Trophy } from "lucide-react";

type Stat = {
  icon: React.ReactNode;
  value: number;
  suffix?: string;
  label: string;
  hint: string;
  accent: string; // text color class for numeral + label
  glow: string; // text-shadow behind the numeral
};

const STATS: Stat[] = [
  {
    icon: <BookOpen className="h-4 w-4" />,
    value: 9,
    label: "Tech domains",
    hint: "Cybersecurity to Cloud",
    accent: "text-cyan-300",
    glow: "0 0 48px rgba(34,211,238,0.45)",
  },
  {
    icon: <Layers className="h-4 w-4" />,
    value: 90,
    suffix: "+",
    label: "Curated topics",
    hint: "Across 5 deep roadmaps",
    accent: "text-violet-300",
    glow: "0 0 48px rgba(167,139,250,0.45)",
  },
  {
    icon: <ListChecks className="h-4 w-4" />,
    value: 5,
    label: "AI MCQs / topic",
    hint: "Validated by a 2nd-pass LLM",
    accent: "text-emerald-300",
    glow: "0 0 48px rgba(52,211,153,0.45)",
  },
  {
    icon: <Trophy className="h-4 w-4" />,
    value: 8,
    label: "Unlockable badges",
    hint: "Streaks, perfect quizzes, more",
    accent: "text-lime-300",
    glow: "0 0 48px rgba(163,230,53,0.45)",
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function StatsBanner() {
  return (
    <section className="relative overflow-hidden px-4 py-20 lg:px-12 lg:py-28">
      {/* ── Static backdrop: soft center bloom + horizontal light seam ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[90%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,hsl(187_92%_52%/0.07),transparent_65%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[8%] top-1/2 h-px bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent"
      />
      {/* faint dotted grid, masked to the middle so edges stay clean */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.5) 1px, transparent 0)",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(ellipse 55% 55% at 50% 50%, black 30%, transparent 78%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">
            By the numbers
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-5xl">
            Built end-to-end.{" "}
            <span className="inline-flex items-baseline gap-3 whitespace-nowrap">
              <span className="text-cyan-300 [text-shadow:0_0_28px_hsl(187_92%_52%/0.45)]">
                Live today
              </span>
              {/* live pulse dot — makes "Live" literal */}
              <span className="relative inline-flex h-2.5 w-2.5 self-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
            </span>
          </h2>
        </div>

        {/* Open stat strip — hairline dividers, no boxes */}
        <div className="grid grid-cols-2 gap-y-12 lg:grid-cols-4 lg:gap-y-0">
          {STATS.map((s, i) => (
            <StatColumn key={s.label} stat={s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatColumn({ stat, index }: { stat: Stat; index: number }) {
  const reduce = useReducedMotion();
  const [counting, setCounting] = useState(false);
  const display = useCountUp(stat.value, counting, 1100);
  const landed = counting && display === stat.value;

  return (
    <motion.div
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      onViewportEnter={() => setCounting(true)}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: EASE }}
      className={`relative flex flex-col items-center px-4 text-center ${
        index > 0 ? "lg:border-l lg:border-border/40" : ""
      }`}
    >
      {/* label above — small mono-feel eyebrow with icon */}
      <div className={`flex items-center gap-2 ${stat.accent}`}>
        {stat.icon}
        <span className="text-[11px] font-medium uppercase tracking-[0.2em]">
          {stat.label}
        </span>
      </div>

      {/* the numeral — huge, accent-lit, pops when the count lands */}
      <motion.div
        animate={
          reduce
            ? undefined
            : landed
              ? { scale: [1, 1.07, 1] }
              : { scale: 1 }
        }
        transition={{ duration: 0.4, ease: EASE }}
        className={`mt-4 text-7xl font-bold tabular-nums tracking-tight sm:text-8xl ${stat.accent}`}
        style={{ textShadow: stat.glow }}
      >
        {display}
        {stat.suffix && (
          <span className="align-top text-4xl opacity-70 sm:text-5xl">
            {stat.suffix}
          </span>
        )}
      </motion.div>

      {/* accent tick that draws in once the number has landed */}
      <motion.span
        aria-hidden
        initial={{ scaleX: 0 }}
        animate={{ scaleX: landed || reduce ? 1 : 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className={`mt-4 block h-0.5 w-10 origin-center rounded-full bg-current opacity-70 ${stat.accent}`}
      />

      <p className="mt-3 text-xs text-muted-foreground">{stat.hint}</p>
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
