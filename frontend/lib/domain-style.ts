// Tailwind class mappings for the per-domain accent color, tuned for the
// bright theme: text at the 700 step clears 4.5:1 on white and on the tinted
// 100-step chips; badges use 800 on their tint.
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
    text: "text-rose-700",
    iconBg: "bg-rose-100",
    cardHover: "hover:border-rose-500/40",
    badgeBg: "bg-rose-100 text-rose-800 border-rose-200",
    gradientFrom: "from-rose-500",
    gradientTo: "to-pink-500",
  },
  blue: {
    ring: "ring-blue-500/30",
    text: "text-blue-700",
    iconBg: "bg-blue-100",
    cardHover: "hover:border-blue-500/40",
    badgeBg: "bg-blue-100 text-blue-800 border-blue-200",
    gradientFrom: "from-blue-500",
    gradientTo: "to-indigo-500",
  },
  violet: {
    ring: "ring-violet-500/30",
    text: "text-violet-700",
    iconBg: "bg-violet-100",
    cardHover: "hover:border-violet-500/40",
    badgeBg: "bg-violet-100 text-violet-800 border-violet-200",
    gradientFrom: "from-violet-500",
    gradientTo: "to-fuchsia-500",
  },
  emerald: {
    ring: "ring-emerald-500/30",
    text: "text-emerald-700",
    iconBg: "bg-emerald-100",
    cardHover: "hover:border-emerald-500/40",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
    gradientFrom: "from-emerald-500",
    gradientTo: "to-teal-500",
  },
  cyan: {
    ring: "ring-cyan-500/30",
    text: "text-cyan-700",
    iconBg: "bg-cyan-100",
    cardHover: "hover:border-cyan-500/40",
    badgeBg: "bg-cyan-100 text-cyan-800 border-cyan-200",
    gradientFrom: "from-cyan-500",
    gradientTo: "to-sky-500",
  },
  sky: {
    ring: "ring-sky-500/30",
    text: "text-sky-700",
    iconBg: "bg-sky-100",
    cardHover: "hover:border-sky-500/40",
    badgeBg: "bg-sky-100 text-sky-800 border-sky-200",
    gradientFrom: "from-sky-500",
    gradientTo: "to-blue-500",
  },
  orange: {
    ring: "ring-orange-500/30",
    text: "text-orange-700",
    iconBg: "bg-orange-100",
    cardHover: "hover:border-orange-500/40",
    badgeBg: "bg-orange-100 text-orange-800 border-orange-200",
    gradientFrom: "from-orange-500",
    gradientTo: "to-amber-500",
  },
  amber: {
    ring: "ring-amber-500/30",
    text: "text-amber-700",
    iconBg: "bg-amber-100",
    cardHover: "hover:border-amber-500/40",
    badgeBg: "bg-amber-100 text-amber-800 border-amber-200",
    gradientFrom: "from-amber-500",
    gradientTo: "to-yellow-500",
  },
  teal: {
    ring: "ring-teal-500/30",
    text: "text-teal-700",
    iconBg: "bg-teal-100",
    cardHover: "hover:border-teal-500/40",
    badgeBg: "bg-teal-100 text-teal-800 border-teal-200",
    gradientFrom: "from-teal-500",
    gradientTo: "to-emerald-500",
  },
  indigo: {
    ring: "ring-indigo-500/30",
    text: "text-indigo-700",
    iconBg: "bg-indigo-100",
    cardHover: "hover:border-indigo-500/40",
    badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-200",
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
