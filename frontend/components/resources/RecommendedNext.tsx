"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles, Target, Zap } from "lucide-react";
import {
  apiErrorMessage,
  fetchRecommendations,
  type RecommendedTopic,
} from "@/lib/api";
import { DomainIcon } from "@/components/shared/DomainIcon";
import { hexFor, styleFor } from "@/lib/domain-style";
import { cn } from "@/lib/utils";

/**
 * "Up Next" — the recommendation band. The top pick gets a featured hero
 * card that actually sells the topic: what it is (summary), why it's here
 * (embedding match %), and what it pays (real XP amounts from the backend:
 * 10 for the topic, up to 25 for a perfect quiz). The rest queue up beside
 * it as numbered rows, playlist-style.
 */
export function RecommendedNext() {
  const [items, setItems] = useState<RecommendedTopic[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRecommendations(4)
      .then((d) => !cancelled && setItems(d))
      .catch((err) => !cancelled && setError(apiErrorMessage(err, "Recommendations unavailable")));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return null; // silently hide on error; recs are non-essential
  }

  const personalized = items?.[0]?.reason === "personalized";

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          Up next for you
        </h3>
        {personalized && (
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
            Personalized
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {personalized
          ? "Closest topics to what you've already learned, by embedding similarity."
          : "Foundations to start with."}
      </p>

      {!items ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_1fr]">
          <div className="h-56 animate-pulse rounded-xl border border-border bg-card/30" />
          <div className="grid gap-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-card/30" />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-card/30 p-4 text-center text-xs text-muted-foreground">
          You're all caught up. 🏁
        </div>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_1fr]">
          <HeroPick item={items[0]} />
          {items.length > 1 && (
            <ul className="grid content-start gap-2.5">
              {items.slice(1).map((it, i) => (
                <QueueRow key={it.topicId} item={it} index={i + 1} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Featured card for the #1 pick — summary, match %, XP bounty, big CTA. */
function HeroPick({ item }: { item: RecommendedTopic }) {
  const s = styleFor(item.domain.color);
  const [hexFrom, hexTo] = hexFor(item.domain.color);
  const match =
    item.reason === "personalized" && item.similarity > 0
      ? Math.round(item.similarity * 100)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        href={`/topic/${item.topicId}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-white/10 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${hexFrom}1f, transparent 55%), linear-gradient(to bottom right, ${hexTo}0d, transparent)`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
      >
        {/* accent bloom in the corner */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full blur-3xl transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: `${hexFrom}2e`, opacity: 0.7 }}
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                style={{ background: hexFrom }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ background: hexFrom }}
              />
            </span>
            Up next
          </div>
          {match !== null && (
            <span
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums"
              style={{
                borderColor: `${hexFrom}4d`,
                background: `${hexFrom}1a`,
                color: hexFrom,
              }}
            >
              <Target className="h-3 w-3" />
              {match}% match
            </span>
          )}
        </div>

        <div className="relative mt-4 flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-110",
              s.iconBg
            )}
          >
            <DomainIcon name={item.domain.icon} className={cn("h-6 w-6", s.text)} />
          </div>
          <div className="min-w-0">
            <div className={cn("text-[10px] uppercase tracking-wider", s.text)}>
              {item.domain.name} · {item.phase}
            </div>
            <div className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">
              {item.title}
            </div>
          </div>
        </div>

        {item.summary && (
          <p className="relative mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {item.summary}
          </p>
        )}

        <div className="relative mt-auto flex items-center justify-between gap-3 pt-4">
          {/* real numbers: topic_complete 10 XP + quiz_perfect 25 XP */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
            <Zap className="h-3.5 w-3.5" />
            Up to 35 XP
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform duration-300 group-hover:translate-x-0.5",
              s.gradientFrom,
              s.gradientTo
            )}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Start topic
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

/** Compact numbered row for queue positions 2+. */
function QueueRow({ item, index }: { item: RecommendedTopic; index: number }) {
  const s = styleFor(item.domain.color);
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <Link
        href={`/topic/${item.topicId}`}
        className="group relative flex items-center gap-3.5 overflow-hidden rounded-xl border border-border bg-card/50 p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-lg hover:shadow-primary/10"
      >
        {/* queue number — gives the list a "next up" playlist feel */}
        <span className="font-mono text-lg font-bold tabular-nums text-muted-foreground/30 transition-colors group-hover:text-primary/60">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-white/5 transition-transform duration-300 group-hover:scale-110",
            s.iconBg
          )}
        >
          <DomainIcon name={item.domain.icon} className={cn("h-4.5 w-4.5", s.text)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn("text-[10px] uppercase tracking-wider", s.text)}>
            {item.domain.name} · {item.phase}
          </div>
          <div className="mt-0.5 truncate text-sm font-medium text-foreground">
            {item.title}
          </div>
          {item.summary && (
            <div className="mt-0.5 truncate text-xs text-muted-foreground">
              {item.summary}
            </div>
          )}
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 -translate-x-1 text-muted-foreground opacity-50 transition-all duration-300 group-hover:translate-x-0 group-hover:text-primary group-hover:opacity-100" />
      </Link>
    </motion.li>
  );
}
