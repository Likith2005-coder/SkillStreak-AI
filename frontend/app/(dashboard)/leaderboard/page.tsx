"use client";

import { useEffect, useState } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const [resetIn, setResetIn] = useState<number | null>(null);

  useEffect(() => {
    setResetIn(daysUntilReset());
    let cancelled = false;
    fetchLeaderboard()
      .then((d) => !cancelled && setEntries(d))
      .catch((err) => !cancelled && setError(apiErrorMessage(err, "Could not load leaderboard")));
    return () => {
      cancelled = true;
    };
  }, []);

  const podium = entries?.slice(0, 3) ?? [];
  const rest = entries?.slice(3) ?? [];

  return (
    <main className="container max-w-2xl px-4 py-8">
      <Link
        href="/dashboard"
        className="focus-ring inline-flex min-h-[44px] items-center gap-1.5 rounded-lg text-sm font-extrabold text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={3} />
        Back to dashboard
      </Link>

      {/* League header: the grape slab */}
      <header
        className="mt-3 flex items-center gap-4 rounded-[1.5rem] bg-grape p-5 text-white sm:gap-5 sm:p-6"
        style={{ boxShadow: "0 6px 0 hsl(var(--grape-shade))" }}
      >
        <span
          aria-hidden
          className="flex h-16 w-16 shrink-0 -rotate-6 items-center justify-center rounded-2xl bg-xp-bright sm:h-20 sm:w-20"
          style={{ boxShadow: "0 5px 0 hsl(var(--xp-shade))" }}
        >
          <Trophy className="h-9 w-9 text-white sm:h-11 sm:w-11" strokeWidth={2.6} fill="currentColor" />
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-3xl leading-tight sm:text-4xl">Weekly League</h1>
          <p className="mt-1 text-sm font-bold sm:text-base">
            Ranked by XP earned since Monday (UTC).
          </p>
          {resetIn !== null && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold">
              <Clock className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
              Resets in {resetIn} day{resetIn === 1 ? "" : "s"}
            </p>
          )}
        </div>
      </header>

      {error && (
        <div className="mt-6 rounded-2xl border-2 border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive-text">
          {error}
        </div>
      )}

      <section className="mt-8" aria-label="Rankings">
        {!entries ? (
          !error && <LeaderboardSkeleton />
        ) : entries.length === 0 ? (
          <div className="card-chunky flex flex-col items-center px-6 py-10 text-center">
            <span
              aria-hidden
              className="flex h-16 w-16 rotate-6 items-center justify-center rounded-2xl bg-xp-bright"
              style={{ boxShadow: "0 5px 0 hsl(var(--xp-shade))" }}
            >
              <Crown className="h-9 w-9 text-white" fill="currentColor" />
            </span>
            <p className="mt-5 font-display text-2xl text-foreground [text-wrap:balance]">
              The crown is up for grabs!
            </p>
            <p className="mt-2 max-w-sm text-sm font-semibold text-muted-foreground">
              Nobody has scored this week. Finish a topic (+10 XP) or ace a quiz (up to +25 XP)
              and you take rank #1 instantly.
            </p>
            <Button asChild size="lg" className="mt-6 uppercase">
              <Link href="/domains">Start a topic</Link>
            </Button>
          </div>
        ) : (
          <>
            <Podium entries={podium} meId={me?.id} />
            {rest.length > 0 && (
              <ol className="mt-6 space-y-2.5" aria-label="Everyone else">
                {rest.map((e, i) => (
                  <Row key={e.userId} entry={e} index={i} isMe={e.userId === me?.id} />
                ))}
              </ol>
            )}
          </>
        )}
      </section>
    </main>
  );
}

/* ── Podium: top three, crowned ───────────────────────────── */

const PLACE = {
  1: { crown: "text-xp-bright", face: "bg-xp-bright", edge: "hsl(var(--xp-shade))", block: "h-28 sm:h-32", avatar: "h-16 w-16 text-2xl sm:h-20 sm:w-20 sm:text-3xl" },
  2: { crown: "text-slate-400", face: "bg-slate-400", edge: "hsl(215 16% 47%)", block: "h-20 sm:h-24", avatar: "h-14 w-14 text-xl sm:h-16 sm:w-16 sm:text-2xl" },
  3: { crown: "text-energy-bright", face: "bg-energy-bright", edge: "hsl(var(--energy-shade))", block: "h-14 sm:h-16", avatar: "h-14 w-14 text-xl sm:h-16 sm:w-16 sm:text-2xl" },
} as const;

