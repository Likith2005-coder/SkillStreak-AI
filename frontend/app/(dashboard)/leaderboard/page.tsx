"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "next-view-transitions";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Crown, Gem, Trophy } from "lucide-react";
import {
  apiErrorMessage,
  fetchLeaderboard,
  type LeaderboardEntry,
} from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Whole days until the weekly reset (Monday 00:00 UTC). */
function daysUntilReset(now = new Date()): number {
  const day = now.getUTCDay(); // 0 = Sunday
  const untilMonday = (8 - day) % 7 || 7;
  return untilMonday;
}

export default function LeaderboardPage() {
  const me = useUserStore((s) => s.user);
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetIn, setResetIn] = useState<number | null>(null);

  useEffect(() => {
    setResetIn(daysUntilReset());
    let cancelled = false;
    fetchLeaderboard()
      .then((d) => {
        if (cancelled) return;
        setEntries(d.entries);
        setMyEntry(d.me ?? null);
      })
      .catch((err) => !cancelled && setError(apiErrorMessage(err, "Could not load leaderboard")));
    return () => {
      cancelled = true;
    };
  }, []);

  const podium = entries?.slice(0, 3) ?? [];
  const rest = entries?.slice(3) ?? [];
  // The API only returns the top 10; pin the viewer's own standing beneath
  // the list when they rank outside it.
  const pinnedMe =
    myEntry && entries && !entries.some((e) => e.userId === myEntry.userId) ? myEntry : null;

  return (
    <main className="container max-w-3xl px-4 py-8">
      <Link
        href="/dashboard"
        className="focus-ring inline-flex min-h-[44px] items-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to dashboard
      </Link>

      {/* League header: a dark panel lit from above by violet aurora light. */}
      <header
        className="card-chunky spotlight relative mt-3 overflow-hidden px-5 py-7 sm:px-8 sm:py-9"
        style={{ "--spot": "var(--grape)" } as CSSProperties}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_90%_at_30%_-20%,hsl(var(--aurora-1)/0.32),transparent_70%),radial-gradient(ellipse_50%_70%_at_100%_0%,hsl(var(--aurora-2)/0.16),transparent_70%)]" />
          <div className="grid-faint absolute inset-0 opacity-70" />
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <span
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-grape/10 text-grape shadow-[0_0_32px_-6px_hsl(var(--grape)/0.6)] ring-1 ring-grape/30 sm:h-16 sm:w-16"
          >
            <Trophy className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-[clamp(2rem,6vw,3.25rem)] leading-[1.02] text-foreground [text-wrap:balance]">
              Weekly{" "}
              <span className="font-serif-accent text-grape [text-shadow:0_0_28px_hsl(var(--grape)/0.55)]">
                League
              </span>
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              Ranked by XP earned since Monday (UTC).
            </p>
          </div>
        </div>
        {resetIn !== null && (
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-grape" aria-hidden />
            <span className="label-mono">Resets in</span>
            <span className="font-mono font-semibold tabular-nums text-foreground">
              {resetIn} day{resetIn === 1 ? "" : "s"}
            </span>
          </p>
        )}
      </header>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive-text"
        >
          {error}
        </div>
      )}

      <section className="mt-10" aria-label="Rankings">
        {!entries ? (
          !error && <LeaderboardSkeleton />
        ) : entries.length === 0 ? (
          <div className="card-chunky relative flex flex-col items-center overflow-hidden px-6 py-12 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-20 left-1/2 h-48 w-80 -translate-x-1/2 rounded-full bg-xp/15 blur-3xl"
            />
            <span
              aria-hidden
              className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-xp/10 text-xp shadow-[0_0_36px_-6px_hsl(var(--xp)/0.7)] ring-1 ring-xp/30"
            >
              <Crown className="h-8 w-8 drop-shadow-[0_0_10px_hsl(var(--xp)/0.8)]" fill="currentColor" />
            </span>
            <p className="relative mt-6 font-display text-3xl text-foreground [text-wrap:balance]">
              The crown is <span className="font-serif-accent text-xp">up for grabs</span>
            </p>
            <p className="relative mt-3 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
              Nobody has scored this week. Finish a topic (+10 XP) or ace a quiz (up to +25 XP)
              and you take rank #1 instantly.
            </p>
            <Button asChild size="lg" className="relative mt-7">
              <Link href="/domains">Start a topic</Link>
            </Button>
          </div>
        ) : (
          <>
            <Podium entries={podium} meId={me?.id} />
            {rest.length > 0 && (
              <ol className="card-chunky mt-8 overflow-hidden p-1.5" aria-label="Everyone else">
                {rest.map((e, i) => (
                  <Row key={e.userId} entry={e} index={i} isMe={e.userId === me?.id} />
                ))}
              </ol>
            )}
            {pinnedMe && (
              <ol className="card-chunky mt-3 overflow-hidden p-1.5" aria-label="Your rank">
                <Row entry={pinnedMe} index={rest.length} isMe pinned />
              </ol>
            )}
          </>
        )}
      </section>
    </main>
  );
}

