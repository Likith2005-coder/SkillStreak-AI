"use client";

import { Link } from "next-view-transitions";
import { ChevronRight, PartyPopper, Target } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { styleFor } from "@/lib/domain-style";
import type { WeakArea } from "@/lib/api";

type Props = { items: WeakArea[] };

export function WeakAreasCard({ items }: Props) {
  return (
    <div className="card-chunky spotlight h-full p-5 sm:p-6" style={{ "--spot": "var(--destructive)" } as CSSProperties}>
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive-text ring-1 ring-destructive/25"
        >
          <Target className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg text-foreground">Weak areas</h3>
          <p className="text-sm text-muted-foreground">
            Best score below 60%. Retake to clear them.
          </p>
        </div>
        {items.length > 0 && (
          <span className="shrink-0 rounded-full border border-destructive/25 bg-destructive/10 px-2.5 py-0.5 font-mono text-xs font-semibold tabular-nums text-destructive-text">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-5 flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/[0.06] px-4 py-4">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary shadow-[0_0_20px_-4px_hsl(var(--primary)/0.6)]"
          >
            <PartyPopper className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-primary">Nothing flagged. Nice work.</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Keep going and keep it that way.</p>
          </div>
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-white/[0.06] border-t border-white/[0.06]">
          {items.map((w) => {
            const s = styleFor(w.domain.color);
            return (
              <li key={w.topicId}>
                <Link
                  href={`/topic/${w.topicId}`}
                  className="focus-ring group -mx-2 flex min-h-[56px] items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{w.title}</div>
                    <div className={cn("mt-0.5 text-xs font-medium", s.text)}>{w.domain.name}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full border border-destructive/25 bg-destructive/10 px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-destructive-text">
                      {w.bestScore ?? 0}/5
                    </span>
                    <ChevronRight
                      className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                      aria-hidden
                    />
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
