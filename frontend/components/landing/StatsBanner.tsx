"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { BookOpen, Layers, ListChecks, Trophy } from "lucide-react";

type Stat = {
  icon: typeof BookOpen;
  value: number;
  suffix?: string;
  label: string;
  hint: string;
  text: string; // numeral colour (AA on white)
  face: string; // icon tile face
  edge: string; // icon tile 3D edge
  tilt: number;
};

const STATS: Stat[] = [
  { icon: BookOpen, value: 9, label: "Tech domains", hint: "Cybersecurity to Cloud", text: "text-secondary", face: "bg-secondary-bright", edge: "hsl(var(--secondary-shade))", tilt: -8 },
  { icon: Layers, value: 90, suffix: "+", label: "Curated topics", hint: "Across 5 deep roadmaps", text: "text-grape", face: "bg-grape-bright", edge: "hsl(var(--grape-shade))", tilt: 6 },
  { icon: ListChecks, value: 5, label: "AI MCQs per topic", hint: "Checked by a second AI pass", text: "text-primary", face: "bg-primary-bright", edge: "hsl(var(--primary-shade))", tilt: -5 },
  { icon: Trophy, value: 8, label: "Badges to unlock", hint: "Streaks, perfect quizzes, more", text: "text-xp", face: "bg-xp-bright", edge: "hsl(var(--xp-shade))", tilt: 9 },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Stats, playground edition: four chunky tiles, each with a tilted sticker
 * icon that pops in, and a numeral that counts up and bounces when it lands.
 */
export function StatsBanner() {
  return (
    <section className="relative px-4 py-20 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-12 text-center font-display text-3xl md:text-5xl [text-wrap:balance]">
          Built end to end. <span className="text-primary">Live today.</span>
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
          {STATS.map((s, i) => (
            <StatTile key={s.label} stat={s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatTile({ stat, index }: { stat: Stat; index: number }) {
  const reduce = useReducedMotion();
  const [counting, setCounting] = useState(false);
  const display = useCountUp(stat.value, counting, 1100);
  const landed = counting && display === stat.value;
  const Icon = stat.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      onViewportEnter={() => setCounting(true)}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: reduce ? 0 : 0.55, delay: reduce ? 0 : index * 0.08, ease: EASE }}
      className="card-chunky flex flex-col items-center px-4 pb-6 pt-7 text-center"
    >
      <motion.span
        aria-hidden
        initial={{ scale: 0.4, rotate: 0 }}
        whileInView={{ scale: 1, rotate: stat.tilt }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ type: "spring", stiffness: 380, damping: 14, delay: reduce ? 0 : 0.15 + index * 0.08 }}
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${stat.face}`}
        style={{ boxShadow: `0 5px 0 ${stat.edge}` }}
      >
        <Icon className="h-7 w-7 text-white" strokeWidth={2.6} />
      </motion.span>

      <motion.div
        animate={reduce ? undefined : landed ? { scale: [1, 1.12, 1] } : { scale: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
        className={`mt-5 font-display text-6xl tabular-nums sm:text-7xl ${stat.text}`}
      >
        {display}
        {stat.suffix}
      </motion.div>
      <p className="mt-2 text-base font-black text-foreground">{stat.label}</p>
      <p className="mt-1 text-sm font-semibold text-muted-foreground">{stat.hint}</p>
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