/* ── Podium: top three, crowned ───────────────────────────── */

// Medal light per place, as raw HSL channels so it can feed glows and gradients.
const PLACE = {
  1: { hsl: "var(--xp)", block: "h-32 sm:h-40", avatar: "h-16 w-16 text-2xl sm:h-20 sm:w-20 sm:text-3xl", crown: "h-8 w-8 sm:h-9 sm:w-9" },
  2: { hsl: "220 18% 80%", block: "h-24 sm:h-28", avatar: "h-14 w-14 text-xl sm:h-16 sm:w-16 sm:text-2xl", crown: "h-6 w-6 sm:h-7 sm:w-7" },
  3: { hsl: "26 70% 62%", block: "h-16 sm:h-20", avatar: "h-14 w-14 text-xl sm:h-16 sm:w-16 sm:text-2xl", crown: "h-6 w-6 sm:h-7 sm:w-7" },
} as const;

function Podium({ entries, meId }: { entries: LeaderboardEntry[]; meId?: string }) {
  const reduce = useReducedMotionSafe();
  // Visual order: 2nd, 1st, 3rd — the winner stands in the middle.
  const order = [entries[1], entries[0], entries[2]].filter(Boolean) as LeaderboardEntry[];

  return (
    <div className="relative">
      {/* A pool of light the podium stands in. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-40 max-w-lg rounded-full bg-aurora-1/15 blur-3xl"
      />
      <ol className="relative grid grid-cols-3 items-end gap-2 sm:gap-4" aria-label="Top three">
        {order.map((e) => {
          const rank = Math.min(Math.max(e.rank, 1), 3) as 1 | 2 | 3;
          const p = PLACE[rank];
          const c = `hsl(${p.hsl})`;
          const glow = (a: number) => `hsl(${p.hsl} / ${a})`;
          const isMe = e.userId === meId;
          // Grid placement keeps 2-1-3 even when fewer than three people scored.
          const col = rank === 1 ? "col-start-2" : rank === 2 ? "col-start-1" : "col-start-3";
          return (
            <li key={e.userId} className={cn("row-start-1 flex min-w-0 flex-col items-center", col)}>
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 18, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18, delay: reduce ? 0 : 0.35 + (3 - rank) * 0.12 }}
                className="flex w-full min-w-0 flex-col items-center"
              >
                <Crown
                  className={p.crown}
                  style={{ color: c, filter: `drop-shadow(0 0 10px ${glow(0.8)})` }}
                  fill="currentColor"
                  aria-hidden
                />
                <span
                  className={cn("mt-1.5 flex items-center justify-center rounded-full bg-card font-display", p.avatar)}
                  style={{
                    color: c,
                    boxShadow: isMe
                      ? `0 0 0 2px hsl(var(--secondary)), 0 0 0 5px hsl(var(--background)), 0 0 0 6px ${glow(0.6)}, 0 0 36px -4px hsl(var(--secondary) / 0.7)`
                      : `0 0 0 2px ${glow(0.85)}, 0 0 32px -4px ${glow(rank === 1 ? 0.75 : 0.5)}, inset 0 0 18px ${glow(0.18)}`,
                  }}
                  aria-hidden
                >
                  {e.name.charAt(0).toUpperCase()}
                </span>
                <span className="mt-3 w-full truncate text-center text-sm font-semibold text-foreground sm:text-base">
                  {e.name}
                  {isMe && <span className="sr-only"> (you)</span>}
                </span>
                <span className="mt-0.5 flex items-center gap-1 font-mono text-[13px] font-semibold tabular-nums text-xp">
                  <Gem className="h-3.5 w-3.5" aria-hidden />
                  {e.xpThisWeek.toLocaleString()} XP
                </span>
                {isMe && (
                  <span className="mt-1.5 rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary">
                    You
                  </span>
                )}
              </motion.div>
              {/* Pedestal: rises from the floor, lit along its top edge. */}
              <motion.div
                initial={reduce ? false : { scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : (3 - rank) * 0.1, ease: EASE }}
                className={cn(
                  "relative mt-4 flex w-full origin-bottom items-start justify-center overflow-hidden rounded-t-xl border border-b-0 pt-3",
                  p.block,
                )}
                style={{
                  borderColor: glow(0.3),
                  background: `linear-gradient(180deg, ${glow(0.16)}, ${glow(0.03)} 60%, transparent), hsl(var(--card))`,
                  boxShadow: `inset 0 1px 0 ${glow(0.7)}, 0 -12px 40px -16px ${glow(0.6)}`,
                }}
              >
                <span
                  className="font-display text-4xl leading-none tabular-nums sm:text-5xl"
                  style={{ color: c, textShadow: `0 0 24px ${glow(0.6)}` }}
                  aria-label={`Rank ${e.rank}`}
                >
                  {e.rank}
                </span>
              </motion.div>
            </li>
          );
        })}
      </ol>
      {/* The floor line the pedestals stand on. */}
      <div aria-hidden className="relative h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

