"use client";

import { motion } from "framer-motion";
import {
  Award,
  Flame,
  Footprints,
  Globe2,
  Lock,
  Moon,
  Rocket,
  Sunrise,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Badge } from "@/lib/api";

type Props = { badges: Badge[] };

const ICONS: Record<string, LucideIcon> = {
  footprints: Footprints,
  flame: Flame,
  trophy: Trophy,
  award: Award,
  rocket: Rocket,
  "globe-2": Globe2,
  moon: Moon,
  sunrise: Sunrise,
};

export function BadgeGallery({ badges }: Props) {
  const earnedCount = badges.filter((b) => b.earnedAt).length;

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Badges</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {earnedCount} of {badges.length} earned
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {badges.map((b, i) => {
          const Icon = ICONS[b.icon] ?? Award;
          const earned = !!b.earnedAt;
          return (
            <motion.div
              key={b.slug}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              title={earned ? `Earned ${new Date(b.earnedAt!).toLocaleDateString()}` : "Locked"}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition",
                earned
                  ? "border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5"
                  : "border-border bg-card/30 opacity-60 hover:opacity-90"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-transform group-hover:scale-110",
                  earned
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-muted/40 text-muted-foreground"
                )}
              >
                {earned ? <Icon className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
              </div>
              <div className="text-xs font-semibold tracking-tight text-foreground">{b.name}</div>
              <div className="text-[10px] leading-tight text-muted-foreground">
                {b.description}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
