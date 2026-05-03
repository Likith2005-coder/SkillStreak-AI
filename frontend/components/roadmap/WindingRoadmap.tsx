"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Lock, Play, Star } from "lucide-react";
import type { RoadmapTopic } from "@/lib/api";
import { styleFor, type DomainColor } from "@/lib/domain-style";
import { cn } from "@/lib/utils";

type Status = "completed" | "current" | "in_progress" | "available";

type Props = {
  topics: RoadmapTopic[];
  progressMap: Map<string, "not_started" | "in_progress" | "completed">;
  color: string;
};

// Layout constants — tuned so the winding path looks natural on most screens.
const NODE_SIZE = 80;            // px diameter of each topic node
const ROW_HEIGHT = 130;          // vertical distance between adjacent nodes
const SIDE_PADDING = 40;         // padding at horizontal extremes
const PATH_AMPLITUDE = 110;      // peak horizontal sway
const WAVELENGTH = 4;            // topics per full sine wave cycle
const TOP_PADDING = 60;
const BOTTOM_PADDING = 80;

export function WindingRoadmap({ topics, progressMap, color }: Props) {
  const reduce = useReducedMotion();
  const s = styleFor(color);

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
      x: PATH_AMPLITUDE * Math.sin((i * 2 * Math.PI) / WAVELENGTH),
      y: TOP_PADDING + i * ROW_HEIGHT,
    }));
  }, [topics]);

  const totalHeight = TOP_PADDING + (topics.length - 1) * ROW_HEIGHT + BOTTOM_PADDING;
  const halfWidth = PATH_AMPLITUDE + NODE_SIZE / 2 + SIDE_PADDING;

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
            <stop offset="0%" stopColor={pathStop(color, "from")} stopOpacity="0.7" />
            <stop offset="100%" stopColor={pathStop(color, "to")} stopOpacity="0.45" />
          </linearGradient>
        </defs>
        {/* Dashed underlay for "future" path */}
        <path
          d={pathD}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="4 10"
          opacity="0.6"
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
            position={{ x: halfWidth + x - NODE_SIZE / 2, y: y - NODE_SIZE / 2 }}
            index={i}
            reduce={!!reduce}
          />
        );
      })}
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
      strokeWidth="6"
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
  colorStyle,
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
  const isCompleted = status === "completed";

  const tone =
    isCompleted
      ? "completed"
      : isCurrent
        ? "current"
        : status === "in_progress"
          ? "progress"
          : "available";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 18 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: reduce ? 0 : 0.5,
        delay: reduce ? 0 : Math.min(index * 0.04, 0.4),
        ease: [0.22, 1, 0.36, 1],
        type: reduce ? undefined : "spring",
        stiffness: 220,
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
      {/* Pulsing glow under the current node */}
      {isCurrent && !reduce && (
        <motion.span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br",
            colorStyle.gradientFrom,
            colorStyle.gradientTo
          )}
          animate={{ scale: [1, 1.35, 1], opacity: [0.45, 0, 0.45] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <Link
        href={`/topic/${topic.id}`}
        aria-label={topic.title}
        className="block h-full w-full"
      >
        <motion.div
          whileHover={reduce ? undefined : { scale: 1.1, rotate: -3, y: -2 }}
          whileTap={reduce ? undefined : { scale: 0.92 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className={cn(
            "relative flex h-full w-full items-center justify-center rounded-full text-white shadow-lg transition-shadow",
            tone === "completed" && "bg-gradient-to-br from-emerald-400 to-emerald-600",
            tone === "current" &&
              `bg-gradient-to-br ${colorStyle.gradientFrom} ${colorStyle.gradientTo}`,
            tone === "progress" &&
              "bg-gradient-to-br from-amber-400 to-orange-500",
            tone === "available" &&
              "border-2 border-dashed border-border bg-card text-muted-foreground shadow-none",
            "group-hover:shadow-2xl"
          )}
          style={
            tone === "current"
              ? { boxShadow: `0 12px 40px -10px ${pathStop(color, "to")}` }
              : undefined
          }
        >
          <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-card text-[10px] font-bold tabular-nums text-foreground shadow ring-2 ring-background">
            {topic.orderIndex}
          </span>

          {tone === "completed" ? (
            <Check className="h-7 w-7" strokeWidth={3} />
          ) : tone === "current" ? (
            <Play className="h-6 w-6 fill-white" strokeWidth={2.5} />
          ) : tone === "progress" ? (
            <Star className="h-6 w-6 fill-white" strokeWidth={2} />
          ) : (
            <Lock className="h-5 w-5" strokeWidth={2} />
          )}

          {/* Floating label */}
          <div
            className={cn(
              "pointer-events-none absolute left-1/2 top-full mt-3 w-44 -translate-x-1/2 text-center transition-all",
              "opacity-100 group-hover:scale-105"
            )}
          >
            <div
              className={cn(
                "mx-auto inline-block max-w-full truncate rounded-md bg-card/80 px-2 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur",
                isCurrent && "ring-1 ring-inset",
                isCurrent && colorStyle.ring
              )}
            >
              {topic.title}
            </div>
            {isCurrent && (
              <div
                className={cn(
                  "mx-auto mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white",
                  `bg-gradient-to-r ${colorStyle.gradientFrom} ${colorStyle.gradientTo}`
                )}
              >
                START
              </div>
            )}
          </div>
        </motion.div>
      </Link>
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
