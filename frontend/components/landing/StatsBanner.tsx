"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { BookOpen, Layers, ListChecks, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { MaskHeading } from "./Reveal";

type Stat = {
  icon: typeof BookOpen;
  value: number;
  suffix?: string;
  label: string;
  hint: string;
  text: string; // numeral + icon colour (bright on dark)
  well: string; // role-tinted icon well
  glow: string; // numeral glow (text-shadow)
  flare: string; // the flash behind the numeral when the count lands
};

// Written out in full so Tailwind can see every class.
const STATS: Stat[] = [
  {
    icon: BookOpen,
    value: 9,
    label: "Tech domains",
    hint: "Cybersecurity to IoT",
    text: "text-secondary",
    well: "bg-secondary/10 text-secondary ring-secondary/20",
    glow: "[text-shadow:0_0_36px_hsl(var(--secondary)/0.55)]",
    flare: "bg-[radial-gradient(closest-side,hsl(var(--secondary)/0.45),transparent)]",
  },
  {
    icon: Layers,
    value: 580,
    suffix: "+",
    label: "Curated topics",
    hint: "Across nine full roadmaps",
    text: "text-grape",
    well: "bg-grape/10 text-grape ring-grape/20",
    glow: "[text-shadow:0_0_36px_hsl(var(--grape)/0.55)]",
    flare: "bg-[radial-gradient(closest-side,hsl(var(--grape)/0.45),transparent)]",
  },
  {
    icon: ListChecks,
    value: 5,
    label: "AI MCQs per topic",
    hint: "Checked by a second AI pass",
    text: "text-primary",
    well: "bg-primary/10 text-primary ring-primary/20",
    glow: "[text-shadow:0_0_36px_hsl(var(--primary)/0.55)]",
    flare: "bg-[radial-gradient(closest-side,hsl(var(--primary)/0.45),transparent)]",
  },
  {
    icon: Trophy,
    value: 8,
    label: "Badges to unlock",
    hint: "Streaks, perfect quizzes, more",
    text: "text-xp",
    well: "bg-xp/10 text-xp ring-xp/20",
    glow: "[text-shadow:0_0_36px_hsl(var(--xp)/0.5)]",
    flare: "bg-[radial-gradient(closest-side,hsl(var(--xp)/0.45),transparent)]",
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Stats, Midnight edition: one lit instrument panel split into four cells by
 * hairlines. Each numeral counts up in its role colour and glows when it
 * lands; a faint aurora pool sits behind the panel.
 */
export function StatsBanner() {
  const reduce = useReducedMotion();
  return (
    <section className="relative px-4 py-20 lg:px-12 lg:py-28">
      {/* Aurora pool + grid behind the panel */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[26rem] w-[60rem] max-w-[140vw] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[radial-gradient(closest-side,hsl(var(--aurora-2)/0.16),hsl(var(--aurora-1)/0.08)_55%,transparent)] blur-2xl" />
        <div className="grid-faint absolute inset-0" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* Off-centre on purpose: the page's one left-aligned header, so the
            section rhythm isn't a stack of centred blocks. */}
        <div className="mb-12 grid gap-5 md:grid-cols-[1.3fr_1fr] md:items-end">
          <MaskHeading line="left" className="font-display text-4xl leading-[1.05] [text-wrap:balance] md:text-6xl">
            What&apos;s inside, from{" "}
            <span className="font-serif-accent text-primary text-glow">day one.</span>
          </MaskHeading>
          <motion.p
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : 0.25, ease: EASE }}
            className="max-w-sm text-[15px] leading-relaxed text-muted-foreground md:justify-self-end md:pb-8 md:text-base"
          >
            Every domain is a full roadmap, every topic ends in a quiz, and every day you show up is
            counted.
          </motion.p>
        </div>

        <div className="card-chunky spotlight grid grid-cols-2 overflow-hidden lg:grid-cols-4">
          {STATS.map((s, i) => (
            <StatCell key={s.label} stat={s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCell({ stat, index }: { stat: Stat; index: number }) {
  const reduce = useReducedMotion();
  const [counting, setCounting] = useState(false);
  const display = useCountUp(stat.value, counting, 1300);
  const landed = counting && display === stat.value;
  const Icon = stat.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      onViewportEnter={() => setCounting(true)}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : index * 0.08, ease: EASE }}
      className={cn(
        "relative flex flex-col px-5 py-7 sm:px-7 sm:py-9",
        // Hairline dividers: between columns, and between the two rows on
        // the 2-up phone/tablet grid.
        index % 2 === 1 && "border-l border-white/[0.06]",
        index >= 2 && "border-t border-white/[0.06] lg:border-t-0",
        index === 2 && "lg:border-l",
      )}
    >
      <span
        aria-hidden
        className={cn("flex h-9 w-9 items-center justify-center rounded-lg ring-1", stat.well)}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>

      <div className="relative mt-6 self-start">
        {/* The landing flare: a one-off flash of the stat's colour behind the
            numeral, and a small pulse of the numeral itself. */}
        {landed && !reduce && (
          <motion.span
            aria-hidden
            initial={{ opacity: 0.85, scale: 0.4 }}
            animate={{ opacity: 0, scale: 1.7 }}
            transition={{ duration: 0.9, ease: EASE }}
            className={cn("pointer-events-none absolute left-1/2 top-1/2 -ml-16 -mt-16 h-32 w-32 rounded-full", stat.flare)}
          />
        )}
        <motion.div
          animate={landed && !reduce ? { scale: [1, 1.08, 1] } : undefined}
          transition={{ duration: 0.55, ease: EASE }}
          className={cn(
            "relative origin-left font-display text-6xl leading-none tabular-nums transition-[text-shadow] duration-700 sm:text-7xl",
            stat.text,
            landed && stat.glow,
          )}
        >
          {display}
          {stat.suffix}
        </motion.div>
      </div>
      <p className="mt-4 text-[15px] font-semibold text-foreground">{stat.label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{stat.hint}</p>
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
      const eased = 1 - Math.pow(1 - p, 4);
      setV(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, durationMs, reduce]);

  return v;
}
