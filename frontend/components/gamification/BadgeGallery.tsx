"use client";

import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";
import type { Badge } from "@/lib/api";
import { Medal } from "./Medal";

type Props = { badges: Badge[] };

export function BadgeGallery({ badges }: Props) {
  const reduce = useReducedMotionSafe();
  const earnedCount = badges.filter((b) => b.earnedAt).length;

  return (
    <div className="card-chunky p-5">
      <BadgeHeader earned={earnedCount} total={badges.length} />

      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-4">
        {badges.map((b, i) => {
          const earned = !!b.earnedAt;
          return (
            <motion.div
              key={b.slug}
              initial={reduce ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 360, damping: 22, delay: reduce ? 0 : i * 0.04 }}
              title={earned ? `Earned ${new Date(b.earnedAt!).toLocaleDateString()}` : "Locked"}
              className="flex flex-col items-center gap-2 bg-card px-3 pb-5 pt-6 text-center"
            >
              <Medal icon={b.icon} earned={earned} />
              <div className={cn("mt-1 text-sm font-semibold", earned ? "text-foreground" : "text-muted-foreground")}>
                {b.name}
              </div>
              <div className="text-xs leading-snug text-muted-foreground">{b.description}</div>
              <span className="sr-only">{earned ? "Earned" : "Locked"}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function BadgeHeader({ earned, total, children }: { earned: number; total: number; children?: React.ReactNode }) {
  const pct = total > 0 ? (earned / total) * 100 : 0;
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-2xl text-foreground">
          Trophy <span className="font-serif-accent text-[1.15em] text-xp">case</span>
        </h3>
        <div className="mt-2 flex items-center gap-3">
          <div
            className="relative h-1.5 w-full max-w-[12rem] rounded-full bg-white/[0.06]"
            role="progressbar"
            aria-valuenow={earned}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={`${earned} of ${total} badges earned`}
          >
            <div
              className="h-full rounded-full bg-xp shadow-[0_0_10px_hsl(var(--xp)/0.7)]"
              style={{ width: `${Math.max(pct, earned > 0 ? 8 : 0)}%` }}
            />
          </div>
          <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-xp">
            {earned}/{total}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
