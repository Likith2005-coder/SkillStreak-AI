// Tailwind class mappings for the per-domain accent color.
// Tailwind needs to see the literal class names at build time, so we keep
// the full strings here rather than constructing them dynamically.

export type DomainColor =
  | "rose"
  | "blue"
  | "violet"
  | "emerald"
  | "cyan"
  | "sky"
  | "orange"
  | "amber"
  | "teal"
  | "indigo";

type DomainStyle = {
  ring: string;
  text: string;
  iconBg: string;
  cardHover: string;
  badgeBg: string;
  gradientFrom: string;
  gradientTo: string;
};

const STYLES: Record<DomainColor, DomainStyle> = {
  rose: {
    ring: "ring-rose-500/30",
    text: "text-rose-400",
    iconBg: "bg-rose-500/10",
    cardHover: "hover:border-rose-500/40",
    badgeBg: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    gradientFrom: "from-rose-500",
    gradientTo: "to-pink-500",
  },
  blue: {
    ring: "ring-blue-500/30",
    text: "text-blue-400",
    iconBg: "bg-blue-500/10",
    cardHover: "hover:border-blue-500/40",
    badgeBg: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    gradientFrom: "from-blue-500",
    gradientTo: "to-indigo-500",
  },
  violet: {
    ring: "ring-violet-500/30",
    text: "text-violet-400",
    iconBg: "bg-violet-500/10",
    cardHover: "hover:border-violet-500/40",
    badgeBg: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    gradientFrom: "from-violet-500",
    gradientTo: "to-fuchsia-500",
  },
  emerald: {
    ring: "ring-emerald-500/30",
    text: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    cardHover: "hover:border-emerald-500/40",
    badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    gradientFrom: "from-emerald-500",
    gradientTo: "to-teal-500",
  },
  cyan: {
    ring: "ring-cyan-500/30",
    text: "text-cyan-400",
    iconBg: "bg-cyan-500/10",
    cardHover: "hover:border-cyan-500/40",
    badgeBg: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    gradientFrom: "from-cyan-500",
    gradientTo: "to-sky-500",
  },
  sky: {
    ring: "ring-sky-500/30",
    text: "text-sky-400",
    iconBg: "bg-sky-500/10",
    cardHover: "hover:border-sky-500/40",
    badgeBg: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    gradientFrom: "from-sky-500",
    gradientTo: "to-blue-500",
  },
  orange: {
    ring: "ring-orange-500/30",
    text: "text-orange-400",
    iconBg: "bg-orange-500/10",
    cardHover: "hover:border-orange-500/40",
    badgeBg: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    gradientFrom: "from-orange-500",
    gradientTo: "to-amber-500",
  },
  amber: {
    ring: "ring-amber-500/30",
    text: "text-amber-400",
    iconBg: "bg-amber-500/10",
    cardHover: "hover:border-amber-500/40",
    badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    gradientFrom: "from-amber-500",
    gradientTo: "to-yellow-500",
  },
  teal: {
    ring: "ring-teal-500/30",
    text: "text-teal-400",
    iconBg: "bg-teal-500/10",
    cardHover: "hover:border-teal-500/40",
    badgeBg: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    gradientFrom: "from-teal-500",
    gradientTo: "to-emerald-500",
  },
  indigo: {
    ring: "ring-indigo-500/30",
    text: "text-indigo-400",
    iconBg: "bg-indigo-500/10",
    cardHover: "hover:border-indigo-500/40",
    badgeBg: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    gradientFrom: "from-indigo-500",
    gradientTo: "to-violet-500",
  },
};

const FALLBACK = STYLES.indigo;

export function styleFor(color: string): DomainStyle {
  return STYLES[color as DomainColor] ?? FALLBACK;
}

// Literal hex stops per accent, for inline styles (glows, gradients) that
// can't use Tailwind classes. Matches DomainProgressRing's SVG stops.
const HEX_STOPS: Record<DomainColor, [string, string]> = {
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

export function hexFor(color: string): [string, string] {
  return HEX_STOPS[color as DomainColor] ?? HEX_STOPS.indigo;
}
