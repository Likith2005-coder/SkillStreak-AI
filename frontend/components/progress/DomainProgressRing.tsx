"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TiltCard } from "@/components/landing/TiltCard";
import { DomainIcon } from "@/components/shared/DomainIcon";
import { styleFor } from "@/lib/domain-style";
import { cn } from "@/lib/utils";
import type { DomainProgressTile } from "@/lib/api";

type Props = {
  tile: DomainProgressTile;
  index?: number;
};

const SIZE = 120;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUM = 2 * Math.PI * RADIUS;

export function DomainProgressRing({ tile, index = 0 }: Props) {
  const s = styleFor(tile.color);
  const pct = tile.total === 0 ? 0 : tile.done / tile.total;
  const dashOffset = CIRCUM * (1 - pct);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Pointer-reactive tilt + glare — entrance stays on the outer motion
          wrapper so the two transforms never fight. */}
      <TiltCard
        max={7}
        className="group relative rounded-2xl border border-border bg-card/50 p-5 backdrop-blur transition-colors hover:border-primary/30"
      >
      <Link href={`/domains/${tile.slug}`} className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} className="-rotate-90">
            <defs>
              <linearGradient id={`grad-${tile.slug}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={cssStop(tile.color, "from")} />
                <stop offset="100%" stopColor={cssStop(tile.color, "to")} />
              </linearGradient>
            </defs>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={STROKE}
              opacity={0.3}
            />
            <motion.circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={`url(#grad-${tile.slug})`}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUM}
              initial={{ strokeDashoffset: CIRCUM }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1, delay: 0.15 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <DomainIcon name={tile.icon} className={cn("h-5 w-5", s.text)} />
            <div className="mt-0.5 text-xs font-semibold tabular-nums">
              {tile.done}/{tile.total}
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold tracking-tight text-foreground">
            {tile.name}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {Math.round(pct * 100)}% complete
          </div>
          {tile.avgScore !== null && (
            <div className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              avg {tile.avgScore}/5
            </div>
          )}
        </div>
      </Link>
      </TiltCard>
    </motion.div>
  );
}

// Map a tailwind color name to literal hex stops for the SVG gradient.
function cssStop(color: string, end: "from" | "to"): string {
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
