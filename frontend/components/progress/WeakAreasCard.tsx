"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { styleFor } from "@/lib/domain-style";
import type { WeakArea } from "@/lib/api";

type Props = { items: WeakArea[] };

export function WeakAreasCard({ items }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 backdrop-blur">
      <div className="flex items-center gap-2 text-sm font-medium">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        Weak areas
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Topics where your best score is below 60%. Re-take the quiz to clear them.
      </p>

      {items.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-card/30 p-4 text-center text-xs text-muted-foreground">
          Nothing flagged yet. Keep going.
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((w) => {
            const s = styleFor(w.domain.color);
            return (
              <li key={w.topicId}>
                <Link
                  href={`/topic/${w.topicId}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card/50 px-3 py-2.5 transition hover:border-primary/40 hover:bg-card"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">{w.title}</div>
                    <div className={cn("mt-0.5 text-[11px]", s.text)}>{w.domain.name}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                      {w.bestScore ?? 0}/5
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
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
