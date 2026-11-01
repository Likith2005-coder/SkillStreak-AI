"use client";

/**
 * The dashboard, in four tiers of weight:
 *   1. a compact welcome (the mascot's bubble carries rotating tips)
 *   2. the focus row: Continue (dominant) beside Today (goal, week, streak)
 *   3. the pulse row: Mistake review · Level · League, quiet and equal
 *   4. the explore tabs: Up next · Your domains · Activity · Trophies
 * and the Arsenal door as a slim strip at the end.
 *
 * Entrance (see components/dashboard/cinema.tsx):
 *   - first visit in a browser session: a ~2s opening shot. The page fades up
 *     from black under one aurora light sweep, the kicker types in, the
 *     headline rises word by word out of a blur and the name glows on last,
 *     the mascot drops in on a spring, the Continue panel ignites (beam +
 *     light bloom), Today's ring draws with a comet riding it, then the pulse
 *     cards and the explore area cascade in. Any click, key, wheel, touch or
 *     scroll completes it instantly; everything is clickable throughout.
 *   - every later visit: one staggered rise (0.06s apart, 0.4s each), so the
 *     most-visited screen settles in about half a second.
 *   - reduced motion: everything is in place from the first frame; no sweep,
 *     drift, parallax or cursor light.
 * Atmosphere: drifting aurora pools, film grain and a cursor light behind the
 * header, on a layer that lags the content on scroll.
 */

