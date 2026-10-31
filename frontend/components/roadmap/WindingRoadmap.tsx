"use client";

import type React from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "next-view-transitions";
import { motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { BookOpen, Check, Play, Star } from "lucide-react";
import type { RoadmapTopic } from "@/lib/api";
import { styleFor } from "@/lib/domain-style";
import { domainPalette, withAlpha } from "@/components/shared/DomainIcon";
import { cn } from "@/lib/utils";

type Status = "completed" | "current" | "in_progress" | "available";

type Props = {
  topics: RoadmapTopic[];
  progressMap: Map<string, "not_started" | "in_progress" | "completed">;
  color: string;
  /** The single "you are here" topic across the whole domain (all phases),
   *  or null when every topic is done. Only a matching node is "current". */
  currentTopicId: string | null;
};

// Layout constants — tuned so the winding path looks natural on most screens.
const NODE_SIZE = 68; // px diameter of each topic orb
const ROW_HEIGHT = 150; // vertical distance between adjacent nodes
// Half the label width + breathing room: w-56 (224px) below sm, w-64 (256px) from sm.
const LABEL_HALF = 116;
const LABEL_HALF_SM = 132;
const MAX_AMPLITUDE = 110; // peak horizontal sway on roomy screens
const MIN_AMPLITUDE = 30;
const WAVELENGTH = 4; // topics per full sine wave cycle
const TOP_PADDING = 60;
const BOTTOM_PADDING = 80;

export function WindingRoadmap({ topics, progressMap, color, currentTopicId }: Props) {
  const reduce = useReducedMotion();
  const s = styleFor(color);
  const pal = domainPalette(color);
  const uid = useId().replace(/:/g, "");

  // The sway shrinks with the container so the outermost labels never run
  // off a phone screen; the full wind returns wherever there is room.
  const wrap = useRef<HTMLDivElement>(null);
  const [amplitude, setAmplitude] = useState(MAX_AMPLITUDE);
  const [labelHalf, setLabelHalf] = useState(LABEL_HALF_SM);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const fit = () => {
      // Matches the label's Tailwind `sm:` breakpoint (viewport based).
      const half = window.innerWidth >= 640 ? LABEL_HALF_SM : LABEL_HALF;
      setLabelHalf(half);
      setAmplitude(
        Math.max(
          MIN_AMPLITUDE,
          Math.min(MAX_AMPLITUDE, el.clientWidth / 2 - half),
        ),
      );
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The "current" node is decided once for the whole domain by the parent,
  // so only one phase shows it. -1 = not in this phase.
  const currentIndex = useMemo(
    () => (currentTopicId ? topics.findIndex((t) => t.id === currentTopicId) : -1),
    [topics, currentTopicId],
  );

  // How far the lit trail runs in this phase, in nodes: up to the current
  // node if it's here, the whole phase if every topic is done, else nothing.
  const litUpTo = useMemo(() => {
    if (currentIndex >= 0) return currentIndex;
    const allDone =
      topics.length > 0 && topics.every((t) => progressMap.get(t.id) === "completed");
    return allDone ? Math.max(topics.length - 1, 0) : 0;
  }, [currentIndex, topics, progressMap]);

  // Compute (x, y) for each node along a sine wave.
  const points = useMemo(() => {
    return topics.map((t, i) => ({
      topic: t,
      x: amplitude * Math.sin((i * 2 * Math.PI) / WAVELENGTH),
      y: TOP_PADDING + i * ROW_HEIGHT,
    }));
  }, [topics, amplitude]);

  const totalHeight =
    TOP_PADDING + (topics.length - 1) * ROW_HEIGHT + BOTTOM_PADDING;
  const halfWidth = amplitude + labelHalf;

  // Build a smooth SVG path connecting all node centres.
  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    const center = halfWidth;
    let d = `M ${center + points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      // Quadratic curve via control point at the midpoint shifted toward the
      // previous node's x so the curve looks like a flowing river.
      const cx = center + (prev.x + curr.x) / 2;
      const cy = (prev.y + curr.y) / 2;
      d += ` Q ${center + prev.x} ${cy} ${center + curr.x} ${curr.y}`;
    }
    return d;
  }, [points, halfWidth]);

  return (
    <div ref={wrap} className="w-full">
      <div
        className="relative mx-auto"
        style={{ width: halfWidth * 2, maxWidth: "100%", height: totalHeight }}
      >
        {/* The trail: a dim hairline for the road ahead, lit in the domain
            colour (a soft bloom under a bright core) up to where you are. */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          viewBox={`0 0 ${halfWidth * 2} ${totalHeight}`}
          preserveAspectRatio="xMidYMin meet"
          aria-hidden
        >
          <defs>
            <linearGradient id={`${uid}-lit`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={pal.light} />
              <stop offset="100%" stopColor={pal.bright} />
            </linearGradient>
            <filter id={`${uid}-bloom`} x="-50%" y="-10%" width="200%" height="120%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>
          {/* the road ahead */}
          <path d={pathD} fill="none" stroke="rgb(255 255 255 / 0.07)" strokeWidth="10" strokeLinecap="round" />
          <path
            d={pathD}
            fill="none"
            stroke="rgb(255 255 255 / 0.16)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="2 8"
          />
          {/* lit up to current progress */}
          {litUpTo > 0 && (
            <ProgressPath
              d={pathD}
              currentIndex={litUpTo}
              total={topics.length}
              uid={uid}
              bloom={pal.bright}
              reduce={!!reduce}
            />
          )}
        </svg>

        {/* Topic nodes */}
        {points.map(({ topic, x, y }, i) => {
          const raw = progressMap.get(topic.id) ?? "not_started";
          const status: Status =
            raw === "completed"
              ? "completed"
              : i === currentIndex
                ? "current"
                : raw === "in_progress"
                  ? "in_progress"
                  : "available";

          return (
            <RoadmapNode
              key={topic.id}
              topic={topic}
              status={status}
              color={color}
              colorStyle={s}
              position={{
                x: halfWidth + x - NODE_SIZE / 2,
                y: y - NODE_SIZE / 2,
              }}
              index={i}
              reduce={!!reduce}
              tipSide={x > 0 ? "left" : "right"}
            />
          );
        })}
      </div>
    </div>
  );
}

function ProgressPath({
  d,
  currentIndex,
  total,
  uid,
  bloom,
  reduce,
}: {
  d: string;
  currentIndex: number;
  total: number;
  uid: string;
  bloom: string;
  reduce: boolean;
}) {
  // Approximate the visible portion as a fraction of the path, by node count.
  // Real path-length-based stroke-dashoffset would be more accurate; this is
  // a close-enough approximation for a winding path with evenly-spaced nodes.
  const fraction = total <= 1 ? 0 : currentIndex / (total - 1);
  const transition = { duration: reduce ? 0 : 1.4, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <>
      <motion.path
        d={d}
        fill="none"
        stroke={bloom}
        strokeOpacity={0.55}
        strokeWidth="12"
        strokeLinecap="round"
        filter={`url(#${uid}-bloom)`}
        strokeDasharray="1"
        pathLength={1}
        initial={{ strokeDashoffset: 1 }}
        animate={{ strokeDashoffset: 1 - fraction }}
        transition={transition}
      />
      <motion.path
        d={d}
        fill="none"
        stroke={`url(#${uid}-lit)`}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="1"
        pathLength={1}
        initial={{ strokeDashoffset: 1 }}
        animate={{ strokeDashoffset: 1 - fraction }}
        transition={transition}
      />
    </>
  );
}

function RoadmapNode({
  topic,
  status,
  color,
  position,
  index,
  reduce,
  tipSide,
}: {
  topic: RoadmapTopic;
  status: Status;
  color: string;
  colorStyle: ReturnType<typeof styleFor>;
  position: { x: number; y: number };
  index: number;
  reduce: boolean;
  /** Which side of the node the "Start" bubble sits on: toward the trail's centre. */
  tipSide: "left" | "right";
}) {
  const isCurrent = status === "current";
  const pal = domainPalette(color);
  const ink = "hsl(var(--primary-foreground))";

  // Orb looks: done = a solid lit orb with dark ink; current = a dark orb
  // ringed and filled with the domain's light; in progress = a gold ring;
  // upcoming = a dim glass orb.
  const orb: React.CSSProperties =
    status === "completed"
      ? {
          background: `radial-gradient(circle at 35% 25%, ${pal.light}, ${pal.bright} 60%)`,
          color: ink,
          boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.45), 0 0 0 1px ${withAlpha(pal.bright, 0.7)}, 0 0 28px -4px ${withAlpha(pal.bright, 0.75)}`,
        }
      : isCurrent
        ? {
            background: `radial-gradient(circle at 50% 30%, ${withAlpha(pal.bright, 0.45)}, ${withAlpha(pal.bright, 0.12)} 70%), hsl(var(--card))`,
            color: pal.light,
            boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.2), 0 0 0 2px ${pal.bright}, 0 0 40px -2px ${withAlpha(pal.bright, 0.8)}`,
          }
        : status === "in_progress"
          ? {
              background: "radial-gradient(circle at 50% 30%, hsl(var(--xp) / 0.22), hsl(var(--xp) / 0.05) 70%), hsl(var(--card))",
              color: "hsl(var(--xp))",
              boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.12), 0 0 0 1.5px hsl(var(--xp) / 0.7), 0 0 24px -6px hsl(var(--xp) / 0.6)",
            }
          : {
              background: "radial-gradient(circle at 50% 25%, rgb(255 255 255 / 0.07), rgb(255 255 255 / 0.015) 70%), hsl(var(--card))",
              color: "hsl(var(--muted-foreground))",
              boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.08), 0 0 0 1px rgb(255 255 255 / 0.1), 0 8px 24px -10px rgb(0 0 0 / 0.8)",
            };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: reduce ? 0 : 0.5,
        delay: reduce ? 0 : Math.min(index * 0.05, 0.6),
        type: reduce ? undefined : "spring",
        stiffness: 260,
        damping: 18,
      }}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: NODE_SIZE,
        height: NODE_SIZE,
      }}
      className="group"
    >
      {isCurrent && (
        // Beside the node, never above it: above, it collided with the label of
        // the topic before. The static wrapper owns placement; the child bobs.
        <span
          aria-hidden
          className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 ${
            tipSide === "left" ? "right-[calc(100%+18px)]" : "left-[calc(100%+18px)]"
          }`}
        >
          <span
            className="anim-bob-4 relative block whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{
              background: pal.bright,
              color: ink,
              boxShadow: `0 0 0 1px ${withAlpha(pal.light, 0.6)}, 0 8px 28px -6px ${withAlpha(pal.bright, 0.8)}`,
            }}
          >
            Start
            <span
              className={`absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 rounded-[2px] ${
                tipSide === "left" ? "-right-1" : "-left-1"
              }`}
              style={{ background: pal.bright }}
            />
          </span>
        </span>
      )}
      {isCurrent && (
        <>
          {/* pulsing halo: two rings breathing out of the orb */}
          {reduce ? (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 scale-125 rounded-full opacity-35"
              style={{ boxShadow: `0 0 0 2px ${withAlpha(pal.bright, 0.7)}` }}
            />
          ) : (
            [0, 1].map((k) => (
              <span
                key={k}
                aria-hidden
                className="anim-halo pointer-events-none absolute inset-0 rounded-full"
                style={{
                  boxShadow: `0 0 0 2px ${withAlpha(pal.bright, 0.7)}`,
                  animationDuration: "2.4s",
                  animationDelay: `${k * 1.2}s`,
                  ["--halo-from" as string]: 0.7,
                  ["--halo-to" as string]: 1.7,
                }}
              />
            ))
          )}
        </>
      )}

      <Link
        href={`/topic/${topic.id}`}
        aria-label={`${topic.orderIndex}. ${topic.title}: ${status === "completed" ? "completed" : isCurrent ? "current topic" : status === "in_progress" ? "in progress" : "not started"}`}
        className={cn(
          "focus-ring relative flex h-full w-full items-center justify-center rounded-full transition-[transform,filter] duration-300 ease-out hover:scale-[1.07] hover:brightness-110 active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100",
          status === "available" && "hover:!shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_0_0_1px_rgb(255_255_255/0.25)]"
        )}
        style={orb}
      >
        {status === "completed" ? (
          <Check className="h-7 w-7" strokeWidth={3.2} />
        ) : isCurrent ? (
          <Play className="ml-0.5 h-7 w-7 drop-shadow-[0_0_8px_currentColor]" fill="currentColor" strokeWidth={1.5} />
        ) : status === "in_progress" ? (
          <Star className="h-6 w-6" fill="currentColor" strokeWidth={1.5} />
        ) : (
          <BookOpen className="h-6 w-6" strokeWidth={2} />
        )}
      </Link>

      <div className="pointer-events-none absolute left-1/2 top-full mt-4 w-56 -translate-x-1/2 text-center sm:w-64">
        <span
          className={cn(
            "inline-flex max-w-full items-center gap-1.5 rounded-2xl border bg-card/90 px-3 py-1 text-xs font-medium backdrop-blur-sm",
            isCurrent ? "text-foreground" : status === "available" ? "border-white/[0.08] text-muted-foreground" : "border-white/10 text-foreground",
          )}
          style={isCurrent ? { borderColor: withAlpha(pal.bright, 0.45) } : undefined}
        >
          <span
            className="shrink-0 font-mono text-[11px] tabular-nums"
            style={{ color: status === "available" ? undefined : status === "in_progress" ? "hsl(var(--xp))" : pal.light }}
          >
            {String(topic.orderIndex).padStart(2, "0")}
          </span>
          <span className="line-clamp-2 whitespace-normal text-left" title={topic.title}>{topic.title}</span>
        </span>
      </div>
    </motion.div>
  );
}
