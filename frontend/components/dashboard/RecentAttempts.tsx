"use client";

/**
 * The learner's latest quiz attempts (Activity tab). Same anatomy as
 * WeakAreasCard (icon well + title, hairline list) so the two sit side by
 * side as a pair.
 */

import type { CSSProperties } from "react";
import { Link } from "next-view-transitions";
import { Check, ChevronRight, History, X } from "lucide-react";
import type { RecentAttempt } from "@/lib/api";
import { styleFor } from "@/lib/domain-style";
import { cn } from "@/lib/utils";

export function RecentAttempts({ items }: { items: RecentAttempt[] }) {
  return (
    <div className="card-chunky spotlight h-full p-5 sm:p-6" style={{ "--spot": "var(--secondary)" } as CSSProperties}>
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary ring-1 ring-secondary/25"
        >
          <History className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg text-foreground">Recent quizzes</h3>
          <p className="text-sm text-muted-foreground">Your latest scores. Tap one to revisit the topic.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-muted-foreground ring-1 ring-white/10"
          >
            <Check className="h-5 w-5" />
          </span>
          <p className="text-sm text-muted-foreground">Finish a topic and take its quiz to see your scores here.</p>
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-white/[0.06] border-t border-white/[0.06]">
          {items.map((a) => {
            const s = styleFor(a.domain.color);
            return (
              <li key={a.id}>
                <Link
                  href={`/topic/${a.topicId}`}
                  className="focus-ring group -mx-2 flex min-h-[56px] items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/[0.04]"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1",
                      a.passed
                        ? "bg-primary/10 text-primary ring-primary/25"
                        : "bg-destructive/10 text-destructive-text ring-destructive/25",
                    )}
                  >
                    {a.passed ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <X className="h-4 w-4" strokeWidth={2.5} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">{a.topicTitle}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={cn("truncate font-medium", s.text)}>{a.domain.name}</span>
                      <span aria-hidden>·</span>
                      <span className="shrink-0 font-mono text-[11px]">
                        {new Date(a.attemptedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 font-mono text-xs font-semibold tabular-nums",
                      a.passed
                        ? "border-primary/25 bg-primary/10 text-primary"
                        : "border-destructive/25 bg-destructive/10 text-destructive-text",
                    )}
                  >
                    {a.score}/{a.total}
                    <span className="sr-only">{a.passed ? " passed" : " not passed"}</span>
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground motion-reduce:transition-none"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
