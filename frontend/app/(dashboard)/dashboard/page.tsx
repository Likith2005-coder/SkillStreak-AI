"use client";

import { useEffect, useState } from "react";
import { Link } from "next-view-transitions";
import { PathPreview } from "@/components/playground/PathPreview";
import { ArsenalCard, LeagueCard, LevelCard, StatPills, StreakCard } from "@/components/playground/Rail";
import { motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import {
  ArrowRight,
  BarChart3,
} from "lucide-react";
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
import { MagneticDomainDock } from "@/components/progress/MagneticDomainDock";
import { WeakAreasCard } from "@/components/progress/WeakAreasCard";
import { BadgeCoverflow } from "@/components/gamification/BadgeCoverflow";
import { RecommendedNext } from "@/components/resources/RecommendedNext";

import { styleFor } from "@/lib/domain-style";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const user = useUserStore((s) => s.user);
  const reduce = useReducedMotion();
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

  if (!user) return null;

  const totalPct = overview && overview.totals.topicsAvailable > 0
    ? Math.round((overview.totals.topicsCompleted / overview.totals.topicsAvailable) * 100)
    : 0;

  return (
    <main className="container px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Centre: the path ─────────────────────────────── */}
        <div className="min-w-0">
          <h1 className="font-display text-3xl text-foreground sm:text-4xl [text-wrap:balance]">
            Welcome back, {user.name.split(" ")[0]}!
          </h1>

          {/* Unit banner: the one thing to do next, as a big chunky slab */}
          {overview?.recommended ? (
            <section
              className="mt-5 flex flex-col gap-5 rounded-[1.5rem] bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between"
              style={{ boxShadow: "0 6px 0 hsl(var(--primary-shade))" }}
            >
              <div className="min-w-0">
                <p className="text-sm font-extrabold uppercase tracking-wider">
                  {overview.recommended.domain.name} · Next up
                </p>
                <p className="mt-1 font-display text-2xl leading-tight sm:text-3xl [text-wrap:balance]">
                  {overview.recommended.topicTitle}
                </p>
              </div>
              <Link
                href={`/topic/${overview.recommended.topicId}`}
                className="focus-ring inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-8 text-base font-black uppercase tracking-wide text-primary transition-[transform,box-shadow] duration-100 [box-shadow:0_5px_0_hsl(var(--primary-shade))] active:translate-y-[5px] active:[box-shadow:none] motion-reduce:transition-none"
              >
                Continue <ArrowRight className="h-5 w-5" strokeWidth={3} />
              </Link>
            </section>
          ) : (
            <section
              className="mt-5 flex flex-col gap-5 rounded-[1.5rem] bg-secondary p-6 text-secondary-foreground sm:flex-row sm:items-center sm:justify-between"
              style={{ boxShadow: "0 6px 0 hsl(var(--secondary-shade))" }}
            >
              <p className="font-display text-2xl leading-tight">Pick a domain and start your first streak.</p>
              <Link
                href="/domains"
                className="focus-ring inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-8 text-base font-black uppercase tracking-wide text-secondary [box-shadow:0_5px_0_hsl(var(--secondary-shade))] active:translate-y-[5px] active:[box-shadow:none]"
              >
                Browse domains <ArrowRight className="h-5 w-5" strokeWidth={3} />
              </Link>
            </section>
          )}

          {overview?.recommended && (
            <section className="mt-8" aria-label="Your path">
              <PathPreview
                slug={overview.recommended.domain.slug}
                currentTopicId={overview.recommended.topicId}
              />
            </section>
          )}

          {error && (
            <div className="mt-6 rounded-xl border-2 border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive-text">
              {error}
            </div>
          )}

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
          reduce ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {overview.perDomain.map((tile, i) => (
                <DomainProgressRing key={tile.slug} tile={tile} index={i} />
              ))}
            </div>
          ) : (
            <>
              {/* Desktop: magnetic dock — bars magnify near the cursor,
                  click one to expand its detail card. */}
              <div className="hidden lg:block">
                <MagneticDomainDock tiles={overview.perDomain} />
              </div>
              {/* Small screens: the classic ring grid (the dock needs a
                  cursor + horizontal room to shine). */}
              <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
                {overview.perDomain.map((tile, i) => (
                  <DomainProgressRing key={tile.slug} tile={tile} index={i} />
                ))}
              </div>
            </>
          )
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
            <div className="rounded-2xl border border-border bg-card/80 p-6 text-center text-xs text-muted-foreground">
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

      {/* Badges — 3D coverflow trophy case */}
      {badges && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Badges
          </h2>
          <BadgeCoverflow badges={badges} />
        </section>
      )}
        </div>

        {/* ── Right rail: vital signs ──────────────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start" aria-label="Your stats">
          <StatPills streakDays={streak?.currentStreak ?? 0} xp={user.xp} level={user.level} />
          <StreakCard streak={streak} />
          <LevelCard xp={user.xp} />
          <LeagueCard />
          <ArsenalCard />
        </aside>
      </div>
    </main>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-[140px] animate-pulse motion-reduce:animate-none rounded-2xl border border-border bg-card/80" />
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
            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/80 p-4 transition hover:border-primary/40 hover:bg-card"
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
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                    : "border border-rose-500/30 bg-rose-500/10 text-rose-700"
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
