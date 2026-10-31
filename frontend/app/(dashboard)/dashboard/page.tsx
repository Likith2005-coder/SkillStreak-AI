"use client";

import { useEffect, useState } from "react";
import { Link } from "next-view-transitions";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, BookOpen, Check, Compass, Gem, ListChecks, Map as MapIcon, Sparkles, X } from "lucide-react";
import { PathPreview } from "@/components/playground/PathPreview";
import { Mascot } from "@/components/playground/Mascot";
import { ArsenalCard, LeagueCard, LevelCard, StreakCard } from "@/components/playground/Rail";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { useCountUp } from "@/hooks/useCountUp";
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
import { Button } from "@/components/ui/button";
import { styleFor } from "@/lib/domain-style";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

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

  const totals = overview?.totals;
  const totalPct =
    totals && totals.topicsAvailable > 0
      ? Math.round((totals.topicsCompleted / totals.topicsAvailable) * 100)
      : 0;
  const activeDomains = overview?.perDomain.filter((d) => d.done > 0).length ?? 0;
  const firstName = user.name.split(" ")[0];
  const days = streak?.currentStreak ?? 0;

  const mascotMessage = !overview
    ? undefined
    : !overview.recommended
      ? "Pick a domain and I'll walk the path with you."
      : totals && totals.topicsCompleted > 0
        ? `${totals.topicsCompleted} down. Ready for the next one?`
        : "Every expert started at node one. Let's go!";

  // A short, tight entrance: this is the most-visited screen, so it settles
  // in about half a second. Content is visible from the first frame under
  // reduced motion.
  const rise = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.35, delay: 0.04 * i, ease: EASE },
        };

  const today = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  return (
    <main className="container px-4 pb-16 pt-8 lg:pt-12">
      {/* ── Cinematic welcome ─────────────────────────────── */}
      <motion.header {...rise(0)} className="relative isolate flex items-end justify-between gap-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-40 -z-10 h-[26rem] w-[44rem] max-w-[100vw] rounded-full bg-[radial-gradient(closest-side,hsl(var(--aurora-1)/0.18),hsl(var(--aurora-2)/0.06)_60%,transparent)] blur-2xl"
        />
        <div className="min-w-0">
          <p className="label-mono flex items-center gap-2 text-muted-foreground">
            <span aria-hidden className="relative flex h-2 w-2">
              {!reduce && (
                <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-60" />
              )}
              <span className="relative h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
            </span>
            {today}
            {days > 0 && <span className="text-energy">· Day {days}</span>}
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.6rem,7vw,5.25rem)] leading-[0.95] text-foreground [text-wrap:balance]">
            Welcome back,{" "}
            <span className="font-serif-accent text-primary text-glow">{firstName}</span>
            <span className="text-primary">.</span>
          </h1>
          <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-muted-foreground sm:text-[17px]">
            {overview
              ? totals && totals.topicsCompleted > 0
                ? `${totals.topicsCompleted} of ${totals.topicsAvailable} topics cleared across ${activeDomains} domain${activeDomains === 1 ? "" : "s"}. Your next unit is lined up.`
                : "Your path is lined up. One topic today starts the streak."
              : "Loading your path…"}
          </p>
        </div>
        {mascotMessage && (
          <div className="hidden shrink-0 lg:block">
            <Mascot message={mascotMessage} size={104} side="left" />
          </div>
        )}
      </motion.header>

      <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Centre column ─────────────────────────────────── */}
        <div className="min-w-0 space-y-6">
          {/* THE hero: the continue unit, with the luminous path beside it. */}
          <motion.section {...rise(1)} aria-label="Continue learning">
            <div className="card-chunky border-beam">
              {/* Aurora light pool, clipped inside the panel (the panel itself
                  can't clip: the border beam lives just outside its edge). */}
              <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <div className="absolute -bottom-32 -left-24 h-80 w-[30rem] rounded-full bg-[radial-gradient(closest-side,hsl(var(--aurora-4)/0.16),transparent)] blur-2xl" />
                <div className="absolute -right-20 -top-28 h-80 w-[28rem] rounded-full bg-[radial-gradient(closest-side,hsl(var(--aurora-1)/0.2),transparent)] blur-2xl" />
                <div className="grid-faint absolute inset-0 opacity-60" />
              </div>

              <div className="relative grid grid-cols-[minmax(0,1fr)] gap-2 xl:grid-cols-[minmax(0,1fr)_400px]">
                <div className="flex flex-col p-6 sm:p-8">
                  {overview?.recommended ? (
                    <>
                      <p className="label-mono flex items-center gap-2 text-primary">
                        <MapIcon className="h-3.5 w-3.5" aria-hidden />
                        {overview.recommended.domain.name} · Next up
                      </p>
                      <h2 className="mt-3 font-display text-3xl leading-[1.05] text-foreground sm:text-4xl xl:text-[2.75rem] [text-wrap:balance]">
                        {overview.recommended.topicTitle}
                      </h2>
                      <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground">
                        Read the lesson, ask the tutor anything, then lock it in with a five-question quiz.
                      </p>
                      <div className="mt-7 flex flex-wrap items-center gap-3">
                        <Button asChild size="lg" className="h-[3.25rem] px-8 text-base">
                          <Link href={`/topic/${overview.recommended.topicId}`}>
                            Continue <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.5} />
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                          <Link href={`/domains/${overview.recommended.domain.slug}`}>View roadmap</Link>
                        </Button>
                      </div>
                      {/* The unit loop: what "Continue" actually involves. */}
                      <ol aria-label="This unit" className="mt-8 hidden flex-wrap items-center gap-2 sm:flex">
                        {[
                          { icon: BookOpen, label: "Lesson" },
                          { icon: Sparkles, label: "Ask the tutor" },
                          { icon: ListChecks, label: "Quiz" },
                        ].map((step, i) => (
                          <li key={step.label} className="flex items-center gap-2">
                            {i > 0 && <span aria-hidden className="h-px w-5 bg-white/15" />}
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-muted-foreground">
                              <step.icon className="h-3.5 w-3.5 text-foreground/80" aria-hidden />
                              {step.label}
                            </span>
                          </li>
                        ))}
                        <li className="flex items-center gap-2">
                          <span aria-hidden className="h-px w-5 bg-white/15" />
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-xp/25 bg-xp/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-xp">
                            <Gem className="h-3.5 w-3.5" aria-hidden /> +35 XP
                          </span>
                        </li>
                      </ol>
                    </>
                  ) : overview ? (
                    <>
                      <p className="label-mono flex items-center gap-2 text-primary">
                        <Compass className="h-3.5 w-3.5" aria-hidden /> Start here
                      </p>
                      <h2 className="mt-3 font-display text-3xl leading-[1.05] text-foreground sm:text-4xl [text-wrap:balance]">
                        Pick a domain and start your{" "}
                        <span className="font-serif-accent text-primary">first streak</span>.
                      </h2>
                      <div className="mt-7">
                        <Button asChild size="lg" className="h-[3.25rem] px-8 text-base">
                          <Link href="/domains">
                            Browse domains <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.5} />
                          </Link>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div aria-hidden className="space-y-3">
                      <div className="h-3 w-40 animate-pulse rounded bg-white/[0.06] motion-reduce:animate-none" />
                      <div className="h-10 w-4/5 animate-pulse rounded-lg bg-white/[0.06] motion-reduce:animate-none" />
                      <div className="h-10 w-3/5 animate-pulse rounded-lg bg-white/[0.06] motion-reduce:animate-none" />
                      <div className="!mt-7 h-[3.25rem] w-44 animate-pulse rounded-xl bg-white/[0.06] motion-reduce:animate-none" />
                    </div>
                  )}

                  <HeroStats
                    pct={totalPct}
                    done={totals?.topicsCompleted ?? 0}
                    quizzes={totals?.attempts ?? 0}
                  />
                </div>

                {overview?.recommended && (
                  <div className="border-t border-white/[0.06] px-4 pb-6 pt-4 xl:border-l xl:border-t-0 xl:py-6">
                    <PathPreview
                      slug={overview.recommended.domain.slug}
                      currentTopicId={overview.recommended.topicId}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive-text">
              {error}
            </div>
          )}

          {/* Recommended next */}
          <motion.section {...rise(2)}>
            <RecommendedNext />
          </motion.section>

        </div>

        {/* ── Right rail: instrument panels ─────────────────── */}
        <motion.aside
          {...(reduce
            ? {}
            : {
                initial: { opacity: 0, x: 10 },
                animate: { opacity: 1, x: 0 },
                transition: { duration: 0.35, delay: 0.08, ease: EASE },
              })}
          className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start"
          aria-label="Your stats"
        >
          <StreakCard streak={streak} />
          <LevelCard xp={user.xp} />
          <LeagueCard />
          <ArsenalCard />
        </motion.aside>
      </div>

      {/* ── Full width: domain dock, recent quizzes, badges ── */}
      <div className="mt-10 space-y-10">
      {/* Domain progress */}
      <motion.section {...rise(3)} aria-labelledby="domains-h">
        <SectionHead id="domains-h" title="Your domains">
          <Link
            href="/progress"
            className="focus-ring inline-flex min-h-[44px] items-center gap-1.5 rounded-lg text-sm font-medium text-secondary hover:underline"
          >
            <BarChart3 className="h-4 w-4" aria-hidden />
            All stats
          </Link>
        </SectionHead>
        {overview ? (
          reduce ? (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {overview.perDomain.map((tile, i) => (
                <DomainProgressRing key={tile.slug} tile={tile} index={i} />
              ))}
            </div>
          ) : (
            <>
              {/* Desktop: magnetic dock — bars magnify near the cursor,
                  click one to expand its detail card. It needs a cursor and
                  the full page width, so it lives outside the rail grid. */}
              <div className="hidden lg:block">
                <MagneticDomainDock tiles={overview.perDomain} />
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:hidden">
                {overview.perDomain.map((tile, i) => (
                  <DomainProgressRing key={tile.slug} tile={tile} index={i} />
                ))}
              </div>
            </>
          )
        ) : (
          <SkeletonGrid />
        )}
      </motion.section>

      {/* Recent + weak areas: a wide list beside a narrower card. */}
      <motion.section {...rise(4)} className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <SectionHead title="Recent quizzes" />
          {overview ? (
            <RecentAttempts items={overview.recentAttempts} />
          ) : (
            <div className="card-chunky h-[230px] animate-pulse motion-reduce:animate-none" />
          )}
        </div>
        <div className="min-w-0 lg:pt-[60px]">
          {overview && <WeakAreasCard items={overview.weakAreas} attempts={overview.totals.attempts} />}
        </div>
      </motion.section>

      {/* Badges — 3D coverflow trophy case */}
      {badges && (
        <motion.section {...rise(5)} aria-label="Badges">
          <BadgeCoverflow badges={badges} />
        </motion.section>
      )}
      </div>
    </main>
  );
}

