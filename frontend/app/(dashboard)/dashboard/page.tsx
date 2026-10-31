"use client";

/**
 * The dashboard, in four tiers of weight:
 *   1. a compact welcome (the mascot's bubble carries rotating tips)
 *   2. the focus row: Continue (dominant) beside Today (goal, week, streak)
 *   3. the pulse row: Mistake review · Level · League, quiet and equal
 *   4. the explore tabs: Up next · Your domains · Activity · Trophies
 * and the Arsenal door as a slim strip at the end.
 *
 * Entrance: one staggered rise (0.06s apart, 0.4s each) so the page settles
 * in about half a second; it is the most-visited screen. Reduced motion:
 * everything is in place from the first frame.
 */

import { useEffect, useState } from "react";
import { Link } from "next-view-transitions";
import { motion, type Variants } from "framer-motion";
import { Activity, BarChart3, Compass, LayoutGrid, Trophy } from "lucide-react";
import { fireGoalConfetti } from "@/components/playground/DailyGoal";
import { MascotTips } from "@/components/dashboard/MascotTips";
import { ContinueHero } from "@/components/dashboard/ContinueHero";
import { TodayPanel } from "@/components/dashboard/TodayPanel";
import { LeaguePulse, LevelPulse, ReviewPulse } from "@/components/dashboard/PulseCards";
import { ExploreTabs, type ExploreTab } from "@/components/dashboard/ExploreTabs";
import { RecentAttempts } from "@/components/dashboard/RecentAttempts";
import { ArsenalStrip } from "@/components/dashboard/ArsenalStrip";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { useUserStore } from "@/store/userStore";
import {
  apiErrorMessage,
  fetchBadges,
  fetchOverview,
  fetchReview,
  fetchStreak,
  fetchToday,
  type Badge,
  type ProgressOverview,
  type ReviewList,
  type Streak,
  type TodayProgress,
} from "@/lib/api";
import { DomainProgressRing } from "@/components/progress/DomainProgressRing";
import { MagneticDomainDock } from "@/components/progress/MagneticDomainDock";
import { WeakAreasCard } from "@/components/progress/WeakAreasCard";
import { BadgeCoverflow } from "@/components/gamification/BadgeCoverflow";
import { RecommendedNext } from "@/components/resources/RecommendedNext";

const EASE = [0.22, 1, 0.36, 1] as const;

