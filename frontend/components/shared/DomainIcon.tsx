import type { CSSProperties } from "react";
import {
  Brain,
  Cloud,
  Code2,
  Cpu,
  Database,
  GitBranch,
  Link as LinkIcon,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  "shield-check": ShieldCheck,
  "code-2": Code2,
  brain: Brain,
  "trending-up": TrendingUp,
  database: Database,
  cloud: Cloud,
  "git-branch": GitBranch,
  link: LinkIcon,
  cpu: Cpu,
};

export function DomainIcon({
  name,
  className,
  strokeWidth,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}

/**
 * Per-domain colours for the Midnight theme, as literal hex for inline styles
 * (glows, luminous lines and alpha tints can't be built from Tailwind tints):
 *   bright — the domain's light source: fills, glows, the lit trail
 *   light  — text/icon colour that clears 4.5:1 on the near-black panels
 *   edge   — a deeper stop for gradients toward the dark
 *   face   — mid stop (kept for older callers)
 *   shade  — the darkest stop, for depth in banners
 */
type DomainPalette = { bright: string; light: string; edge: string; face: string; shade: string };

const PALETTES: Record<string, DomainPalette> = {
  rose: { bright: "#fb7185", light: "#fda4af", edge: "#be123c", face: "#e11d48", shade: "#4c0519" },
  blue: { bright: "#60a5fa", light: "#93c5fd", edge: "#1d4ed8", face: "#2563eb", shade: "#172554" },
  violet: { bright: "#a78bfa", light: "#c4b5fd", edge: "#6d28d9", face: "#7c3aed", shade: "#2e1065" },
  emerald: { bright: "#34d399", light: "#6ee7b7", edge: "#047857", face: "#059669", shade: "#022c22" },
  cyan: { bright: "#22d3ee", light: "#67e8f9", edge: "#0e7490", face: "#0891b2", shade: "#083344" },
  sky: { bright: "#38bdf8", light: "#7dd3fc", edge: "#0369a1", face: "#0284c7", shade: "#082f49" },
  orange: { bright: "#fb923c", light: "#fdba74", edge: "#c2410c", face: "#ea580c", shade: "#431407" },
  amber: { bright: "#fbbf24", light: "#fcd34d", edge: "#b45309", face: "#d97706", shade: "#451a03" },
  teal: { bright: "#2dd4bf", light: "#5eead4", edge: "#0f766e", face: "#0d9488", shade: "#042f2e" },
  indigo: { bright: "#818cf8", light: "#a5b4fc", edge: "#4338ca", face: "#4f46e5", shade: "#1e1b4b" },
};

export function domainPalette(color: string): DomainPalette {
  return PALETTES[color] ?? PALETTES.indigo;
}

/** `#rrggbb` + alpha (0..1) → `#rrggbbaa`, for inline glows and tints. */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

/**
 * A domain's icon well: a dark rounded square tinted with the domain colour,
 * a hairline rim in that colour and a soft glow, the glyph lit in the
 * domain's light tone. `tone="white"` (historic name) is the brighter,
 * more saturated well for use on a domain-lit banner.
 * `tilt` is accepted for API compatibility; Midnight tiles sit straight.
 * Extra `style` (e.g. a view-transition name) is merged onto the tile.
 */
export function DomainTile({
  name,
  color,
  size = 56,
  tone = "bright",
  className,
  style,
}: {
  name: string;
  color: string;
  size?: number;
  tilt?: number;
  tone?: "bright" | "white";
  className?: string;
  style?: CSSProperties;
}) {
  const p = domainPalette(color);
  const strong = tone === "white";
  return (
    <span
      aria-hidden
      className={cn("relative flex shrink-0 items-center justify-center rounded-[28%]", className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(120% 120% at 30% 0%, ${withAlpha(p.bright, strong ? 0.32 : 0.22)}, ${withAlpha(
          p.bright,
          strong ? 0.1 : 0.05
        )} 70%), hsl(var(--card))`,
        boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.12), 0 0 0 1px ${withAlpha(p.bright, strong ? 0.5 : 0.32)}, 0 0 ${Math.round(
          size * 0.5
        )}px -${Math.round(size * 0.12)}px ${withAlpha(p.bright, strong ? 0.65 : 0.45)}`,
        color: p.light,
        ...style,
      }}
    >
      <DomainIcon
        name={name}
        strokeWidth={2}
        className="h-[48%] w-[48%] drop-shadow-[0_0_8px_currentColor]"
      />
    </span>
  );
}