function SectionHead({ id, title, children }: { id?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <h2 id={id} className="font-display text-2xl text-foreground">
        {title}
      </h2>
      {children}
    </div>
  );
}

/** Three live readouts that count up when the data lands. */
function HeroStats({ pct, done, quizzes }: { pct: number; done: number; quizzes: number }) {
  const shownPct = useCountUp(pct, 1100);
  const shownDone = useCountUp(done, 1100);
  const shownQuiz = useCountUp(quizzes, 1100);
  const stats = [
    { label: "Complete", value: `${shownPct}%`, lit: true },
    { label: "Topics", value: shownDone.toLocaleString(), lit: false },
    { label: "Quizzes", value: shownQuiz.toLocaleString(), lit: false },
  ];
  return (
    <>
    {/* Spacer: pins the stats to the panel floor when the path beside it is taller. */}
    <div aria-hidden className="min-h-8 flex-1" />
    <dl className="grid grid-cols-3 divide-x divide-white/[0.06] border-t border-white/[0.06] pt-5">
      {stats.map((s, i) => (
        <div key={s.label} className={cn("min-w-0", i > 0 && "pl-4 sm:pl-6")}>
          <dt className="label-mono truncate text-muted-foreground">{s.label}</dt>
          <dd
            className={cn(
              "mt-1.5 font-display text-3xl tabular-nums sm:text-4xl",
              s.lit ? "text-primary text-glow" : "text-foreground",
            )}
          >
            {s.value}
          </dd>
        </div>
      ))}
    </dl>
    </>
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

function RecentAttempts({ items }: { items: RecentAttempt[] }) {
  if (items.length === 0) {
    return (
      <div className="card-chunky flex flex-col items-center px-6 py-10 text-center">
        <span className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-muted-foreground">
          <Check className="h-5 w-5" aria-hidden />
        </span>
        <p className="mt-3 font-display text-lg text-foreground">No quizzes yet</p>
        <p className="mt-1 max-w-[36ch] text-sm leading-relaxed text-muted-foreground">
          Finish a topic and take its quiz to see your scores here.
        </p>
      </div>
    );
  }
  return (
    <ul className="card-chunky divide-y divide-white/[0.06] overflow-hidden p-1.5">
      {items.map((a) => {
        const s = styleFor(a.domain.color);
        return (
          <li key={a.id}>
            <Link
              href={`/topic/${a.topicId}`}
              className="focus-ring group flex min-h-[60px] items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
            >
              <span
                aria-hidden
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1",
                  a.passed
                    ? "bg-primary/10 text-primary ring-primary/25"
                    : "bg-destructive/10 text-destructive-text ring-destructive/25",
                )}
              >
                {a.passed ? <Check className="h-[18px] w-[18px]" strokeWidth={2.5} /> : <X className="h-[18px] w-[18px]" strokeWidth={2.5} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-medium text-foreground">{a.topicTitle}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={cn("truncate font-medium", s.text)}>{a.domain.name}</span>
                  <span aria-hidden>·</span>
                  <span className="shrink-0 font-mono text-[11px]">
                    {new Date(a.attemptedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-xs font-semibold tabular-nums",
                  a.passed
                    ? "border-primary/25 bg-primary/10 text-primary"
                    : "border-destructive/25 bg-destructive/10 text-destructive-text",
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
