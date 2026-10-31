"use client";

/**
 * Mistake Review door on the dashboard. With open mistakes it is a lit call
 * to action (count + where they came from); with none it collapses to a calm
 * "nothing to fix" note so it never nags.
 */

import { Link } from "next-view-transitions";
import { ArrowRight, CheckCheck, Gem, RotateCcw } from "lucide-react";
import type { ReviewList } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useCountUp } from "@/hooks/useCountUp";
import { styleFor } from "@/lib/domain-style";
import { cn } from "@/lib/utils";

const REVIEW_XP = 5;

export function ReviewCard({ review, className }: { review: ReviewList | null; className?: string }) {
  const count = useCountUp(review?.total ?? 0, 900);

  if (!review) {
    return <div className={cn("card-chunky h-[220px] animate-pulse motion-reduce:animate-none", className)} aria-hidden />;
  }

  if (review.total === 0) {
    return (
      <section className={cn("card-chunky spotlight flex flex-col p-5 [--spot:var(--primary)]", className)} aria-labelledby="review-h">
        <span aria-hidden className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/25">
          <CheckCheck className="h-5 w-5" />
        </span>
        <p className="label-mono mt-4 text-muted-foreground">Mistake review</p>
        <h2 id="review-h" className="mt-1.5 font-display text-xl leading-tight text-foreground">
          Clean slate. <span className="font-serif-accent text-primary">Nothing</span> to fix.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Anything you miss in a quiz lands here for a second shot, worth +{REVIEW_XP} XP each.
        </p>
      </section>
    );
  }

  // Up to three distinct topics the mistakes came from.
  const sources: ReviewList["items"] = [];
  for (const it of review.items) {
    if (!sources.some((s) => s.topicId === it.topicId)) sources.push(it);
    if (sources.length === 3) break;
  }
  const xpOnOffer = review.total * REVIEW_XP;

  return (
    <section
      className={cn("card-chunky spotlight flex flex-col p-5 [--spot:var(--destructive)]", className)}
      aria-labelledby="review-h"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,hsl(var(--destructive)/0.14),transparent)] blur-xl" />
      </div>
      <div className="flex items-start justify-between gap-3">
        <span aria-hidden className="grid h-10 w-10 place-items-center rounded-lg bg-destructive/10 text-destructive-text ring-1 ring-destructive/25">
          <RotateCcw className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-xp/25 bg-xp/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-xp">
          <Gem className="h-3.5 w-3.5" aria-hidden /> +{xpOnOffer} XP
        </span>
      </div>
      <p className="label-mono mt-4 text-destructive-text">Mistake review</p>
      <h2 id="review-h" className="mt-1.5 flex items-baseline gap-2.5">
        <span className="font-display text-5xl tabular-nums leading-none text-foreground">{count}</span>
        <span className="font-display text-lg leading-tight text-foreground">
          question{review.total === 1 ? "" : "s"} to <span className="font-serif-accent text-[1.2em] text-primary">fix</span>
        </span>
      </h2>
      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="From these topics">
        {sources.map((s) => {
          const st = styleFor(s.domain.color);
          return (
            <li
              key={s.topicId}
              className={cn("max-w-full truncate rounded-full border px-2.5 py-0.5 text-xs font-medium", st.badgeBg)}
            >
              {s.topicTitle}
            </li>
          );
        })}
      </ul>
      <div aria-hidden className="min-h-4 flex-1" />
      <Button asChild size="lg" className="mt-4 w-full">
        <Link href="/review">
          Review now <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.5} />
        </Link>
      </Button>
    </section>
  );
}
