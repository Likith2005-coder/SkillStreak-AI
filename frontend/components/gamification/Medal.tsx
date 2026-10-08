"use client";

/**
 * A badge as a lit medal: a dark disc with a coloured rim and an inner ring,
 * the glyph glowing in the badge's colour with a soft halo around it. Locked
 * medals are an unlit hairline disc with a lock. Shared by BadgeCoverflow and
 * BadgeGallery so both read as one trophy case.
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

/** `glow` is a CSS colour for halos; text/tint/ring are Tailwind classes. */
type Tone = { text: string; tint: string; ring: string; glow: string };

/** Per-badge colour so each medal feels like its own trophy, not a clone. */
export const BADGE_TONES: Record<string, Tone> = {
  footprints: { text: "text-secondary", tint: "bg-secondary/10", ring: "ring-secondary/40", glow: "hsl(var(--secondary) / 0.55)" },
  flame: { text: "text-energy", tint: "bg-energy/10", ring: "ring-energy/40", glow: "hsl(var(--energy) / 0.55)" },
  trophy: { text: "text-xp", tint: "bg-xp/10", ring: "ring-xp/40", glow: "hsl(var(--xp) / 0.55)" },
  award: { text: "text-grape", tint: "bg-grape/10", ring: "ring-grape/40", glow: "hsl(var(--grape) / 0.55)" },
  rocket: { text: "text-primary", tint: "bg-primary/10", ring: "ring-primary/40", glow: "hsl(var(--primary) / 0.55)" },
  "globe-2": { text: "text-teal-300", tint: "bg-teal-500/10", ring: "ring-teal-400/40", glow: "rgb(45 212 191 / 0.5)" },
  moon: { text: "text-indigo-300", tint: "bg-indigo-500/10", ring: "ring-indigo-400/40", glow: "rgb(129 140 248 / 0.5)" },
  sunrise: { text: "text-rose-300", tint: "bg-rose-500/10", ring: "ring-rose-400/40", glow: "rgb(251 113 133 / 0.5)" },
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
  const glyph = size === "lg" ? "h-10 w-10" : size === "sm" ? "h-6 w-6" : "h-7 w-7";
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full ring-1",
        dims,
        earned ? cn(tone.tint, tone.ring, tone.text) : "bg-white/[0.03] text-muted-foreground ring-white/10",
        className,
      )}
      style={
        earned
          ? { boxShadow: `0 0 32px -6px ${tone.glow}, inset 0 1px 0 rgb(255 255 255 / 0.12)` }
          : { boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.05)" }
      }
    >
      {/* inner ring */}
      <span
        className={cn(
          "absolute inset-[6px] rounded-full border",
          earned ? "border-current opacity-25" : "border-white/[0.07]",
        )}
      />
      {earned ? (
        <Icon className={cn("relative", glyph)} strokeWidth={1.75} style={{ filter: `drop-shadow(0 0 8px ${tone.glow})` }} />
      ) : (
        <Lock className={cn("relative", size === "lg" ? "h-8 w-8" : "h-5 w-5")} strokeWidth={1.75} />
      )}
    </span>
  );
}
