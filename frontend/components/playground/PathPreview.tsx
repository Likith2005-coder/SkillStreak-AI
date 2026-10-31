"use client";

/**
 * The learner's real path, Midnight edition: the five topics around where
 * they are, as glowing orbs strung on a luminous winding line. Done topics
 * are lit volt rings with a check; the current one is a solid volt orb with
 * a pulsing halo and a "Start" tooltip; upcoming ones wait as hollow
 * hairline rings. The lit part of the line draws itself up to the current
 * node. Titles sit on the side away from each bend so the path stays
 * compact enough to live inside the dashboard's hero panel.
 *
 * `mascot` renders SignalBot beside the path (off by default; the dashboard
 * hosts the mascot in its welcome header instead).
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "next-view-transitions";
import { BookOpen, Check, Play } from "lucide-react";
import { fetchDomainProgress, type DomainProgressDetail } from "@/lib/api";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";
import { Mascot } from "./Mascot";

// Horizontal offsets (px) that give the path its wind.
const WIND = [0, 44, 64, 44, 0, -44, -64, -44];
const STEP = 92; // vertical distance between node centres
const TOP = 52; // room above the first node for the Start tooltip
const NODE = 56;

type Node = DomainProgressDetail["topics"][number];

export function PathPreview({
  slug,
  currentTopicId,
  mascot = false,
}: {
  slug: string;
  currentTopicId: string;
  mascot?: boolean;
}) {
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
      <div className="relative mx-auto" style={{ height: TOP + STEP * 4 + NODE }} aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute animate-pulse rounded-full border border-white/10 bg-white/[0.04] motion-reduce:animate-none"
            style={{
              width: NODE,
              height: NODE,
              left: `calc(50% + ${WIND[i]}px - ${NODE / 2}px)`,
              top: TOP + i * STEP,
            }}
          />
        ))}
      </div>
    );
  }
  if (topics.length === 0) return null;

  const cur = Math.max(0, topics.findIndex((t) => t.id === currentTopicId));
  const start = Math.max(0, Math.min(cur - 1, topics.length - 5));
  const win = topics.slice(start, start + 5);
  const message =
    cur === 0 ? "Every expert started at node one. Let's go!" : `${cur} down. Ready for the next one?`;

  // Node centres relative to the column's horizontal centre.
  const pts = win.map((_, i) => ({ x: WIND[(start + i) % WIND.length], y: TOP + NODE / 2 + i * STEP }));
  const curve = (upto: number) =>
    pts
      .slice(0, upto + 1)
      .map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = pts[i - 1];
        const mid = (prev.y + p.y) / 2;
        return `C ${prev.x} ${mid}, ${p.x} ${mid}, ${p.x} ${p.y}`;
      })
      .join(" ");
  const curLocal = Math.min(Math.max(cur - start, 0), win.length - 1);
  const height = TOP + NODE + STEP * (win.length - 1) + 8;

  const path = (
    <div className="relative w-full" style={{ height }}>
      {/* The line: a zero-width anchor at the column centre, SVG overflows. */}
      <div className="pointer-events-none absolute left-1/2 top-0" aria-hidden>
        <svg width="1" height={height} overflow="visible" className="block">
          <path d={curve(win.length - 1)} fill="none" stroke="rgb(255 255 255 / 0.09)" strokeWidth={2} strokeDasharray="2 6" strokeLinecap="round" />
          {curLocal > 0 && (
            <motion.path
              d={curve(curLocal)}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.9))" }}
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduce ? 0 : 1.1, delay: reduce ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </svg>
      </div>

      <ol>
        {win.map((t, i) => {
          const done = t.status === "completed";
          const current = i === curLocal;
          const { x } = pts[i];
          const labelLeft = x > 0;
          return (
            // `left/top` place the node; the motion element inside owns the
            // transform for the scale-in.
            <li
              key={t.id}
              className="absolute"
              style={{ left: `calc(50% + ${x}px - ${NODE / 2}px)`, top: TOP + i * STEP, width: NODE, height: NODE }}
            >
              <motion.div
                initial={reduce ? false : { opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reduce ? 0 : 0.45, delay: reduce ? 0 : 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="relative h-full w-full"
              >
                {current && (
                  <>
                    {!reduce && (
                      <span
                        aria-hidden
                        className="anim-halo absolute inset-0 rounded-full bg-primary/40"
                        style={{ ["--halo-from" as string]: 0.55, ["--halo-to" as string]: 1.9 }}
                      />
                    )}
                    <span aria-hidden className="absolute -inset-2 rounded-full border border-primary/30" />
                    <span
                      aria-hidden
                      className="anim-bob-4 absolute -top-11 left-1/2 z-10 -ml-[30px] w-[60px] rounded-md bg-primary py-1 text-center text-xs font-semibold text-primary-foreground shadow-[0_0_20px_-2px_hsl(var(--primary)/0.8)]"
                    >
                      Start
                      <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-primary" />
                    </span>
                  </>
                )}
                <Link
                  href={`/topic/${t.id}`}
                  aria-label={`${t.title} — ${done ? "completed" : current ? "current topic" : "up next"}`}
                  className={cn(
                    "focus-ring relative flex h-full w-full items-center justify-center rounded-full transition-[transform,box-shadow,border-color] duration-200 hover:scale-105 active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100",
                    current
                      ? "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_0_0_1px_hsl(var(--primary)/0.6),0_0_32px_-2px_hsl(var(--primary)/0.75)]"
                      : done
                        ? "border border-primary/50 bg-primary/10 text-primary shadow-[0_0_18px_-4px_hsl(var(--primary)/0.6)]"
                        : "border border-white/10 bg-card text-muted-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.05)] hover:border-white/25",
                  )}
                >
                  {done ? (
                    <Check className="h-6 w-6" strokeWidth={2.5} />
                  ) : current ? (
                    <Play className="ml-0.5 h-6 w-6" fill="currentColor" strokeWidth={2} />
                  ) : (
                    <BookOpen className="h-5 w-5" strokeWidth={2} />
                  )}
                </Link>
                <span
                  className={cn(
                    "pointer-events-none absolute top-1/2 w-28 -translate-y-1/2 text-[13px] leading-snug sm:w-36",
                    labelLeft ? "right-[calc(100%+14px)] text-right" : "left-[calc(100%+14px)]",
                    current ? "font-semibold text-foreground" : done ? "text-muted-foreground" : "text-muted-foreground",
                  )}
                >
                  <span className="line-clamp-2">{t.title}</span>
                </span>
              </motion.div>
            </li>
          );
        })}
      </ol>
    </div>
  );

  if (!mascot) return path;

  return (
    <div className="relative flex justify-center gap-4 sm:grid sm:grid-cols-[1fr_minmax(0,22rem)_1fr] sm:items-center">
      <div className="hidden justify-end sm:flex">
        <Mascot message={message} size={96} side="left" />
      </div>
      {path}
      <div className="hidden sm:block" />
    </div>
  );
}
