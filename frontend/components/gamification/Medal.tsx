"use client";

/**
 * A badge as a chunky medal: a solid coloured disc on its own darker edge,
 * a white icon, and a glossy inner ring. Locked medals are grey with a lock.
 * Shared by BadgeCoverflow and BadgeGallery so both read as one trophy case.
 */

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

export const BADGE_ICONS: Record<string, LucideIcon> = {
  footprints: Footprints,
  flame: Flame,
  trophy: Trophy,
  award: Award,
  rocket: Rocket,
  "globe-2": Globe2,
  moon: Moon,
  sunrise: Sunrise,
};

type Tone = { face: string; edge: string; text: string; tint: string };

/** Per-badge colour so each medal feels like its own trophy, not a clone. */
export const BADGE_TONES: Record<string, Tone> = {
  footprints: { face: "bg-secondary-bright", edge: "hsl(var(--secondary-shade))", text: "text-secondary", tint: "bg-secondary/10" },
  flame: { face: "bg-energy-bright", edge: "hsl(var(--energy-shade))", text: "text-energy", tint: "bg-energy/10" },
  trophy: { face: "bg-xp-bright", edge: "hsl(var(--xp-shade))", text: "text-xp", tint: "bg-xp/10" },
  award: { face: "bg-grape-bright", edge: "hsl(var(--grape-shade))", text: "text-grape", tint: "bg-grape/10" },
  rocket: { face: "bg-primary-bright", edge: "hsl(var(--primary-shade))", text: "text-primary", tint: "bg-primary/10" },
  "globe-2": { face: "bg-teal-500", edge: "hsl(175 84% 22%)", text: "text-teal-700", tint: "bg-teal-500/10" },
  moon: { face: "bg-indigo-500", edge: "hsl(244 55% 36%)", text: "text-indigo-700", tint: "bg-indigo-500/10" },
  sunrise: { face: "bg-rose-500", edge: "hsl(345 70% 36%)", text: "text-rose-700", tint: "bg-rose-500/10" },
};

export const FALLBACK_TONE = BADGE_TONES.award;

export function toneFor(icon: string): Tone {
  return BADGE_TONES[icon] ?? FALLBACK_TONE;
}

export function Medal({
  icon,
  earned,
  size = "md",
  className,
}: {
  icon: string;
  earned: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const Icon = BADGE_ICONS[icon] ?? Award;
  const tone = toneFor(icon);
  const dims = size === "lg" ? "h-24 w-24" : size === "sm" ? "h-14 w-14" : "h-16 w-16";
  const glyph = size === "lg" ? "h-11 w-11" : size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const edge = size === "lg" ? 6 : 4;
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full",
        dims,
        earned ? tone.face : "bg-muted",
        className,
      )}
      style={{ boxShadow: `0 ${edge}px 0 ${earned ? tone.edge : "hsl(var(--border))"}` }}
    >
      {/* glossy inner ring */}
      <span
        className={cn(
          "absolute inset-[5px] rounded-full border-[3px]",
          earned ? "border-white/40" : "border-border",
        )}
      />
      {earned ? (
        <Icon className={cn("relative text-white", glyph)} strokeWidth={2.6} />
      ) : (
        <Lock className={cn("relative text-muted-foreground", size === "lg" ? "h-9 w-9" : "h-6 w-6")} strokeWidth={2.6} />
      )}
    </span>
  );
}
