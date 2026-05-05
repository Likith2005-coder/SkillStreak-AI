"use client";

/**
 * Shared "Get started for free" + "I already have an account" CTA pair.
 * Used by both BurstSection (mid-page) and FinalCTA (bottom). Keeping them
 * identical so the brand impression is consistent.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HeroCTA() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
      {/* Primary — white bg, gradient text, animated halo, shimmer sweep on hover */}
      <Link href="/register" className="group/cta relative inline-block">
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-full bg-gradient-to-r from-amber-300 via-fuchsia-400 to-violet-400 opacity-80 blur-lg transition-opacity duration-300 animate-cta-glow group-hover/cta:opacity-100"
        />
        <span className="relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-9 py-4 text-base font-extrabold tracking-wide shadow-2xl shadow-fuchsia-700/40 ring-1 ring-white/80 transition-transform duration-300 group-hover/cta:scale-[1.04] group-active/cta:scale-[0.98]">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/80 to-transparent transition-transform duration-700 ease-out group-hover/cta:translate-x-full"
          />
          <span className="relative bg-gradient-to-r from-violet-700 via-fuchsia-600 to-amber-500 bg-clip-text text-transparent">
            Get started for free
          </span>
          <ArrowRight className="relative h-5 w-5 text-fuchsia-600 transition-transform duration-300 group-hover/cta:translate-x-1" />
        </span>
      </Link>

      {/* Secondary — outlined, hover shows arrow */}
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
