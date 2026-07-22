"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Flame,
  ListChecks,
  Sparkles,
  Target,
  Terminal,
  Trophy,
} from "lucide-react";
import { TiltCard } from "@/components/landing/TiltCard";
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
import dynamic from "next/dynamic";
import { DomainProgressRing } from "@/components/progress/DomainProgressRing";
import { MagneticDomainDock } from "@/components/progress/MagneticDomainDock";
import { WeakAreasCard } from "@/components/progress/WeakAreasCard";
import { StreakBanner } from "@/components/gamification/StreakBanner";
import { XpBar } from "@/components/gamification/XpBar";
import { BadgeCoverflow } from "@/components/gamification/BadgeCoverflow";
import { RecommendedNext } from "@/components/resources/RecommendedNext";
import { useCountUp } from "@/hooks/useCountUp";

// 3D scene is ~150KB of three.js — lazy-load so the dashboard initial paint
// isn't blocked by it. SSR off because three.js needs a real WebGL context.
const FloatingOrbs = dynamic(
  () => import("@/components/3d/FloatingOrbs").then((m) => m.FloatingOrbs),
  { ssr: false }
);
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

  if (!user || !user.profile) return null;

  const totalPct = overview && overview.totals.topicsAvailable > 0
    ? Math.round((overview.totals.topicsCompleted / overview.totals.topicsAvailable) * 100)
    : 0;

  return (
    <main className="container px-4 py-10">
      {/* Hero with 3D floating orbs */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card/50 p-8 backdrop-blur">
        {/* Signature neon knowledge-grid horizon, same motif as the landing */}
        <div className="grid-scene opacity-60" aria-hidden>
          <div className="grid-floor" />
        </div>
        {/* 3D scene fills the right ~half, fades into the card */}
        <FloatingOrbs className="pointer-events-none absolute inset-0 opacity-90" />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-card/95 via-card/70 to-transparent"
          aria-hidden
        />
        {/* Giant ghost word for that cinematic depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 flex items-center overflow-hidden opacity-40"
        >
          <span className="ghost-word text-[15vw] leading-none lg:text-[8vw]">STREAK</span>
        </div>

        {/* Floating holo-chips drifting over the orbs — the hero's right half
            was dead space; now your live stats hover in it like HUD elements. */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-1/2 lg:block" aria-hidden>
          <FloatChip
            className="right-[30%] top-[16%]"
            delay={0}
            icon={<Trophy className="h-3.5 w-3.5 text-amber-300" />}
            label="Level"
            value={`${user.level}`}
          />
          <FloatChip
            className="right-[8%] top-[42%]"
            delay={1.2}
            icon={<Sparkles className="h-3.5 w-3.5 text-violet-300" />}
            label="Total XP"
            value={`${user.xp}`}
          />
          <FloatChip
            className="right-[34%] top-[66%]"
            delay={0.6}
            icon={<Flame className="h-3.5 w-3.5 text-orange-300" />}
            label="Streak"
            value={`${streak?.currentStreak ?? 0}d`}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.28em] text-primary/70">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Mission control
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
            Welcome back,{" "}
            <span className="gradient-text">{user.name.split(" ")[0]}</span>.
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
        </div>
      </section>

      {/* Featured: Ethical Hacking Arsenal */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="mt-6"
      >
        <Link
          href="/toolkit"
          className="group relative block overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card/60 to-card/60 p-6 backdrop-blur transition-all hover:border-emerald-400/60 hover:shadow-[0_0_40px_-12px_rgba(16,185,129,0.5)]"
        >
          {/* faint code-grid accent on the right */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-[0.15]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(16,185,129,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.5) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
              maskImage: "linear-gradient(to left, #000, transparent)",
              WebkitMaskImage: "linear-gradient(to left, #000, transparent)",
            }}
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                <Terminal className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">Ethical Hacking Arsenal</h2>
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    New
                  </span>
                </div>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  Every phase of a penetration test — recon, scanning, exploitation, post-exploitation
                  — with the real tools and AI-generated, command-packed guides for each. Full hacker
                  terminal inside.
                </p>
              </div>
            </div>
            <Button
              size="lg"
              className="shrink-0 border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
              variant="outline"
            >
              Enter the Arsenal
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </Link>
      </motion.section>

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

      {/* Stat tiles — big accent-lit numerals, same treatment as the landing */}
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <NumberTile
          icon={<Target className="h-4 w-4" />}
          label="Topics completed"
          target={overview?.totals.topicsCompleted ?? 0}
          hint={overview ? `of ${overview.totals.topicsAvailable} · ${totalPct}%` : "loading…"}
          accent={{
            text: "text-cyan-300",
            glow: "0 0 32px rgba(34,211,238,0.45)",
            bg: "from-cyan-500/10",
            chip: "bg-cyan-500/15 text-cyan-300",
          }}
        />
        <NumberTile
          icon={<ListChecks className="h-4 w-4" />}
          label="Recent quiz attempts"
          target={overview?.totals.attempts ?? 0}
          hint="last 5 shown below"
          accent={{
            text: "text-emerald-300",
            glow: "0 0 32px rgba(52,211,153,0.45)",
            bg: "from-emerald-500/10",
            chip: "bg-emerald-500/15 text-emerald-300",
          }}
        />
        <Link href="/leaderboard" className="block">
          <StatTile
            icon={<Trophy className="h-4 w-4" />}
            label="Weekly leaderboard"
            value="View →"
            hint="Top 10 by XP this week"
            /* It's a link, not a metric — keep it a step smaller than the
               numeral tiles so the row reads as one calm hierarchy. */
            valueClassName="text-2xl"
            accent={{
              text: "text-amber-300",
              glow: "0 0 24px rgba(251,191,36,0.4)",
              bg: "from-amber-500/10",
              chip: "bg-amber-500/15 text-amber-300",
            }}
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

      {/* Badges — 3D coverflow trophy case */}
      {badges && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Badges
          </h2>
          <BadgeCoverflow badges={badges} />
        </section>
      )}
    </main>
  );
}

