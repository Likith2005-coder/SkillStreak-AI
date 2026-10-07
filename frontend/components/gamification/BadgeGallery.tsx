"use client";

import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";
import type { Badge } from "@/lib/api";
import { Medal, toneFor } from "./Medal";

type Props = { badges: Badge[] };

export function BadgeGallery({ badges }: Props) {
  const reduce = useReducedMotionSafe();
  const earnedCount = badges.filter((b) => b.earnedAt).length;

  return (
    <div className="card-chunky p-5">
      <BadgeHeader earned={earnedCount} total={badges.length} />

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {badges.map((b, i) => {
          const earned = !!b.earnedAt;
          const tone = toneFor(b.icon);
          return (
            <motion.div
              key={b.slug}
              initial={reduce ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 360, damping: 18, delay: reduce ? 0 : i * 0.04 }}
              title={earned ? `Earned ${new Date(b.earnedAt!).toLocaleDateString()}` : "Locked"}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl border-2 border-b-4 px-3 pb-4 pt-5 text-center",
                earned ? cn("border-border", tone.tint) : "border-border bg-card",
              )}
            >
              <Medal icon={b.icon} earned={earned} />
              <div className={cn("mt-1 text-sm font-black", earned ? "text-foreground" : "text-muted-foreground")}>
                {b.name}
              </div>
              <div className="text-xs font-semibold leading-snug text-muted-foreground">{b.description}</div>
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
        <h3 className="text-lg font-black text-foreground">Badges</h3>
        <div className="mt-1.5 flex items-center gap-3">
          <div
            className="relative h-3 w-full max-w-[12rem] overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={earned}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={`${earned} of ${total} badges earned`}
          >
            <div className="relative h-full rounded-full bg-xp-bright" style={{ width: `${Math.max(pct, earned > 0 ? 8 : 0)}%` }}>
              <span className="absolute inset-x-1.5 top-[2px] h-1 rounded-full bg-white/40" />
            </div>
          </div>
          <span className="shrink-0 text-sm font-extrabold tabular-nums text-xp">
            {earned}/{total}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
