"use client";

/**
 * Shared "Get started for free" + "I already have an account" CTA pair.
 * Used by both BurstSection (mid-page) and FinalCTA (bottom). Keeping them
 * identical so the brand impression is consistent.
 *
 * Design notes:
 * - White button, single violet text — calm, readable, premium. No loud
 *   multi-color gradient text.
 * - Subtle halo at low opacity that breathes slowly.
 * - Gentle idle micro-animations (button breath, arrow sway) so it never
 *   feels static, but never demands attention either.
 * - On hover: scale, shimmer sweep, arrow nudge — visible but quiet.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Magnetic } from "./Magnetic";

export function HeroCTA() {
  const reduce = useReducedMotion();

  return (
    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
      {/* Primary — wrapped in Magnetic so it gently pulls toward the cursor */}
      <Magnetic strength={10} className="inline-block">
      <Link href="/register" className="group/cta relative inline-block">
        {/* Subtle halo — slow breath, low opacity, never strobing */}
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1.5 rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 opacity-30 blur-md transition-opacity duration-500 animate-cta-breathe group-hover/cta:opacity-60"
        />

        <motion.span
          // Gentle idle scale — like a slow inhale/exhale.
          animate={reduce ? undefined : { scale: [1, 1.015, 1] }}
          transition={
            reduce
              ? undefined
              : { duration: 3.6, ease: "easeInOut", repeat: Infinity }
          }
          className="relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-9 py-4 text-base font-semibold tracking-wide text-violet-700 shadow-xl shadow-violet-900/20 ring-1 ring-violet-200/60 transition-all duration-300 group-hover/cta:shadow-2xl group-hover/cta:shadow-fuchsia-500/30 group-hover/cta:ring-violet-300 group-active/cta:scale-[0.98]"
        >
          {/* Shimmer — visible only on hover, single sweep */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-violet-200/60 to-transparent transition-transform duration-700 ease-out group-hover/cta:translate-x-full"
          />
          <span className="relative">Get started for free</span>

          {/* Arrow with gentle idle sway + hover nudge */}
          <motion.span
            className="relative inline-block"
            animate={reduce ? undefined : { x: [0, 2, 0] }}
            transition={
              reduce
                ? undefined
                : { duration: 1.8, ease: "easeInOut", repeat: Infinity }
            }
          >
            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover/cta:translate-x-1" />
          </motion.span>
        </motion.span>
      </Link>
      </Magnetic>

      {/* Secondary — outlined, hover reveals arrow */}
      <Link
        href="/login"
        className="group/sec relative inline-flex items-center justify-center gap-1 rounded-full border-2 border-white/60 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white hover:bg-white/20"
      >
        <span className="relative">I already have an account</span>
        <ArrowRight className="ml-1 h-4 w-4 -translate-x-1 opacity-0 transition-all duration-300 group-hover/sec:translate-x-0 group-hover/sec:opacity-100" />
      </Link>
    </div>
  );
}
