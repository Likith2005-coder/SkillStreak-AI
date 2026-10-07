"use client";

import { Link } from "next-view-transitions";
import { motion } from "framer-motion";
import { DomainIcon } from "@/components/shared/DomainIcon";
import { hexFor, styleFor } from "@/lib/domain-style";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";
import type { DomainProgressTile } from "@/lib/api";

type Props = {
  tile: DomainProgressTile;
  index?: number;
};

const SIZE = 104;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUM = 2 * Math.PI * RADIUS;

/**
 * One domain as a chunky pressable tile: a fat progress ring in the domain's
 * own colour, the icon in the middle, and the numbers beside it.
 */
export function DomainProgressRing({ tile, index = 0 }: Props) {
  const reduce = useReducedMotionSafe();
  const s = styleFor(tile.color);
  const [hex] = hexFor(tile.color);
  const pct = tile.total === 0 ? 0 : tile.done / tile.total;
  const dashOffset = CIRCUM * (1 - pct);
  const done = tile.total > 0 && tile.done >= tile.total;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.35, delay: reduce ? 0 : index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/domains/${tile.slug}`}
        className="card-chunky card-press focus-ring flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
      >
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} className="-rotate-90" aria-hidden>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={STROKE}
            />
            {pct > 0 && (
              <motion.circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={hex}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRCUM}
                initial={reduce ? false : { strokeDashoffset: CIRCUM }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: reduce ? 0 : 1, delay: reduce ? 0 : 0.15 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className={cn("flex h-12 w-12 items-center justify-center rounded-full", s.iconBg)}>
              <DomainIcon name={tile.icon} className={cn("h-6 w-6", s.text)} />
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-black text-foreground">{tile.name}</div>
          <div className={cn("mt-0.5 text-2xl font-black tabular-nums", s.text)}>
            {Math.round(pct * 100)}%
          </div>
          <div className="text-xs font-bold text-muted-foreground">
            {tile.done} of {tile.total} topics
          </div>
          {(tile.avgScore !== null || done) && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {done && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-extrabold text-primary">
                  Complete
                </span>
              )}
              {tile.avgScore !== null && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-extrabold text-muted-foreground">
                  Avg {tile.avgScore}/5
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
