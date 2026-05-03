"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import {
  apiErrorMessage,
  fetchHeatmap,
  fetchOverview,
  type HeatmapData,
  type ProgressOverview,
  type RecentAttempt,
} from "@/lib/api";
import { Heatmap } from "@/components/progress/Heatmap";
import { DomainProgressRing } from "@/components/progress/DomainProgressRing";
import { WeakAreasCard } from "@/components/progress/WeakAreasCard";
import { styleFor } from "@/lib/domain-style";
import { cn } from "@/lib/utils";

export default function ProgressPage() {
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
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      </main>
    );
  }

  if (!overview || !heatmap) {
    return (
      <main className="container flex items-center justify-center px-4 py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </main>
    );
  }

  const totalPct =
    overview.totals.topicsAvailable > 0
      ? Math.round((overview.totals.topicsCompleted / overview.totals.topicsAvailable) * 100)
      : 0;

  return (
    <main className="container px-4 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <header className="mt-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Your journey
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {overview.totals.topicsCompleted} of {overview.totals.topicsAvailable} topics ·{" "}
          <span className="gradient-text">{totalPct}%</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Heatmap covers the last 90 days · {heatmap.totalActiveDays} active days ·{" "}
          {heatmap.totalActions} total actions
        </p>
      </header>

      <section className="mt-6">
        <Heatmap data={heatmap} />
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <QuizTrendCard items={overview.recentAttempts} />
        <WeakAreasCard items={overview.weakAreas} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          All domains
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {overview.perDomain.map((tile, i) => (
            <DomainProgressRing key={tile.slug} tile={tile} index={i} />
          ))}
        </div>
      </section>
    </main>
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
    <div className="rounded-2xl border border-border bg-card/40 p-5 backdrop-blur">
      <h3 className="text-sm font-medium">Quiz score trend</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {items.length === 0 ? "No attempts yet." : "Last 5 attempts (oldest → newest)."}
      </p>

      {items.length === 0 ? (
        <div className="mt-4 flex h-40 items-center justify-center rounded-xl border border-dashed border-border bg-card/30 text-xs text-muted-foreground">
          Take a quiz to see your trend.
        </div>
      ) : (
        <div className="mt-4 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.4} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis
                domain={[0, 5]}
                ticks={[0, 1, 2, 3, 4, 5]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                formatter={(v) => [`${v}/5`, "Score"]}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#a78bfa"
                strokeWidth={2}
                fill="url(#scoreFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {items.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {items.slice(0, 3).map((a) => {
            const s = styleFor(a.domain.color);
            return (
              <li key={a.id}>
                <Link
                  href={`/topic/${a.topicId}`}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs transition hover:bg-card/60"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", `bg-${a.domain.color}-400`)} />
                    <span className="truncate text-foreground">{a.topicTitle}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", s.text)}>
                      {a.score}/{a.total}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
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