import { useEffect, useState } from "react";
import { Link } from "next-view-transitions";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { Activity, BarChart3, Compass, LayoutGrid, Trophy } from "lucide-react";
import { fireGoalConfetti } from "@/components/playground/DailyGoal";
import { botReact } from "@/components/mascot/bus";
import { MascotTips } from "@/components/dashboard/MascotTips";
import { ContinueHero } from "@/components/dashboard/ContinueHero";
import { TodayPanel } from "@/components/dashboard/TodayPanel";
import { LeaguePulse, LevelPulse, ReviewPulse } from "@/components/dashboard/PulseCards";
import { ExploreTabs, type ExploreTab } from "@/components/dashboard/ExploreTabs";
import { RecentAttempts } from "@/components/dashboard/RecentAttempts";
import { ArsenalStrip } from "@/components/dashboard/ArsenalStrip";
import {
  CinemaBackdrop,
  Curtain,
  EASE,
  Reveal,
  RevealHeading,
  SHOT,
  shot,
  useOpeningShot,
} from "@/components/dashboard/cinema";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/utils";
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

  const { mode, playing, started, waiting, reduce } = useOpeningShot(overview !== null || error !== null);
  const quick = mode === "quick";

  // Header text drifts a little slower than the page on scroll (depth).
  const { scrollY } = useScroll();
  const headY = useTransform(scrollY, [0, 600], [0, 18], { clamp: true });

  // During the opening, Today's numbers wait for their panel to arrive so the
  // ring draws (with its comet) on screen rather than before the reveal.
  const [todayGate, setTodayGate] = useState(!playing);
  useEffect(() => {
    if (!playing) {
      setTodayGate(true);
      return;
    }
    if (!started) return;
    const t = window.setTimeout(() => setTodayGate(true), SHOT.todayData);
    return () => window.clearTimeout(t);
  }, [playing, started]);

  // Celebrate the daily goal once per browser session per (UTC) day: confetti
  // plus the mascot cheering. After an opening shot, right as it lands.
  useEffect(() => {
    if (playing) return;
    if (!today || today.goalXp <= 0 || today.xpToday < today.goalXp) return;
    const KEY = "skillstreak.goalCelebrated";
    try {
      if (window.sessionStorage.getItem(KEY) === today.date) return;
      window.sessionStorage.setItem(KEY, today.date);
    } catch {
      // storage blocked: still celebrate, just maybe more than once
    }
    const t = window.setTimeout(
      () => {
        fireGoalConfetti();
        botReact({ mood: "celebrate", say: "Goal smashed!" });
      },
      mode === "opening" ? 150 : 700,
    );
    return () => window.clearTimeout(t);
  }, [today, playing, mode]);

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

  // Quick mode: the classic staggered rise. Opening / still: framer stays
  // out of the way (the opening's keyframes are CSS classes, see `shot`).
  const v = quick ? rise : undefined;
  const words = ["Welcome", "back,"];
  const nameAt = SHOT.words + words.length * SHOT.wordStagger + 60;
  const kicker = shot(playing, "cine-type", SHOT.kicker);
  const lead = shot(playing, "cine-fade", SHOT.lead);
  const name = shot(playing, "cine-name", nameAt);
  const pulse = shot(playing, "", SHOT.pulse);

  return (
    <div className={cn("relative isolate overflow-x-clip", waiting && "cine-wait")}>
      <CinemaBackdrop playing={playing} reduce={reduce} />
      {/* Film grain: static, fixed, on its own layer (cheap while scrolling). */}
      <div className="noise-overlay" aria-hidden />
      {playing && <Curtain held={waiting} />}

      <motion.main
        variants={page}
        initial={quick ? "hidden" : false}
        animate="show"
        className="container max-w-[1280px] px-4 pb-16 pt-8 lg:pt-10"
      >
        {/* ── 1. Welcome ──────────────────────────────────────── */}
        <motion.header variants={v}>
          {/* md+: reserve the mascot block's height (~142px) so the headline
              doesn't drop when the mascot mounts with the data. */}
          <motion.div
            style={reduce ? undefined : { y: headY }}
            className="flex items-end justify-between gap-8 md:min-h-[142px]"
          >
            <div className="min-w-0">
              <p className="label-mono flex items-center gap-2 text-muted-foreground">
                <span aria-hidden className="relative flex h-2 w-2">
                  {!reduce && <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-60" />}
                  <span className="relative h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                </span>
                <span className={kicker.className} style={kicker.style}>
                  {todayLabel}
                  {days > 0 && <span className="text-energy"> · Day {days}</span>}
                </span>
              </p>
              <h1 className="mt-3 font-display text-[clamp(2.4rem,6vw,4.25rem)] leading-[0.95] text-foreground [text-wrap:balance]">
                {words.map((w, i) => {
                  const p = shot(playing, "cine-word", SHOT.words + i * SHOT.wordStagger);
                  return (
                    <span key={w}>
                      <span className={cn("inline-block", p.className)} style={p.style}>
                        {w}
                      </span>{" "}
                    </span>
                  );
                })}
                <span className={cn("inline-block", name.className)} style={name.style}>
                  <span className="font-serif-accent text-primary text-glow">{firstName}</span>
                  <span className="text-primary">.</span>
                </span>
              </h1>
              <p
                className={cn(
                  "mt-3 max-w-[56ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base",
                  lead.className,
                )}
                style={lead.style}
              >
                {overview
                  ? totals && totals.topicsCompleted > 0
                    ? `${totals.topicsCompleted} of ${totals.topicsAvailable} topics cleared across ${activeDomains} domain${activeDomains === 1 ? "" : "s"}. Your next unit is lined up.`
                    : "Your path is lined up. One topic today starts the streak."
                  : "Loading your path…"}
              </p>
            </div>
            {overview && (
              // The mascot drops in from above on a spring during the opening;
              // a skip snaps it home.
              <motion.div
                className="hidden shrink-0 md:block"
                initial={playing ? { y: -90, opacity: 0, rotate: -8 } : false}
                animate={
                  waiting
                    ? { y: -90, opacity: 0, rotate: -8 }
                    : playing
                    ? {
                        y: 0,
                        opacity: 1,
                        rotate: 0,
                        transition: {
                          type: "spring",
                          stiffness: 260,
                          damping: 17,
                          mass: 0.9,
                          delay: SHOT.mascot / 1000,
                          opacity: { duration: 0.3, delay: SHOT.mascot / 1000 },
                        },
                      }
                    : { y: 0, opacity: 1, rotate: 0, transition: { duration: 0 } }
                }
              >
                <MascotTips
                  key={domainSlug ?? "generic"}
                  domainSlug={domainSlug}
                  domainName={domainName}
                  size={96}
                  className="flex"
                />
              </motion.div>
            )}
          </motion.div>
        </motion.header>

        {error && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive-text">
            {error}
          </div>
        )}

        {/* ── 2. Focus row: Continue + Today ──────────────────── */}
        <motion.div
          variants={v}
          className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]"
        >
          <ContinueHero overview={overview} ignite={playing} delayMs={SHOT.hero} igniteMs={SHOT.ignite} />
          <TodayPanel
            today={todayGate ? today : null}
            streak={todayGate ? streak : null}
            {...shot(playing, "cine-rise", SHOT.today)}
          />
        </motion.div>

        {/* ── 3. Pulse row ────────────────────────────────────── */}
        <motion.div variants={v} className="mt-6">
          <Reveal>
            <div
              className={cn("grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-3 sm:gap-6", playing && "cine-cascade")}
              style={pulse.style}
            >
              <ReviewPulse review={review} />
              <LevelPulse xp={user.xp} />
              <LeaguePulse />
            </div>
          </Reveal>
        </motion.div>

        {/* Phones: the tips live here, under the stats (the header has no room). */}
        {overview && (
          <motion.div variants={v} className="mt-6 md:hidden">
            <div {...shot(playing, "cine-rise", SHOT.phoneMascot)}>
              <MascotTips
                key={domainSlug ?? "generic"}
                domainSlug={domainSlug}
                domainName={domainName}
                size={64}
                className="w-full"
                bubbleClassName="mb-3 min-w-0 flex-1 max-w-none"
              />
            </div>
          </motion.div>
        )}

        {/* ── 4. Explore ──────────────────────────────────────── */}
        <motion.section variants={v} aria-labelledby="explore-h" className="mt-12">
          <div {...shot(playing, "cine-rise", SHOT.explore)}>
            <RevealHeading id="explore-h" lead="More to" accent="explore" />
            <Reveal>
              <ExploreTabs tabs={tabs} />
            </Reveal>
          </div>
        </motion.section>

        {/* ── Arsenal door ───────────────────────────────────── */}
        <motion.div variants={v} className="mt-10">
          <Reveal>
            <div {...shot(playing, "cine-rise", SHOT.arsenal)}>
              <ArsenalStrip />
            </div>
          </Reveal>
        </motion.div>
      </motion.main>
    </div>
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
