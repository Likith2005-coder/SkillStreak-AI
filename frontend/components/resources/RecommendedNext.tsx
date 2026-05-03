"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  apiErrorMessage,
  fetchRecommendations,
  type RecommendedTopic,
} from "@/lib/api";
import { DomainIcon } from "@/components/shared/DomainIcon";
import { styleFor } from "@/lib/domain-style";
import { cn } from "@/lib/utils";

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

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          Recommended for you
        </h3>
        {items?.[0]?.reason === "personalized" && (
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
            Personalized
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {items?.[0]?.reason === "personalized"
          ? "Closest topics to what you've already learned, by embedding similarity."
          : "Foundations to start with."}
      </p>

      {!items ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-card/30" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-card/30 p-4 text-center text-xs text-muted-foreground">
          You're all caught up. 🏁
        </div>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {items.map((it, i) => {
            const s = styleFor(it.domain.color);
            return (
              <motion.li
                key={it.topicId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
              >
                <Link
                  href={`/topic/${it.topicId}`}
                  className="group flex items-start gap-3 rounded-xl border border-border bg-card/50 p-3 transition hover:border-primary/40 hover:bg-card"
                >
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", s.iconBg)}>
                    <DomainIcon name={it.domain.icon} className={cn("h-4 w-4", s.text)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={cn("text-[10px] uppercase tracking-wider", s.text)}>
                      {it.domain.name} · {it.phase}
                    </div>
                    <div className="mt-0.5 truncate text-sm font-medium text-foreground">
                      {it.title}
                    </div>
                  </div>
                  <ArrowRight className="mt-2 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
