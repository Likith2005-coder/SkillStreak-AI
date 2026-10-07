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
 * Per-domain colours in the Playground roles, as literal hex for inline
 * styles (solid slabs and 3D edges can't be built from Tailwind tints):
 *   bright — juicy fill for icon tiles and bars (matches the roadmap nodes)
 *   edge   — the bright tile's 3D bottom edge
 *   face   — slab colour that carries white text at >= 4.5:1
 *   shade  — the face slab's 3D bottom edge
 */
type DomainPalette = { bright: string; edge: string; face: string; shade: string };

const PALETTES: Record<string, DomainPalette> = {
  rose: { bright: "#f43f5e", edge: "#be123c", face: "#e11d48", shade: "#9f1239" },
  blue: { bright: "#3b82f6", edge: "#1d4ed8", face: "#2563eb", shade: "#1e3a8a" },
  violet: { bright: "#8b5cf6", edge: "#6d28d9", face: "#7c3aed", shade: "#4c1d95" },
  emerald: { bright: "#10b981", edge: "#047857", face: "#047857", shade: "#064e3b" },
  cyan: { bright: "#06b6d4", edge: "#0e7490", face: "#0e7490", shade: "#164e63" },
  sky: { bright: "#0ea5e9", edge: "#0369a1", face: "#0369a1", shade: "#0c4a6e" },
  orange: { bright: "#f97316", edge: "#c2410c", face: "#c2410c", shade: "#7c2d12" },
  amber: { bright: "#f59e0b", edge: "#b45309", face: "#b45309", shade: "#78350f" },
  teal: { bright: "#14b8a6", edge: "#0f766e", face: "#0f766e", shade: "#134e4a" },
  indigo: { bright: "#6366f1", edge: "#4338ca", face: "#4f46e5", shade: "#312e81" },
};

export function domainPalette(color: string): DomainPalette {
  return PALETTES[color] ?? PALETTES.indigo;
}

/**
 * A chunky sticker tile for a domain: rounded square, slight tilt, 3D edge.
 * `tone="bright"` is the coloured tile with a white glyph (on white cards);
 * `tone="white"` is a white tile with a coloured glyph (on a coloured slab).
 * Extra `style` (e.g. a view-transition name) is merged onto the tile.
 */
export function DomainTile({
  name,
  color,
  size = 56,
  tilt = -6,
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
  const edge = Math.max(3, Math.round(size / 12));
  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center rounded-2xl", className)}
      style={{
        width: size,
        height: size,
        background: tone === "bright" ? p.bright : "#fff",
        boxShadow: `0 ${edge}px 0 ${tone === "bright" ? p.edge : "rgba(0,0,0,0.22)"}`,
        // white glyph on the bright tile; face-coloured glyph on the white one
        color: tone === "bright" ? "#fff" : p.face,
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        ...style,
      }}
    >
      <DomainIcon name={name} strokeWidth={2.6} className="h-[52%] w-[52%]" />
    </span>
  );
}