function Podium({ entries, meId }: { entries: LeaderboardEntry[]; meId?: string }) {
  const reduce = useReducedMotionSafe();
  // Visual order: 2nd, 1st, 3rd — the winner stands in the middle.
  const order = [entries[1], entries[0], entries[2]].filter(Boolean) as LeaderboardEntry[];

  return (
    <ol className="grid grid-cols-3 items-end gap-2 sm:gap-4" aria-label="Top three">
      {order.map((e) => {
        const rank = Math.min(Math.max(e.rank, 1), 3) as 1 | 2 | 3;
        const p = PLACE[rank];
        const isMe = e.userId === meId;
        // Grid placement keeps 2-1-3 even when fewer than three people scored.
        const col = rank === 1 ? "col-start-2" : rank === 2 ? "col-start-1" : "col-start-3";
        return (
          <li key={e.userId} className={cn("row-start-1 flex min-w-0 flex-col items-center", col)}>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 16, delay: reduce ? 0 : 0.1 + (3 - rank) * 0.12 }}
              className="flex w-full min-w-0 flex-col items-center"
            >
              <Crown className={cn("h-7 w-7 sm:h-8 sm:w-8", p.crown)} fill="currentColor" aria-hidden />
              <span
                className={cn(
                  "mt-1 flex items-center justify-center rounded-full border-4 font-black text-white",
                  p.avatar,
                  p.face,
                  isMe ? "border-secondary-bright" : "border-card",
                )}
                style={{ boxShadow: `0 4px 0 ${p.edge}` }}
                aria-hidden
              >
                {e.name.charAt(0).toUpperCase()}
              </span>
              <span className="mt-2 w-full truncate text-center text-sm font-black text-foreground sm:text-base">
                {e.name}
                {isMe && <span className="sr-only"> (you)</span>}
              </span>
              <span className="flex items-center gap-1 text-sm font-black tabular-nums text-xp">
                <Gem className="h-4 w-4" fill="currentColor" aria-hidden />
                {e.xpThisWeek} XP
              </span>
              {isMe && (
                <span className="mt-1 rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-extrabold text-secondary">
                  You
                </span>
              )}
            </motion.div>
            <motion.div
              initial={reduce ? false : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : (3 - rank) * 0.1, ease: EASE }}
              className={cn(
                "mt-3 flex w-full origin-bottom items-start justify-center rounded-t-2xl pt-2 font-display text-3xl text-white sm:text-4xl",
                p.block,
                p.face,
              )}
              style={{ boxShadow: `inset 0 -6px 0 ${p.edge}` }}
            >
              <span aria-label={`Rank ${e.rank}`}>{e.rank}</span>
            </motion.div>
          </li>
        );
      })}
    </ol>
  );
}

/* ── Rows: rank 4 and below ───────────────────────────────── */

function Row({ entry, index, isMe }: { entry: LeaderboardEntry; index: number; isMe: boolean }) {
  const reduce = useReducedMotionSafe();
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : 0.3 + index * 0.04, ease: EASE }}
    >
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border-2 border-b-4 px-4 py-3 sm:gap-4",
          isMe ? "border-secondary-bright bg-secondary/10" : "border-border bg-card",
        )}
      >
        <span className="w-7 shrink-0 text-center text-lg font-black tabular-nums text-muted-foreground">
          {entry.rank}
        </span>
        <span
          aria-hidden
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-black",
            isMe ? "bg-secondary text-white" : "bg-grape/15 text-grape",
          )}
        >
          {entry.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-base font-extrabold text-foreground">{entry.name}</span>
            {isMe && (
              <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-extrabold text-white">
                You
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs font-bold text-muted-foreground">
            Level {entry.level} · {entry.xpTotal.toLocaleString()} XP total
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-base font-black tabular-nums text-xp">
          <Gem className="h-4 w-4" fill="currentColor" aria-hidden />
          {entry.xpThisWeek} XP
        </span>
      </div>
    </motion.li>
  );
}

function LeaderboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading rankings">
      <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
        {["h-20", "h-28", "h-14"].map((h, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
            <div className={cn("w-full animate-pulse rounded-t-2xl bg-muted motion-reduce:animate-none", h)} />
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[70px] animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  );
}
