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

const SIZE = 92;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUM = 2 * Math.PI * RADIUS;

/**
 * One domain as a pressable panel: a thin glowing progress ring in the
 * domain's own colour, the icon in a tinted well at its centre, and the
 * numbers beside it as instrument readouts.
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
        className="card-chunky card-press spotlight focus-ring flex items-center gap-4 p-4 [--spot:var(--secondary)]"
      >
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} className="-rotate-90" aria-hidden>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="rgb(255 255 255 / 0.06)"
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
                style={{ filter: `drop-shadow(0 0 5px ${hex})` }}
                initial={reduce ? false : { strokeDashoffset: CIRCUM }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: reduce ? 0 : 1, delay: reduce ? 0 : 0.15 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className={cn("flex h-11 w-11 items-center justify-center rounded-full ring-1", s.iconBg, s.ring)}>
              <DomainIcon name={tile.icon} className={cn("h-5 w-5", s.text)} />
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-foreground">{tile.name}</div>
          <div className={cn("mt-0.5 font-display text-3xl tabular-nums leading-tight", s.text)}>
            {Math.round(pct * 100)}%
          </div>
          <div className="font-mono text-[11px] text-muted-foreground">
            {tile.done} of {tile.total} topics
          </div>
          {(tile.avgScore !== null || done) && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {done && (
                <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  Complete
                </span>
              )}
              {tile.avgScore !== null && (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
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