const page: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

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

  // Today's goal + mistake count load on their own so a slow one never holds
  // up the hero. Failures just leave the panels in their quiet state.
  const [today, setToday] = useState<TodayProgress | null>(null);
  const [review, setReview] = useState<ReviewList | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchToday()
      .then((t) => !cancelled && setToday(t))
      .catch(() => undefined);
    fetchReview()
      .then((r) => !cancelled && setReview(r))
      .catch(() => !cancelled && setReview({ items: [], total: 0 }));
    return () => {
      cancelled = true;
    };
  }, []);

  // Celebrate the daily goal once per browser session per (UTC) day.
  useEffect(() => {
    if (!today || today.goalXp <= 0 || today.xpToday < today.goalXp) return;
    const KEY = "skillstreak.goalCelebrated";
    try {
      if (window.sessionStorage.getItem(KEY) === today.date) return;
      window.sessionStorage.setItem(KEY, today.date);
    } catch {
      // storage blocked: still celebrate, just maybe more than once
    }
    const t = window.setTimeout(fireGoalConfetti, 700);
    return () => window.clearTimeout(t);
  }, [today]);

  if (!user) return null;

  const totals = overview?.totals;
  const activeDomains = overview?.perDomain.filter((d) => d.done > 0).length ?? 0;
  const firstName = user.name.split(" ")[0];
  const days = streak?.currentStreak ?? 0;
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const domainSlug = overview?.recommended?.domain.slug;
  const domainName = overview?.recommended?.domain.name;

  const earned = badges?.filter((b) => b.earnedAt).length ?? 0;
  const weak = overview?.weakAreas.length ?? 0;

  const tabs: ExploreTab[] = [
    {
      id: "next",
      label: "Up next",
      icon: Compass,
      content: <RecommendedNext showHeading={false} />,
    },
    {
      id: "domains",
      label: "Your domains",
      icon: LayoutGrid,
      action: (
        <Link
          href="/progress"
          className="focus-ring inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-1 text-sm font-medium text-secondary hover:underline"
        >
          <BarChart3 className="h-4 w-4" aria-hidden />
          All stats
        </Link>
      ),
      content: overview ? (
        <>
          {/* Desktop: the magnetic dock needs a cursor and the full width. */}
          {!reduce && (
            <div className="hidden lg:block">
              <MagneticDomainDock tiles={overview.perDomain} />
            </div>
          )}
          <div
            className={
              reduce
                ? "grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3"
                : "grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:hidden"
            }
          >
            {overview.perDomain.map((tile, i) => (
              <DomainProgressRing key={tile.slug} tile={tile} index={i} />
            ))}
          </div>
        </>
      ) : (
        <SkeletonGrid />
      ),
    },
    {
      id: "activity",
      label: "Activity",
      icon: Activity,
      badge: weak > 0 ? { text: String(weak), tone: "alert", srLabel: `weak area${weak === 1 ? "" : "s"}` } : undefined,
      content: overview ? (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <RecentAttempts items={overview.recentAttempts} />
          <WeakAreasCard items={overview.weakAreas} attempts={overview.totals.attempts} />
        </div>
      ) : (
        <SkeletonGrid />
      ),
    },
    {
      id: "trophies",
      label: "Trophies",
      icon: Trophy,
      badge: badges ? { text: `${earned}/${badges.length}`, tone: "xp", srLabel: "badges earned" } : undefined,
      content: badges ? <BadgeCoverflow badges={badges} /> : <SkeletonGrid />,
    },
  ];

  return (
    <motion.main
      variants={page}
      initial={reduce ? false : "hidden"}
      animate="show"
      className="container max-w-[1280px] px-4 pb-16 pt-8 lg:pt-10"
    >
      {/* ── 1. Welcome ──────────────────────────────────────── */}
      <motion.header variants={rise} className="relative isolate flex items-end justify-between gap-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-40 -z-10 h-[26rem] w-[44rem] max-w-[100vw] rounded-full bg-[radial-gradient(closest-side,hsl(var(--aurora-1)/0.16),hsl(var(--aurora-2)/0.05)_60%,transparent)] blur-2xl"
        />
        <div className="min-w-0">
          <p className="label-mono flex items-center gap-2 text-muted-foreground">
            <span aria-hidden className="relative flex h-2 w-2">
              {!reduce && <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-60" />}
              <span className="relative h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
            </span>
            {todayLabel}
            {days > 0 && <span className="text-energy">· Day {days}</span>}
          </p>
          <h1 className="mt-3 font-display text-[clamp(2.4rem,6vw,4.25rem)] leading-[0.95] text-foreground [text-wrap:balance]">
            Welcome back, <span className="font-serif-accent text-primary text-glow">{firstName}</span>
            <span className="text-primary">.</span>
          </h1>
          <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            {overview
              ? totals && totals.topicsCompleted > 0
                ? `${totals.topicsCompleted} of ${totals.topicsAvailable} topics cleared across ${activeDomains} domain${activeDomains === 1 ? "" : "s"}. Your next unit is lined up.`
                : "Your path is lined up. One topic today starts the streak."
              : "Loading your path…"}
          </p>
        </div>
        {overview && (
          <MascotTips
            key={domainSlug ?? "generic"}
            domainSlug={domainSlug}
            domainName={domainName}
            size={96}
            className="hidden shrink-0 md:flex"
          />
        )}
      </motion.header>

      {error && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive-text">
          {error}
        </div>
      )}

      {/* ── 2. Focus row: Continue + Today ──────────────────── */}
      <motion.div
        variants={rise}
        className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]"
      >
        <ContinueHero overview={overview} />
        <TodayPanel today={today} streak={streak} />
      </motion.div>

      {/* ── 3. Pulse row ────────────────────────────────────── */}
      <motion.div variants={rise} className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-3 sm:gap-6">
        <ReviewPulse review={review} />
        <LevelPulse xp={user.xp} />
        <LeaguePulse />
      </motion.div>

      {/* Phones: the tips live here, under the stats (the header has no room). */}
      {overview && (
        <motion.div variants={rise} className="mt-6 md:hidden">
          <MascotTips
            key={domainSlug ?? "generic"}
            domainSlug={domainSlug}
            domainName={domainName}
            size={64}
            className="w-full"
            bubbleClassName="mb-3 min-w-0 flex-1 max-w-none"
          />
        </motion.div>
      )}

      {/* ── 4. Explore ──────────────────────────────────────── */}
      <motion.section variants={rise} aria-label="Explore" className="mt-10">
        <ExploreTabs tabs={tabs} />
      </motion.section>

      {/* ── Arsenal door ───────────────────────────────────── */}
      <motion.div variants={rise} className="mt-10">
        <ArsenalStrip />
      </motion.div>
    </motion.main>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card-chunky h-[136px] animate-pulse motion-reduce:animate-none" />
      ))}
    </div>
  );
}
