"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  ListChecks,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/userStore";
import {
  apiErrorMessage,
  fetchBadges,
  fetchOverview,
  fetchStreak,
  type Badge,
  type ProgressOverview,
  type RecentAttempt,
  type Streak,
} from "@/lib/api";
import { DomainProgressRing } from "@/components/progress/DomainProgressRing";
import { WeakAreasCard } from "@/components/progress/WeakAreasCard";
import { StreakBanner } from "@/components/gamification/StreakBanner";
import { XpBar } from "@/components/gamification/XpBar";
import { BadgeGallery } from "@/components/gamification/BadgeGallery";
import { RecommendedNext } from "@/components/resources/RecommendedNext";
import { useCountUp } from "@/hooks/useCountUp";
import { styleFor } from "@/lib/domain-style";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const user = useUserStore((s) => s.user);
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [badges, setBadges] = useState<Badge[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchOverview(), fetchStreak(), fetchBadges()])
      .then(([o, s, b]) => {
        if (cancelled) return;
        setOverview(o);
        setStreak(s);
        setBadges(b);
      })
      .catch((err) => !cancelled && setError(apiErrorMessage(err, "Could not load your progress")));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user || !user.profile) return null;

  const totalPct = overview && overview.totals.topicsAvailable > 0
    ? Math.round((overview.totals.topicsCompleted / overview.totals.topicsAvailable) * 100)
    : 0;

  return (
    <main className="container px-4 py-10">
      {/* Hero */}
      <section className="rounded-2xl border border-border bg-card/50 p-8 backdrop-blur">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Phase 5 · Progress live
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Welcome back, {user.name.split(" ")[0]}.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          {overview?.recommended
            ? `Pick up where you left off — your next topic is ready below.`
            : `Browse domains, take a quiz, or chat with the AI tutor anytime.`}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {overview?.recommended ? (
            <Button asChild size="lg">
              <Link href={`/topic/${overview.recommended.topicId}`}>
                <BookOpen className="h-4 w-4" />
                Continue: {overview.recommended.topicTitle}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link href="/domains">
                <BookOpen className="h-4 w-4" /> Browse domains <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="lg">
            <Link href="/chatbot">
              <Bot className="h-4 w-4" /> Open AI tutor
            </Link>
          </Button>
        </div>
      </section>

      {error && (
        <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Streak + XP */}
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <StreakBanner streak={streak} />
        <XpBar level={user.level} xp={user.xp} />
      </section>

      {/* Stat tiles */}
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <NumberTile
          icon={<Target className="h-4 w-4 text-primary" />}
          label="Topics completed"
          target={overview?.totals.topicsCompleted ?? 0}
          hint={overview ? `of ${overview.totals.topicsAvailable} · ${totalPct}%` : "loading…"}
        />
        <NumberTile
          icon={<ListChecks className="h-4 w-4 text-emerald-400" />}
          label="Recent quiz attempts"
          target={overview?.totals.attempts ?? 0}
          hint="last 5 shown below"
        />
        <Link href="/leaderboard" className="block">
          <StatTile
            icon={<Trophy className="h-4 w-4 text-amber-400" />}
            label="Weekly leaderboard"
            value="View →"
            hint="Top 10 by XP this week"
          />
        </Link>
      </section>

      {/* Recommended next */}
      <section className="mt-8">
        <RecommendedNext />
      </section>

      {/* Domain rings */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Per-domain progress
          </h2>
          <Link
            href="/progress"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Deep analytics
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {overview ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {overview.perDomain.map((tile, i) => (
              <DomainProgressRing key={tile.slug} tile={tile} index={i} />
            ))}
          </div>
        ) : (
          <SkeletonGrid />
        )}
      </section>

      {/* Recent + weak areas */}
      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Recent quiz attempts
          </h2>
          {overview ? (
            <RecentAttempts items={overview.recentAttempts} />
          ) : (
            <div className="rounded-2xl border border-border bg-card/40 p-6 text-center text-xs text-muted-foreground">
              Loading…
            </div>
          )}
        </div>
        <div>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            &nbsp;
          </h2>
          {overview && <WeakAreasCard items={overview.weakAreas} />}
        </div>
      </section>

      {/* Badges */}
      {badges && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Badges
          </h2>
          <BadgeGallery badges={badges} />
        </section>
      )}
    </main>
  );
}

function StatTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-border bg-card/50 p-5 backdrop-blur transition-shadow hover:shadow-lg"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </motion.div>
  );
}

function NumberTile({
  icon,
  label,
  target,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  target: number;
  hint: string;
}) {
  const display = useCountUp(target, 1100);
  return <StatTile icon={icon} label={label} value={`${display}`} hint={hint} />;
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-[140px] animate-pulse rounded-2xl border border-border bg-card/40" />
      ))}
    </div>
  );
}

function RecentAttempts({ items }: { items: RecentAttempt[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/30 p-6 text-center text-xs text-muted-foreground">
        No quiz attempts yet. Take a quiz on any topic to see it here.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {items.map((a) => {
        const s = styleFor(a.domain.color);
        return (
          <Link
            key={a.id}
            href={`/topic/${a.topicId}`}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/50 p-4 backdrop-blur transition hover:border-primary/40 hover:bg-card"
          >
            <div className="min-w-0">
              <div className={cn("text-[11px] uppercase tracking-wider", s.text)}>{a.domain.name}</div>
              <div className="truncate text-sm font-medium text-foreground">{a.topicTitle}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {new Date(a.attemptedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  a.passed
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border border-rose-500/30 bg-rose-500/10 text-rose-300"
                )}
              >
                {a.score}/{a.total}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
