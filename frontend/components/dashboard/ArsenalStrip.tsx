"use client";

/**
 * The Ethical Hacking Arsenal's door: a slim green-phosphor terminal strip at
 * the foot of the dashboard. It keeps the Arsenal's own world (green on black,
 * mono) rather than Midnight's volt.
 */

import { motion } from "framer-motion";
import { Link } from "next-view-transitions";
import { ChevronRight, Terminal } from "lucide-react";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

export function ArsenalStrip() {
  const reduce = useReducedMotionSafe();
  return (
    // next-view-transitions' Link doesn't forward refs, so motion wraps it.
    <motion.div
      whileHover={reduce ? undefined : { y: -2 }}
      whileTap={reduce ? undefined : { scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <Link
        href="/toolkit"
        className="focus-ring group relative flex min-h-[64px] items-center gap-4 overflow-hidden rounded-[1.1rem] border border-emerald-500/25 bg-[#030806] px-5 py-3 font-mono text-emerald-100 shadow-[inset_0_1px_0_rgb(52_211_153/0.08),0_12px_32px_-16px_rgb(0_0_0/0.8)] transition-[border-color,box-shadow] duration-300 hover:border-emerald-400/50 hover:shadow-[inset_0_1px_0_rgb(52_211_153/0.12),0_0_36px_-8px_rgb(16_185_129/0.45)]"
      >
        {/* phosphor grid + glow */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(52_211_153/0.06)_1px,transparent_1px),linear-gradient(90deg,rgb(52_211_153/0.06)_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:radial-gradient(ellipse_at_right,#000_10%,transparent_70%)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 top-1/2 h-32 w-48 -translate-y-1/2 rounded-full bg-emerald-500/15 blur-2xl"
        />

        <span
          aria-hidden
          className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
        >
          <Terminal className="h-4 w-4" />
        </span>
        <span className="relative flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4">
          <span className="shrink-0 text-[11px] uppercase tracking-[0.2em] text-emerald-400">
            Secret level
          </span>
          <span className="truncate font-sans text-base font-semibold text-emerald-50 [text-shadow:0_0_18px_rgb(52_211_153/0.35)]">
            Ethical Hacking Arsenal
          </span>
          <span className="hidden truncate text-xs text-emerald-200/80 md:inline">
            <span className="text-emerald-400">$</span> 37 real tools · 5 attack
            phases
            <span className="ml-1 inline-block h-3 w-1.5 translate-y-0.5 animate-pulse bg-emerald-400 motion-reduce:animate-none" />
          </span>
        </span>
        <ChevronRight
          className="relative h-5 w-5 shrink-0 text-emerald-400 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
          aria-hidden
        />
      </Link>
    </motion.div>
  );
}
