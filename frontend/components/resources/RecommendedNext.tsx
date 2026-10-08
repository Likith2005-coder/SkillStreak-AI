"use client";

import { useEffect, useState } from "react";
import { Link } from "next-view-transitions";
import { motion } from "framer-motion";
import { ChevronRight, Gem, Play, Target } from "lucide-react";
import {
  apiErrorMessage,
  fetchRecommendations,
  type RecommendedTopic,
} from "@/lib/api";
import { DomainIcon } from "@/components/shared/DomainIcon";
import { styleFor } from "@/lib/domain-style";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * "Up next" — the recommendation band. The top pick gets a featured chunky
 * card that sells the topic: what it is (summary), why it's here (embedding
 * match %), and what it pays (real XP amounts from the backend: 10 for the
 * topic, up to 25 for a perfect quiz). The rest queue up beside it as
 * pressable rows.
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
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl text-foreground">
          Up next <span className="font-serif-accent text-[1.15em] text-primary">for you</span>
        </h2>
        {personalized && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-grape/25 bg-grape/10 px-2.5 py-0.5 text-xs font-medium text-grape">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-grape shadow-[0_0_6px_hsl(var(--grape))]" />
            Personalized
          </span>
        )}
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        {personalized
          ? "Closest topics to what you've already learned."
          : "Foundations to start with."}
      </p>

      {!items ? (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* minmax(0,...) lets columns shrink below their content width.
              Without it a long truncated title set the track width and pushed
              the whole dashboard to ~760px on phones, zooming the page out. */}
          <div className="card-chunky h-64 animate-pulse motion-reduce:animate-none" />
          <div className="grid gap-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card-chunky h-[72px] animate-pulse motion-reduce:animate-none" />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="card-chunky p-6 text-center">
          <p className="font-display text-lg text-foreground">You&apos;re all caught up</p>
          <p className="mt-1 text-sm text-muted-foreground">
            New recommendations appear as you finish topics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <HeroPick item={items[0]} />
          {items.length > 1 && (
            <ul className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2.5">
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
  const reduce = useReducedMotionSafe();
  const s = styleFor(item.domain.color);
  const match =
    item.reason === "personalized" && item.similarity > 0
      ? Math.round(item.similarity * 100)
      : null;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
      className="min-w-0"
    >
      <Link
        href={`/topic/${item.topicId}`}
        className="card-chunky card-press spotlight focus-ring group flex h-full flex-col p-5 [--spot:var(--secondary)]"
      >
        <div className="flex items-center gap-3">
          <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-lg ring-1", s.iconBg, s.ring)}>
            <DomainIcon name={item.domain.icon} className={cn("h-5 w-5", s.text)} />
          </span>
          <div className={cn("min-w-0 flex-1 truncate text-sm font-medium", s.text)}>
            {item.domain.name} <span className="text-muted-foreground">· {item.phase}</span>
          </div>
          {match !== null && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-secondary/25 bg-secondary/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-secondary">
              <Target className="h-3 w-3" aria-hidden />
              {match}%
              <span className="sr-only"> match</span>
            </span>
          )}
        </div>

        <div className="mt-4 font-display text-2xl leading-tight text-foreground [text-wrap:balance]">
          {item.title}
        </div>
        {item.summary && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
        )}

        <div aria-hidden className="min-h-5 flex-1" />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
          {/* real numbers: topic_complete 10 XP + quiz_perfect 25 XP */}
          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-xp">
            <Gem className="h-4 w-4" aria-hidden />
            Up to 35 XP
          </span>
          <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-foreground transition-colors group-hover:border-primary/40 group-hover:bg-primary/10 group-hover:text-primary">
            <Play className="h-3.5 w-3.5" fill="currentColor" aria-hidden />
            Start topic
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

/** Compact row for queue positions 2+. */
function QueueRow({ item, index }: { item: RecommendedTopic; index: number }) {
  const reduce = useReducedMotionSafe();
  const s = styleFor(item.domain.color);
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.25, delay: reduce ? 0 : index * 0.05, ease: EASE }}
      className="min-w-0"
    >
      <Link
        href={`/topic/${item.topicId}`}
        className="card-chunky card-press spotlight focus-ring group flex items-center gap-3 p-3 [--spot:var(--secondary)]"
      >
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg ring-1", s.iconBg, s.ring)}>
          <DomainIcon name={item.domain.icon} className={cn("h-[18px] w-[18px]", s.text)} />
        </span>
        <div className="min-w-0 flex-1">
          <div className={cn("truncate text-xs font-medium", s.text)}>
            {item.domain.name} <span className="text-muted-foreground">· {item.phase}</span>
          </div>
          <div className="truncate text-[15px] font-medium text-foreground">{item.title}</div>
        </div>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-muted-foreground transition-[transform,color] group-hover:translate-x-0.5 group-hover:text-foreground"
          aria-hidden
        />
      </Link>
    </motion.li>
  );
}
