"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "next-view-transitions";
import { motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { BookOpen, Check, Play, Star } from "lucide-react";
import type { RoadmapTopic } from "@/lib/api";
import { styleFor } from "@/lib/domain-style";
import { domainPalette } from "@/components/shared/DomainIcon";
import { cn } from "@/lib/utils";

type Status = "completed" | "current" | "in_progress" | "available";

type Props = {
  topics: RoadmapTopic[];
  progressMap: Map<string, "not_started" | "in_progress" | "completed">;
  color: string;
};

// Layout constants — tuned so the winding path looks natural on most screens.
const NODE_SIZE = 80; // px diameter of each topic node
const ROW_HEIGHT = 150; // vertical distance between adjacent nodes
const LABEL_HALF = 92; // half the 176px label + breathing room
const MAX_AMPLITUDE = 110; // peak horizontal sway on roomy screens
const MIN_AMPLITUDE = 30;
const WAVELENGTH = 4; // topics per full sine wave cycle
const TOP_PADDING = 60;
const BOTTOM_PADDING = 80;

export function WindingRoadmap({ topics, progressMap, color }: Props) {
  const reduce = useReducedMotion();
  const s = styleFor(color);

  // The sway shrinks with the container so the outermost labels never run
  // off a phone screen; the full wind returns wherever there is room.
  const wrap = useRef<HTMLDivElement>(null);
  const [amplitude, setAmplitude] = useState(MAX_AMPLITUDE);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const fit = () =>
      setAmplitude(
        Math.max(
          MIN_AMPLITUDE,
          Math.min(MAX_AMPLITUDE, el.clientWidth / 2 - LABEL_HALF),
        ),
      );
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Identify the "current" node: the first non-completed topic. Everything
  // before it is unlocked (available / completed); we don't actually lock
  // later topics in the data model, but we visually communicate "this is
  // where you are" by emphasising the current node.
  const currentIndex = useMemo(() => {
    for (let i = 0; i < topics.length; i++) {
      const status = progressMap.get(topics[i].id) ?? "not_started";
      if (status !== "completed") return i;
    }
    return -1; // all done
  }, [topics, progressMap]);

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
  const halfWidth = amplitude + LABEL_HALF;

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
        {/* SVG path behind the nodes */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${halfWidth * 2} ${totalHeight}`}
          preserveAspectRatio="xMidYMin meet"
          aria-hidden
        >
          <defs>
            <linearGradient id={`path-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={pathStop(color, "from")}
                stopOpacity="0.55"
              />
              <stop
                offset="100%"
                stopColor={pathStop(color, "to")}
                stopOpacity="0.4"
              />
            </linearGradient>
          </defs>
          {/* Dashed underlay for "future" path */}
          <path
            d={pathD}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Solid coloured overlay up to current progress */}
          {currentIndex !== 0 && (
            <ProgressPath
              d={pathD}
              currentIndex={currentIndex < 0 ? topics.length : currentIndex}
              total={topics.length}
              color={color}
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
  color,
  reduce,
}: {
  d: string;
  currentIndex: number;
  total: number;
  color: string;
  reduce: boolean;
}) {
  // Approximate the visible portion as a fraction of the path, by node count.
  // Real path-length-based stroke-dashoffset would be more accurate; this is
  // a close-enough approximation for a winding path with evenly-spaced nodes.
  const fraction = total <= 1 ? 0 : currentIndex / (total - 1);

  return (
    <motion.path
      d={d}
      fill="none"
      stroke={`url(#path-${color})`}
      strokeWidth="14"
      strokeLinecap="round"
      strokeDasharray="1"
      pathLength={1}
      initial={{ strokeDashoffset: 1 }}
      animate={{ strokeDashoffset: 1 - fraction }}
      transition={{ duration: reduce ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}

function RoadmapNode({
  topic,
  status,
  color,
  position,
  index,
  reduce,
}: {
  topic: RoadmapTopic;
  status: Status;
  color: string;
  colorStyle: ReturnType<typeof styleFor>;
  position: { x: number; y: number };
  index: number;
  reduce: boolean;
}) {
  const isCurrent = status === "current";
  const { bright: face, edge } = domainPalette(color);
  const palette =
    status === "completed" || status === "current"
      ? { face, edge, fg: "#fff" }
      : status === "in_progress"
        ? {
            face: "hsl(var(--xp-bright))",
            edge: "hsl(var(--xp-shade))",
            fg: "#fff",
          }
        : {
            face: "hsl(var(--muted))",
            edge: "hsl(var(--border))",
            fg: "hsl(var(--muted-foreground))",
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
        damping: 16,
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
        <motion.span
          aria-hidden
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -top-12 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-xl border-2 border-border bg-card px-3 py-1.5 text-xs font-black uppercase tracking-wider"
          style={{ color: edge }}
        >
          Start
          <span className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-border bg-card" />
        </motion.span>
      )}
      {isCurrent && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-[10px] rounded-full border-[7px]"
          style={{ borderColor: face, opacity: 0.28 }}
        />
      )}

      <Link
        href={`/topic/${topic.id}`}
        aria-label={`${topic.orderIndex}. ${topic.title}: ${status === "completed" ? "completed" : isCurrent ? "current topic" : status === "in_progress" ? "in progress" : "not started"}`}
        className="focus-ring relative flex h-full w-full items-center justify-center rounded-full transition-[transform,box-shadow] duration-100 hover:brightness-105 active:translate-y-[7px] active:!shadow-none motion-reduce:transition-none"
        style={{
          background: palette.face,
          color: palette.fg,
          boxShadow: `0 7px 0 ${palette.edge}`,
        }}
      >
        {/* glossy highlight, the toy-button detail */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-[22%] top-[12%] h-[18%] w-[34%] -rotate-12 rounded-full bg-white/30"
        />
        {status === "completed" ? (
          <Check className="h-9 w-9" strokeWidth={4} />
        ) : isCurrent ? (
          <Star className="h-9 w-9" fill="currentColor" strokeWidth={2} />
        ) : status === "in_progress" ? (
          <Play className="h-8 w-8" fill="currentColor" strokeWidth={2} />
        ) : (
          <BookOpen className="h-8 w-8" strokeWidth={2.5} />
        )}
      </Link>

      <div className="pointer-events-none absolute left-1/2 top-full mt-4 w-44 -translate-x-1/2 text-center">
        <span
          className={cn(
            "inline-block max-w-full truncate rounded-xl border-2 border-border bg-card px-2.5 py-1 text-xs font-extrabold",
            status === "available"
              ? "text-muted-foreground"
              : "text-foreground",
          )}
        >
          <span
            className="mr-1 tabular-nums"
            style={{ color: status === "available" ? undefined : edge }}
          >
            {topic.orderIndex}
          </span>
          {topic.title}
        </span>
      </div>
    </motion.div>
  );
}

function pathStop(color: string, end: "from" | "to"): string {
  const map: Record<string, [string, string]> = {
    rose: ["#f43f5e", "#ec4899"],
    blue: ["#3b82f6", "#6366f1"],
    violet: ["#8b5cf6", "#d946ef"],
    emerald: ["#10b981", "#14b8a6"],
    cyan: ["#06b6d4", "#0ea5e9"],
    sky: ["#0ea5e9", "#3b82f6"],
    orange: ["#f97316", "#f59e0b"],
    amber: ["#f59e0b", "#eab308"],
    teal: ["#14b8a6", "#10b981"],
    indigo: ["#6366f1", "#8b5cf6"],
  };
  const stops = map[color] ?? map.indigo;
  return end === "from" ? stops[0] : stops[1];
}
