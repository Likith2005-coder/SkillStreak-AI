"use client";

/**
 * The pulse row: three quiet, equal cards under the focus row. Each shares
 * one rhythm: an icon well + mono title, one big number with a short line
 * under it, and a 44px footer (an action or a meter) pinned to the floor so
 * the three line up whatever their content. One meaning and one colour each:
 * mistakes are red, level is violet, the league is gold.
 */

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "next-view-transitions";
import { ArrowRight, CheckCheck, ChevronRight, Crown, Gem, RotateCcw, Star } from "lucide-react";
import { fetchLeaderboard, type LeaderboardEntry, type ReviewList } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { levelForXp } from "@/lib/level";
import { useCountUp } from "@/hooks/useCountUp";
import { Flare } from "@/components/dashboard/cinema";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/utils";

const LIFT = { type: "spring", stiffness: 400, damping: 28 } as const;
const REVIEW_XP = 5;

/* ── Shared shell ─────────────────────────────────────────── */

function PulseCard({
  id,
  icon,
  well,
  title,
  titleClass,
  spot,
  aside,
  children,
  footer,
}: {
  id: string;
  icon: ReactNode;
  /** Tailwind classes for the icon well (tint + ring + text colour). */
  well: string;
  title: string;
  titleClass: string;
  /** CSS custom property for the spotlight colour, e.g. "var(--grape)". */
  spot: string;
  aside?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}) {
  const reduce = useReducedMotionSafe();
  return (
    <motion.section
      aria-labelledby={id}
      whileHover={reduce ? undefined : { y: -3 }}
      transition={LIFT}
      className="card-chunky spotlight flex h-full min-w-0 flex-col p-5"
      style={{ ["--spot" as string]: spot }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1", well)}>
            {icon}
          </span>
          <h2 id={id} className={cn("label-mono truncate", titleClass)}>
            {title}
          </h2>
        </div>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
      <div aria-hidden className="min-h-4 flex-1" />
      <div className="flex min-h-[44px] items-center">{footer}</div>
    </motion.section>
  );
}

function SkeletonPulse() {
  return <div aria-hidden className="card-chunky h-full min-h-[212px] animate-pulse motion-reduce:animate-none" />;
}

/* ── Mistake review ───────────────────────────────────────── */

export function ReviewPulse({ review }: { review: ReviewList | null }) {
  const count = useCountUp(review?.total ?? 0, 900);
  if (!review) return <SkeletonPulse />;

  if (review.total === 0) {
    return (
      <PulseCard
        id="review-h"
        icon={<CheckCheck className="h-[18px] w-[18px]" />}
        well="bg-primary/10 text-primary ring-primary/25"
        title="Mistake review"
        titleClass="text-muted-foreground"
        spot="var(--primary)"
        footer={
          <p className="text-[13px] leading-snug text-muted-foreground">
            Quiz misses land here for a second shot, +{REVIEW_XP} XP each.
          </p>
        }
      >
        <p className="font-display text-[1.75rem] leading-none text-foreground">
          Clean <span className="font-serif-accent text-primary">slate</span>.
        </p>
        <p className="mt-2 text-[13px] text-muted-foreground">Nothing to fix right now.</p>
      </PulseCard>
    );
  }

  const topics = new Set(review.items.map((it) => it.topicId)).size;
  return (
    <PulseCard
      id="review-h"
      icon={<RotateCcw className="h-[18px] w-[18px]" strokeWidth={2.2} />}
      well="bg-destructive/10 text-destructive-text ring-destructive/25"
      title="Mistake review"
      titleClass="text-destructive-text"
      spot="var(--destructive)"
      aside={
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-xp/25 bg-xp/10 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-xp">
          <Gem className="h-3 w-3" aria-hidden /> +{review.total * REVIEW_XP}
          <span className="sr-only"> XP on offer</span>
        </span>
      }
      footer={
        <Button asChild className="w-full">
          <Link href="/review">
            Review now <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </Button>
      }
    >
      <p className="flex items-baseline gap-2">
        <span className="font-display text-[2.5rem] tabular-nums leading-none text-foreground">
          <Flare shown={count} target={review.total} color="var(--grape)">
            {count}
          </Flare>
        </span>
        <span className="text-sm font-medium text-foreground">
          question{review.total === 1 ? "" : "s"} to fix
        </span>
      </p>
      <p className="mt-2 truncate text-[13px] text-muted-foreground">
        From {topics} topic{topics === 1 ? "" : "s"}. Fix them while they&apos;re fresh.
      </p>
    </PulseCard>
  );
}

/* ── Level ────────────────────────────────────────────────── */

export function LevelPulse({ xp }: { xp: number }) {
  const reduce = useReducedMotionSafe();
  const { level, into, span, nextAt } = levelForXp(xp);
  const pct = span > 0 ? Math.min(100, (into / span) * 100) : 0;
  const shownXp = useCountUp(xp, 1000);
  const toGo = Math.max(0, span - into);
  return (
    <PulseCard
      id="level-h"
      icon={<Star className="h-[18px] w-[18px]" fill="currentColor" strokeWidth={1.5} />}
      well="bg-grape/10 text-grape ring-grape/25"
      title="Level"
      titleClass="text-grape"
      spot="var(--grape)"
      aside={<span className="shrink-0 font-mono text-[11px] text-muted-foreground">Next · L{level + 1}</span>}
      footer={
        <div className="w-full">
          <div
            className="h-2 overflow-hidden rounded-full bg-white/[0.06]"
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${xp} of ${nextAt} XP to level ${level + 1}`}
          >
            <motion.div
              className="h-full origin-left rounded-full bg-grape shadow-[0_0_12px_hsl(var(--grape)/0.7)]"
              initial={reduce ? false : { scaleX: 0 }}
              animate={{ scaleX: Math.max(pct, 2) / 100 }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 90, damping: 18, delay: 0.3 }}
            />
          </div>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">{toGo.toLocaleString()} XP</span> to Level{" "}
            {level + 1}
          </p>
        </div>
      }
    >
      <p className="flex items-baseline gap-2">
        <span className="font-display text-[2.5rem] tabular-nums leading-none text-foreground">{level}</span>
        <span className="text-sm font-medium text-foreground">
          <span className="tabular-nums">{shownXp.toLocaleString()}</span> XP total
        </span>
      </p>
      <p className="mt-2 truncate text-[13px] text-muted-foreground">
        {into.toLocaleString()} / {span.toLocaleString()} XP into this level.
      </p>
    </PulseCard>
  );
}

/* ── League ───────────────────────────────────────────────── */

export function LeaguePulse() {
  const me = useUserStore((s) => s.user);
  const [top, setTop] = useState<LeaderboardEntry[] | null>(null);
  const [mine, setMine] = useState<LeaderboardEntry | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchLeaderboard()
      .then((r) => {
        if (cancelled) return;
        setTop(r.entries.slice(0, 3));
        setMine(r.me ?? r.entries.find((e) => e.userId === me?.id) ?? null);
      })
      .catch(() => !cancelled && setTop([]));
    return () => {
      cancelled = true;
    };
  }, [me?.id]);
  const rank = useCountUp(mine?.rank ?? 0, 900);

  if (top === null) return <SkeletonPulse />;
  const medal = ["ring-xp/60 text-xp", "ring-white/30 text-foreground/80", "ring-energy/50 text-energy"];

  return (
    <PulseCard
      id="league-h"
      icon={<Crown className="h-[18px] w-[18px]" fill="currentColor" strokeWidth={1.5} />}
      well="bg-xp/10 text-xp ring-xp/25"
      title="This week's league"
      titleClass="text-xp"
      spot="var(--xp)"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          {top.length > 0 ? (
            <ol className="flex min-w-0 items-center" aria-label="Top three this week">
              {top.map((r, i) => (
                <li
                  key={r.userId}
                  title={`#${i + 1} ${r.name} · ${r.xpThisWeek} XP`}
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-card text-xs font-semibold ring-2",
                    i > 0 && "-ml-2",
                    medal[i],
                  )}
                >
                  <span aria-hidden>{r.name.charAt(0).toUpperCase()}</span>
                  <span className="sr-only">
                    {i + 1}. {r.name}, {r.xpThisWeek} XP
                  </span>
                </li>
              ))}
              <li aria-hidden className="ml-2.5 min-w-0 truncate text-xs text-muted-foreground">
                Led by <span className="font-medium text-foreground">{top[0].name.split(" ")[0]}</span>
              </li>
            </ol>
          ) : (
            <span className="text-[13px] text-muted-foreground">No scores yet this week.</span>
          )}
          <Link
            href="/leaderboard"
            className="focus-ring -mr-1 inline-flex min-h-[44px] shrink-0 items-center gap-0.5 rounded-lg px-1 text-sm font-medium text-secondary hover:underline"
          >
            View <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      }
    >
      {mine ? (
        <>
          <p className="flex items-baseline gap-2">
            <span className="font-display text-[2.5rem] tabular-nums leading-none text-foreground">
              <span className="text-muted-foreground">#</span>
              <Flare shown={rank} target={mine.rank} color="var(--xp)">
                {rank}
              </Flare>
            </span>
            <span className="text-sm font-medium text-foreground">your rank</span>
          </p>
          <p className="mt-2 truncate text-[13px] text-muted-foreground">
            <span className="font-mono font-semibold text-xp">{mine.xpThisWeek.toLocaleString()} XP</span> earned this
            week.
          </p>
        </>
      ) : (
        <>
          <p className="font-display text-[1.75rem] leading-none text-foreground">Unranked</p>
          <p className="mt-2 truncate text-[13px] text-muted-foreground">Earn any XP this week to join the board.</p>
        </>
      )}
    </PulseCard>
  );
}
