"use client";

import { Link } from "next-view-transitions";
import { ChevronRight, PartyPopper, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { styleFor } from "@/lib/domain-style";
import type { WeakArea } from "@/lib/api";

type Props = { items: WeakArea[] };

export function WeakAreasCard({ items }: Props) {
  return (
    <div className="card-chunky h-full p-5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 rotate-6 items-center justify-center rounded-2xl bg-destructive-bright"
          style={{ boxShadow: "0 4px 0 hsl(var(--destructive-shade))" }}
        >
          <Target className="h-6 w-6 text-white" strokeWidth={2.6} />
        </span>
        <div>
          <h3 className="text-lg font-black text-foreground">Weak areas</h3>
          <p className="text-sm font-bold text-muted-foreground">
            Best score below 60%. Retake to clear them.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 flex flex-col items-center rounded-2xl bg-primary/10 px-4 py-6 text-center">
          <PartyPopper className="h-8 w-8 text-primary" strokeWidth={2.4} aria-hidden />
          <p className="mt-2 text-base font-black text-primary-shade">Nothing flagged. Nice work!</p>
          <p className="mt-0.5 text-sm font-bold text-primary-shade">Keep going and keep it that way.</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-2.5">
          {items.map((w) => {
            const s = styleFor(w.domain.color);
            return (
              <li key={w.topicId}>
                <Link
                  href={`/topic/${w.topicId}`}
                  className="card-press focus-ring group flex min-h-[56px] items-center justify-between gap-3 rounded-2xl border-2 border-b-4 border-border bg-card px-4 py-2.5 transition-colors hover:bg-muted/60"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-extrabold text-foreground">{w.title}</div>
                    <div className={cn("mt-0.5 text-xs font-bold", s.text)}>{w.domain.name}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-extrabold tabular-nums text-destructive-text">
                      {w.bestScore ?? 0}/5
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" strokeWidth={3} aria-hidden />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
