"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "next-view-transitions";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, CalendarCheck, ListChecks, BookOpenCheck, Zap, LineChart, type LucideIcon } from "lucide-react";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import {
  apiErrorMessage,
  fetchHeatmap,
  fetchOverview,
  type HeatmapData,
  type ProgressOverview,
  type RecentAttempt,
} from "@/lib/api";
import { Heatmap } from "@/components/progress/Heatmap";
import { ScoreTrendChartLazy } from "@/components/progress/ScoreTrendChartLazy";
import { DomainProgressRing } from "@/components/progress/DomainProgressRing";
import { WeakAreasCard } from "@/components/progress/WeakAreasCard";
import { hexFor } from "@/lib/domain-style";
import { ProgressSkeleton } from "@/components/progress/ProgressSkeleton";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function ProgressPage() {
  const reduce = useReducedMotionSafe();
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchOverview(), fetchHeatmap()])
      .then(([o, h]) => {
        if (cancelled) return;
        setOverview(o);
        setHeatmap(h);
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, "Could not load analytics"));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <main className="container px-4 py-10">
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive-text"
        >
          {error}
        </div>
      </main>
    );
  }

  if (!overview || !heatmap) {
    return <ProgressSkeleton />;
  }

  const totalPct =
    overview.totals.topicsAvailable > 0
      ? Math.round((overview.totals.topicsCompleted / overview.totals.topicsAvailable) * 100)
      : 0;

  const stats: StatDef[] = [
    { icon: BookOpenCheck, value: overview.totals.topicsCompleted, label: "Topics done", well: "bg-primary/10 text-primary ring-primary/20", text: "text-primary", spot: "var(--primary)" },
    { icon: ListChecks, value: overview.totals.attempts, label: "Quizzes", well: "bg-secondary/10 text-secondary ring-secondary/20", text: "text-secondary", spot: "var(--secondary)" },
    { icon: CalendarCheck, value: heatmap.totalActiveDays, label: "Active days", well: "bg-energy/10 text-energy ring-energy/20", text: "text-energy", spot: "var(--energy)" },
    { icon: Zap, value: heatmap.totalActions, label: "Actions", well: "bg-grape/10 text-grape ring-grape/20", text: "text-grape", spot: "var(--grape)" },
  ];

  return (
    <main className="container max-w-6xl px-4 py-8">
      <Link
        href="/dashboard"
        className="focus-ring inline-flex min-h-[44px] items-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to dashboard
      </Link>

      {/* Header: the one big number, lit. */}
      <header className="card-chunky border-beam relative mt-3 overflow-hidden p-6 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <div className="absolute -right-24 -top-32 h-80 w-[34rem] rounded-full bg-aurora-4/[0.12] blur-3xl" />
          <div className="absolute -left-20 -top-20 h-60 w-80 rounded-full bg-aurora-2/[0.12] blur-3xl" />
          <div className="grid-faint absolute inset-0 opacity-60" />
        </div>
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-[clamp(2.25rem,6vw,4rem)] leading-[1] text-foreground [text-wrap:balance]">
              Your <span className="font-serif-accent text-primary text-glow">progress</span>
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">{overview.totals.topicsCompleted}</span> of{" "}
              <span className="tabular-nums">{overview.totals.topicsAvailable}</span> topics complete
            </p>
          </div>
          <div className="flex items-baseline gap-1 sm:text-right">
            <span className="font-display text-6xl leading-none tabular-nums text-primary text-glow sm:text-7xl">
              {totalPct}
            </span>
            <span className="font-display text-2xl text-primary/80">%</span>
          </div>
        </div>
        <div
          className="relative mt-6 h-2 overflow-hidden rounded-full bg-white/[0.06]"
          role="progressbar"
          aria-valuenow={totalPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall topic completion"
        >
          <motion.div
            className="h-full origin-left rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
            style={{ width: `${Math.max(totalPct, totalPct > 0 ? 2 : 0)}%` }}
            initial={reduce ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: reduce ? 0 : 1.1, ease: EASE }}
          />
        </div>
      </header>

      <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4" aria-label="Totals">
        {stats.map((st, i) => (
          <StatTile key={st.label} stat={st} index={i} />
        ))}
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <Heatmap data={heatmap} />
        <QuizTrendCard items={overview.recentAttempts} />
      </section>

      <section className="mt-4">
        <WeakAreasCard items={overview.weakAreas} />
      </section>

      <section className="mt-12">
        <h2 className="mb-5 font-display text-2xl text-foreground sm:text-3xl">All domains</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {overview.perDomain.map((tile, i) => (
            <DomainProgressRing key={tile.slug} tile={tile} index={i} />
          ))}
        </div>
      </section>
    </main>
  );
}

type StatDef = {
  icon: LucideIcon;
  value: number;
  label: string;
  /** Role-tinted icon well classes. */
  well: string;
  text: string;
  /** Spotlight colour channels. */
  spot: string;
};

function StatTile({ stat, index }: { stat: StatDef; index: number }) {
  const reduce = useReducedMotionSafe();
  const Icon = stat.icon;
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.1 + index * 0.06, ease: EASE }}
      className="card-chunky spotlight flex flex-col gap-4 p-4 sm:p-5"
      style={{ "--spot": stat.spot } as CSSProperties}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="label-mono truncate text-muted-foreground">{stat.label}</span>
        <span aria-hidden className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1", stat.well)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className={cn("font-display text-3xl leading-none tabular-nums sm:text-4xl", stat.text)}>
        {stat.value.toLocaleString()}
      </div>
    </motion.div>
  );
}

function QuizTrendCard({ items }: { items: RecentAttempt[] }) {
  const data = items
    .slice()
    .reverse()
    .map((a, i) => ({
      idx: i + 1,
      score: a.score,
      label: new Date(a.attemptedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      title: a.topicTitle,
      domain: a.domain.name,
      passed: a.passed,
    }));

  return (
    <div className="card-chunky spotlight h-full p-5 sm:p-6" style={{ "--spot": "var(--secondary)" } as CSSProperties}>
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary ring-1 ring-secondary/20"
        >
          <LineChart className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-lg text-foreground">Quiz score trend</h3>
          <p className="text-sm text-muted-foreground">
            {items.length === 0 ? "No attempts yet." : "Your last 5 attempts, oldest to newest."}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 text-center">
          <p className="font-semibold text-foreground">Take a quiz to see your trend</p>
          <p className="mt-1 text-sm text-muted-foreground">Every topic ends with five quick questions.</p>
        </div>
      ) : (
        <div className="mt-5 h-48">
          <ScoreTrendChartLazy data={data} />
        </div>
      )}

      {items.length > 0 && (
        <ul className="mt-4 divide-y divide-white/[0.06] border-t border-white/[0.06]">
          {items.slice(0, 3).map((a) => {
            const [hex] = hexFor(a.domain.color);
            return (
              <li key={a.id}>
                <Link
                  href={`/topic/${a.topicId}`}
                  className="focus-ring group -mx-2 flex min-h-[44px] items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: hex, boxShadow: `0 0 8px ${hex}` }}
                    />
                    <span className="truncate font-medium text-foreground">{a.topicTitle}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 font-mono text-xs font-semibold tabular-nums",
                        a.passed
                          ? "border-primary/25 bg-primary/10 text-primary"
                          : "border-destructive/25 bg-destructive/10 text-destructive-text"
                      )}
                    >
                      {a.score}/{a.total}
                    </span>
                    <ChevronRight
                      className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                      aria-hidden
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
