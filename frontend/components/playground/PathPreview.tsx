"use client";

/**
 * The learner's real path, Duolingo-style: the topics around where they are,
 * as chunky pressable nodes on a winding line. Done topics are filled green
 * with a check, the current one carries a bobbing "START" bubble and a ring,
 * upcoming ones wait in grey. The mascot sits beside the path.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "next-view-transitions";
import { Check, Star, BookOpen } from "lucide-react";
import { fetchDomainProgress, type DomainProgressDetail } from "@/lib/api";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";
import { Mascot } from "./Mascot";

// Horizontal offsets (px) that give the path its wind.
const WIND = [0, 52, 78, 52, 0, -52, -78, -52];

type Node = DomainProgressDetail["topics"][number];

export function PathPreview({ slug, currentTopicId }: { slug: string; currentTopicId: string }) {
  const reduce = useReducedMotionSafe();
  const [topics, setTopics] = useState<Node[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDomainProgress(slug)
      .then((d) => !cancelled && setTopics([...d.topics].sort((a, b) => a.orderIndex - b.orderIndex)))
      .catch(() => !cancelled && setTopics([]));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!topics) {
    return (
      <div className="flex flex-col items-center gap-6 py-6" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="relative h-[72px] w-[72px] animate-pulse rounded-full bg-muted motion-reduce:animate-none" style={{ left: WIND[i] }} />
        ))}
      </div>
    );
  }
  if (topics.length === 0) return null;

  const cur = Math.max(0, topics.findIndex((t) => t.id === currentTopicId));
  const start = Math.max(0, Math.min(cur - 1, topics.length - 5));
  const window = topics.slice(start, start + 5);
  const message =
    cur === 0 ? "Every expert started at node one. Let's go!" : `${cur} down. Ready for the next one?`;

  return (
    // Phones: just the path, centred. From sm up, a 3-column grid puts the
    // mascot to its left and keeps the path itself centred.
    <div className="relative flex justify-center gap-4 py-4 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-start">
      <div className="hidden justify-end self-center sm:flex">
        <Mascot message={message} size={110} side="left" />
      </div>

      <ol className="flex flex-col items-center gap-7">
        {window.map((t, i) => {
          const idx = start + i;
          const done = t.status === "completed";
          const current = idx === cur;
          const face = done || current ? "bg-primary-bright" : "bg-muted";
          const edge = done || current ? "hsl(var(--primary-shade))" : "hsl(var(--border))";
          return (
            <motion.li
              key={t.id}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              // `left`, not transform: framer-motion owns transform for the
              // scale-in and would overwrite the wind offset.
              style={{ left: WIND[idx % WIND.length] }}
              className="relative"
            >
              {current && (
                <motion.span
                  aria-hidden
                  animate={reduce ? undefined : { y: [0, -5, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-11 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-xl border-2 border-border bg-card px-3 py-1.5 text-xs font-black uppercase tracking-wider text-primary"
                >
                  Start
                  <span className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-border bg-card" />
                </motion.span>
              )}
              {current && (
                <span aria-hidden className="absolute -inset-[9px] rounded-full border-[6px] border-primary-bright/30" />
              )}
              <Link
                href={`/topic/${t.id}`}
                aria-label={`${t.title} — ${done ? "completed" : current ? "current topic" : "up next"}`}
                className={cn(
                  "focus-ring relative flex h-[72px] w-[72px] items-center justify-center rounded-full transition-[transform,box-shadow] duration-100 active:translate-y-[6px] active:!shadow-none motion-reduce:transition-none",
                  face,
                )}
                style={{ boxShadow: `0 6px 0 ${edge}` }}
              >
                {done ? (
                  <Check className="h-8 w-8 text-white" strokeWidth={4} />
                ) : current ? (
                  <Star className="h-8 w-8 fill-white text-white" />
                ) : (
                  <BookOpen className="h-7 w-7 text-muted-foreground" strokeWidth={2.5} />
                )}
              </Link>
              <span className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 hidden w-44 -translate-y-1/2 text-sm font-bold leading-tight text-foreground lg:block">
                <span className={cn(!done && !current && "text-muted-foreground")}>{t.title}</span>
              </span>
            </motion.li>
          );
        })}
      </ol>

      <div className="hidden sm:block" />
    </div>
  );
}