/* ── Rows: rank 4 and below ───────────────────────────────── */

function Row({
  entry,
  index,
  isMe,
  pinned = false,
}: {
  entry: LeaderboardEntry;
  index: number;
  isMe: boolean;
  /** Viewer's own entry pinned below the top 10. */
  pinned?: boolean;
}) {
  const reduce = useReducedMotionSafe();
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.35, delay: reduce ? 0 : 0.5 + index * 0.04, ease: EASE }}
      className="border-t border-white/[0.06] first:border-t-0"
    >
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-3 transition-colors sm:gap-4 sm:px-4",
          isMe
            ? "bg-secondary/10 shadow-[inset_0_0_0_1px_hsl(var(--secondary)/0.45),0_0_32px_-10px_hsl(var(--secondary)/0.6)]"
            : "hover:bg-white/[0.03]",
        )}
      >
        <span
          className={cn(
            "w-7 shrink-0 text-center font-mono text-sm font-semibold tabular-nums",
            isMe ? "text-secondary" : "text-muted-foreground",
          )}
        >
          {entry.rank}
        </span>
        <span
          aria-hidden
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-semibold",
            isMe
              ? "bg-secondary text-secondary-foreground shadow-[0_0_18px_-2px_hsl(var(--secondary)/0.7)]"
              : "bg-grape/10 text-grape ring-1 ring-grape/20",
          )}
        >
          {entry.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[15px] font-semibold text-foreground">{entry.name}</span>
            {isMe && (
              <span className="shrink-0 rounded-full border border-secondary/30 bg-secondary/15 px-2 py-0.5 text-[11px] font-medium text-secondary">
                {pinned ? `You · #${entry.rank.toLocaleString()}` : "You"}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Level {entry.level} · <span className="tabular-nums">{entry.xpTotal.toLocaleString()}</span> XP total
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 font-mono text-sm font-semibold tabular-nums text-xp">
          <Gem className="h-3.5 w-3.5" aria-hidden />
          {entry.xpThisWeek.toLocaleString()} XP
        </span>
      </div>
    </motion.li>
  );
}

function LeaderboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading rankings">
      <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
        {["h-24", "h-32", "h-16"].map((h, i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <div className="h-16 w-16 animate-pulse rounded-full bg-white/[0.05] motion-reduce:animate-none" />
            <div className={cn("w-full animate-pulse rounded-t-xl bg-white/[0.04] motion-reduce:animate-none", h)} />
          </div>
        ))}
      </div>
      <div className="card-chunky mt-8 space-y-1 p-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.03] motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  );
}