/** Glassy HUD chip that drifts gently over the hero's 3D orbs. */
function FloatChip({
  className,
  delay,
  icon,
  label,
  value,
}: {
  className: string;
  delay: number;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 5.5, ease: "easeInOut", repeat: Infinity, delay }}
      className={cn(
        "absolute flex items-center gap-2.5 rounded-xl border border-white/10 bg-card/60 px-3.5 py-2.5 shadow-xl shadow-black/30 backdrop-blur-md",
        className
      )}
    >
      {icon}
      <div>
        <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        <div className="text-sm font-bold tabular-nums text-foreground">{value}</div>
      </div>
    </motion.div>
  );
}

type TileAccent = {
  /** numeral color class */
  text: string;
  /** numeral text-shadow */
  glow: string;
  /** gradient-from class for the card wash */
  bg: string;
  /** icon chip classes */
  chip: string;
};

function StatTile({
  icon,
  label,
  value,
  hint,
  accent,
  valueClassName = "text-4xl",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  accent: TileAccent;
  valueClassName?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Pointer-reactive 3D tilt + cursor glare — same tactile feel as the
          landing's bento cards. */}
      <TiltCard
        max={7}
        className={cn(
          "group relative rounded-2xl border border-border bg-gradient-to-br via-card/50 to-card/50 p-5 backdrop-blur transition-shadow hover:shadow-lg hover:shadow-primary/10",
          accent.bg
        )}
      >
        <div className="flex items-center gap-2.5 text-xs uppercase tracking-wider text-muted-foreground">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg",
              accent.chip
            )}
          >
            {icon}
          </span>
          {label}
        </div>
        <div
          className={cn(
            "mt-3 font-bold tracking-tight tabular-nums",
            valueClassName,
            accent.text
          )}
          style={{ textShadow: accent.glow }}
        >
          {value}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      </TiltCard>
    </motion.div>
  );
}

function NumberTile({
  icon,
  label,
  target,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  target: number;
  hint: string;
  accent: TileAccent;
}) {
  const display = useCountUp(target, 1100);
  return (
    <StatTile icon={icon} label={label} value={`${display}`} hint={hint} accent={accent} />
  );
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
