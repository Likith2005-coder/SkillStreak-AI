"use client";

import { useEffect, useState } from "react";
import { Link } from "next-view-transitions";
import { PathPreview } from "@/components/playground/PathPreview";
import { ArsenalCard, LeagueCard, LevelCard, StreakCard } from "@/components/playground/Rail";
import { motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import {
  ArrowRight,
  BarChart3,
  Check,
  X,
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
          <section className="mt-10">
            <RecommendedNext />
          </section>

          {/* Domain progress */}
          <section className="mt-10" aria-labelledby="domains-h">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 id="domains-h" className="text-2xl font-black text-foreground">
                Your domains
              </h2>
              <Link
                href="/progress"
                className="focus-ring inline-flex min-h-[44px] items-center gap-1.5 rounded-lg text-sm font-extrabold uppercase tracking-wide text-secondary hover:underline"
              >
                <BarChart3 className="h-4 w-4" strokeWidth={3} aria-hidden />
                All stats
              </Link>
            </div>
            {overview ? (
              reduce ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {overview.perDomain.map((tile, i) => (
                    <DomainProgressRing key={tile.slug} tile={tile} index={i} />
                  ))}
                </div>
              ) : (
                <>
                  {/* Wide desktop: magnetic dock — bars magnify near the
                      cursor, click one to expand its detail card. It needs a
                      cursor and real horizontal room, so it only appears at
                      2xl where the centre column can hold it. */}
                  <div className="hidden 2xl:block">
                    <MagneticDomainDock tiles={overview.perDomain} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:hidden">
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
          <section className="mt-10 grid gap-4 xl:grid-cols-2">
            <div className="min-w-0">
              <h2 className="mb-4 text-2xl font-black text-foreground">Recent quizzes</h2>
              {overview ? (
                <RecentAttempts items={overview.recentAttempts} />
              ) : (
                <div className="space-y-2.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
                  ))}
                </div>
              )}
            </div>
            <div className="min-w-0 xl:pt-12">
              {overview && <WeakAreasCard items={overview.weakAreas} />}
            </div>
          </section>

          {/* Badges — 3D coverflow trophy case */}
          {badges && (
            <section className="mt-10" aria-label="Badges">
              <BadgeCoverflow badges={badges} />
            </section>
          )}
        </div>

        {/* ── Right rail: vital signs ──────────────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start" aria-label="Your stats">
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
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card-chunky h-[140px] animate-pulse motion-reduce:animate-none" />
      ))}
    </div>
  );
}

function RecentAttempts({ items }: { items: RecentAttempt[] }) {
  if (items.length === 0) {
    return (
      <div className="card-chunky flex flex-col items-center px-6 py-8 text-center">
        <p className="text-lg font-black text-foreground">No quizzes yet!</p>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          Finish a topic and take its quiz to see your scores here.
        </p>
      </div>
    );
  }
  return (
    <ul className="space-y-2.5">
      {items.map((a) => {
        const s = styleFor(a.domain.color);
        return (
          <li key={a.id}>
            <Link
              href={`/topic/${a.topicId}`}
              className="card-press focus-ring group flex items-center gap-3 rounded-2xl border-2 border-b-4 border-border bg-card p-3 transition-colors hover:bg-muted/60"
            >
              <span
                aria-hidden
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white",
                  a.passed ? "bg-primary-bright" : "bg-destructive-bright"
                )}
                style={{ boxShadow: `0 3px 0 hsl(var(--${a.passed ? "primary" : "destructive"}-shade))` }}
              >
                {a.passed ? <Check className="h-6 w-6" strokeWidth={3.5} /> : <X className="h-6 w-6" strokeWidth={3.5} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className={cn("truncate text-xs font-extrabold", s.text)}>{a.domain.name}</div>
                <div className="truncate text-base font-extrabold text-foreground">{a.topicTitle}</div>
                <div className="text-xs font-semibold text-muted-foreground">
                  {new Date(a.attemptedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-sm font-black tabular-nums",
                  a.passed ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive-text"
                )}
              >
                {a.score}/{a.total}
                <span className="sr-only">{a.passed ? " passed" : " not passed"}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
