"use client";

import { useEffect, useState } from "react";
import { Link } from "next-view-transitions";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, CalendarCheck, ListChecks, BookOpenCheck, Zap, type LucideIcon } from "lucide-react";
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
        <div className="rounded-2xl border-2 border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive-text">
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
    { icon: BookOpenCheck, value: overview.totals.topicsCompleted, label: "Topics done", face: "bg-primary-bright", edge: "hsl(var(--primary-shade))", text: "text-primary", tilt: -6 },
    { icon: ListChecks, value: overview.totals.attempts, label: "Quizzes", face: "bg-secondary-bright", edge: "hsl(var(--secondary-shade))", text: "text-secondary", tilt: 5 },
    { icon: CalendarCheck, value: heatmap.totalActiveDays, label: "Active days", face: "bg-energy-bright", edge: "hsl(var(--energy-shade))", text: "text-energy", tilt: -4 },
    { icon: Zap, value: heatmap.totalActions, label: "Actions", face: "bg-grape-bright", edge: "hsl(var(--grape-shade))", text: "text-grape", tilt: 7 },
  ];

  return (
    <main className="container max-w-6xl px-4 py-8">
      <Link
        href="/dashboard"
        className="focus-ring inline-flex min-h-[44px] items-center gap-1.5 rounded-lg text-sm font-extrabold text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={3} />
        Back to dashboard
      </Link>

      {/* Header: the one big number, as a juicy bar */}
      <header className="card-chunky mt-3 p-5 sm:p-6">
        <h1 className="font-display text-3xl text-foreground sm:text-4xl">Your progress</h1>
        <p className="mt-1 text-base font-bold text-muted-foreground">
          <span className="text-foreground">{overview.totals.topicsCompleted}</span> of{" "}
          {overview.totals.topicsAvailable} topics complete
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div
            className="relative h-5 flex-1 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={totalPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Overall topic completion"
          >
            <motion.div
              className="relative h-full origin-left rounded-full bg-primary-bright"
              style={{ width: `${Math.max(totalPct, totalPct > 0 ? 4 : 0)}%` }}
              initial={reduce ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: reduce ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <span aria-hidden className="absolute inset-x-2 top-[3px] h-1.5 rounded-full bg-white/35" />
            </motion.div>
          </div>
          <span className="font-display text-2xl tabular-nums text-primary">{totalPct}%</span>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4" aria-label="Totals">
        {stats.map((st, i) => (
          <StatTile key={st.label} stat={st} index={i} />
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Heatmap data={heatmap} />
        <QuizTrendCard items={overview.recentAttempts} />
      </section>

      <section className="mt-6">
        <WeakAreasCard items={overview.weakAreas} />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-black text-foreground">All domains</h2>
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
  face: string;
  edge: string;
  text: string;
  tilt: number;
};

function StatTile({ stat, index }: { stat: StatDef; index: number }) {
  const reduce = useReducedMotionSafe();
  const Icon = stat.icon;
  return (
    <div className="card-chunky flex items-center gap-3 p-4">
      <motion.span
        aria-hidden
        initial={reduce ? false : { scale: 0.4, rotate: 0 }}
        animate={{ scale: 1, rotate: stat.tilt }}
        transition={{ type: "spring", stiffness: 380, damping: 14, delay: reduce ? 0 : 0.1 + index * 0.07 }}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${stat.face}`}
        style={{ boxShadow: `0 4px 0 ${stat.edge}` }}
      >
        <Icon className="h-6 w-6 text-white" strokeWidth={2.6} />
      </motion.span>
      <div className="min-w-0">
        <div className={`font-display text-2xl leading-none tabular-nums ${stat.text}`}>{stat.value.toLocaleString()}</div>
        <div className="mt-1 truncate text-sm font-bold text-muted-foreground">{stat.label}</div>
      </div>
    </div>
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
    <div className="card-chunky h-full p-5">
      <h3 className="text-lg font-black text-foreground">Quiz score trend</h3>
      <p className="text-sm font-bold text-muted-foreground">
        {items.length === 0 ? "No attempts yet." : "Your last 5 attempts, oldest to newest."}
      </p>

      {items.length === 0 ? (
        <div className="mt-4 flex h-44 flex-col items-center justify-center rounded-2xl bg-muted px-4 text-center">
          <p className="text-base font-black text-foreground">Take a quiz to see your trend!</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Every topic ends with five quick questions.</p>
        </div>
      ) : (
        <div className="mt-4 h-48">
          <ScoreTrendChartLazy data={data} />
        </div>
      )}

      {items.length > 0 && (
        <ul className="mt-4 space-y-1">
          {items.slice(0, 3).map((a) => {
            const [hex] = hexFor(a.domain.color);
            return (
              <li key={a.id}>
                <Link
                  href={`/topic/${a.topicId}`}
                  className="focus-ring group flex min-h-[44px] items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span aria-hidden className="h-3 w-3 shrink-0 rounded-full" style={{ background: hex }} />
                    <span className="truncate font-bold text-foreground">{a.topicTitle}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-extrabold tabular-nums",
                        a.passed ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive-text"
                      )}
                    >
                      {a.score}/{a.total}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" strokeWidth={3} aria-hidden />
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

