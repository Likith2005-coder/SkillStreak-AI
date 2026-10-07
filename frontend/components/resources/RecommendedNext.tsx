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
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-black text-foreground">Up next for you</h2>
        {personalized && (
          <span className="rounded-full bg-grape/10 px-2.5 py-0.5 text-xs font-extrabold text-grape">
            Personalized
          </span>
        )}
      </div>
      <p className="-mt-1 mb-4 text-sm font-semibold text-muted-foreground">
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
              <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="card-chunky p-6 text-center">
          <p className="text-lg font-black text-foreground">You&apos;re all caught up!</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
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
        className="card-chunky card-press focus-ring group flex h-full flex-col overflow-hidden"
      >
        {/* domain-tinted top band */}
        <div className={cn("flex items-center gap-3 px-5 pb-4 pt-5", s.iconBg)}>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-card">
            <DomainIcon name={item.domain.icon} className={cn("h-6 w-6", s.text)} />
          </span>
          <div className="min-w-0 flex-1">
            <div className={cn("truncate text-sm font-extrabold", s.text)}>
              {item.domain.name} · {item.phase}
            </div>
            <div className="mt-0.5 text-xl font-black leading-tight text-foreground [text-wrap:balance]">
              {item.title}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5 pt-4">
          {match !== null && (
            <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-extrabold tabular-nums text-secondary">
              <Target className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
              {match}% match
            </span>
          )}
          {item.summary && (
            <p className="line-clamp-3 text-sm font-semibold leading-relaxed text-muted-foreground">
              {item.summary}
            </p>
          )}

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
            {/* real numbers: topic_complete 10 XP + quiz_perfect 25 XP */}
            <span className="inline-flex items-center gap-1.5 text-sm font-black text-xp">
              <Gem className="h-4 w-4" fill="currentColor" aria-hidden />
              Up to 35 XP
            </span>
            <span className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-black uppercase tracking-wide text-primary-foreground [box-shadow:0_4px_0_hsl(var(--primary-shade))] group-hover:brightness-[1.06]">
              <Play className="h-4 w-4" fill="currentColor" aria-hidden />
              Start topic
            </span>
          </div>
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
        className="card-press focus-ring group flex items-center gap-3 rounded-2xl border-2 border-b-4 border-border bg-card p-3 transition-colors hover:bg-muted/60"
      >
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", s.iconBg)}>
          <DomainIcon name={item.domain.icon} className={cn("h-5 w-5", s.text)} />
        </span>
        <div className="min-w-0 flex-1">
          <div className={cn("truncate text-xs font-extrabold", s.text)}>
            {item.domain.name} · {item.phase}
          </div>
          <div className="truncate text-base font-extrabold text-foreground">{item.title}</div>
        </div>
        <ChevronRight
          className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          strokeWidth={3}
          aria-hidden
        />
      </Link>
    </motion.li>
  );
}
