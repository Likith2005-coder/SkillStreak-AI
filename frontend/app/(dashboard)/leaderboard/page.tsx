"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, Loader2, Sparkles, Trophy } from "lucide-react";
import {
  apiErrorMessage,
  fetchLeaderboard,
  type LeaderboardEntry,
} from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { PageHero } from "@/components/shared/PageHero";
import { cn } from "@/lib/utils";

export default function LeaderboardPage() {
  const me = useUserStore((s) => s.user);
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLeaderboard()
      .then((d) => !cancelled && setEntries(d))
      .catch((err) => !cancelled && setError(apiErrorMessage(err, "Could not load leaderboard")));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="container max-w-2xl px-4 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <PageHero
        className="mt-4"
        eyebrow="This week's top learners"
        icon={<Sparkles className="h-3.5 w-3.5 text-primary" />}
        title={<span className="gradient-text">Leaderboard</span>}
        subtitle="Ranked by XP earned since Monday (UTC). Resets every week."
        ghost="RANK"
      />

      {error && (
        <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <section className="mt-6">
        {!entries ? (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center">
            <Trophy className="mx-auto h-8 w-8 text-amber-400/70" />
            <p className="mt-3 text-sm font-medium text-foreground">
              Nobody has scored this week — the crown is up for grabs.
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Finish a topic (+10 XP) or ace a quiz (up to +25 XP) and you take
              rank #1 instantly.
            </p>
            <Link
              href="/domains"
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Start a topic
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {entries.map((e, i) => (
              <Row key={e.userId} entry={e} index={i} isMe={e.userId === me?.id} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Row({ entry, index, isMe }: { entry: LeaderboardEntry; index: number; isMe: boolean }) {
  const podium =
    entry.rank === 1
      ? "border-amber-500/40 bg-amber-500/10"
      : entry.rank === 2
        ? "border-slate-400/40 bg-slate-400/10"
        : entry.rank === 3
          ? "border-orange-700/40 bg-orange-700/10"
          : "border-border bg-card/40";

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <div
        className={cn(
          "flex items-center gap-4 rounded-2xl border p-4 backdrop-blur",
          podium,
          isMe && "ring-1 ring-inset ring-primary/40"
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card/70 text-sm font-semibold tabular-nums">
          {entry.rank === 1 ? <Crown className="h-5 w-5 text-amber-300" /> : entry.rank}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">{entry.name}</span>
            {isMe && (
              <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                You
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Trophy className="h-3 w-3 text-amber-400" />
            Lvl {entry.level} · {entry.xpTotal.toLocaleString()} XP total
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-semibold tabular-nums text-foreground">
            +{entry.xpThisWeek}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            this week
          </div>
        </div>
      </div>
    </motion.li>
  );
}
