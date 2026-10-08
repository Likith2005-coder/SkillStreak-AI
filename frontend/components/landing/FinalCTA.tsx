"use client";

/**
 * Closing CTA just before the footer: one glowing panel with a light beam
 * sweeping its border (the page's single `border-beam`), an aurora pool
 * rising from below, and the shared sign-up pair.
 */

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { HeroCTA } from "./HeroCTA";

export function FinalCTA() {
  const reduce = useReducedMotion();
  return (
    <section className="px-4 py-24 lg:px-12 lg:py-32">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: reduce ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
        // No overflow-hidden here: the beam rides the border, outside the
        // padding box, and would be clipped. No `spotlight` either: both
        // utilities draw with ::before.
        className="card-chunky border-beam relative mx-auto max-w-4xl rounded-[1.6rem] px-6 py-16 text-center shadow-[0_40px_120px_-40px_hsl(var(--aurora-2)/0.45)] sm:px-12 sm:py-20"
      >
        {/* Aurora pool rising from the bottom edge + faint grid */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <div className="absolute -bottom-40 left-1/2 h-80 w-[46rem] max-w-[160%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--aurora-4)/0.22),hsl(var(--aurora-3)/0.14)_45%,hsl(var(--aurora-1)/0.10)_70%,transparent)] blur-2xl" />
          <div className="grid-faint absolute inset-0 opacity-70" />
        </div>

        <div className="relative">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-energy/10 text-energy ring-1 ring-energy/25 shadow-[0_0_32px_-6px_hsl(var(--energy)/0.7)]">
            <Flame className="h-6 w-6" fill="currentColor" aria-hidden />
          </span>
          <h3 className="mx-auto mt-6 max-w-2xl font-display text-4xl leading-[1.05] [text-wrap:balance] md:text-6xl">
            Your first <span className="font-serif-accent text-energy [text-shadow:0_0_28px_hsl(var(--energy)/0.5)]">streak</span> is one
            click away.
          </h3>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground md:text-base">
            Sign up in 60 seconds. Start with the topic the AI tutor recommends.
          </p>

          <div className="mx-auto mt-9 max-w-md sm:max-w-none">
            <HeroCTA />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
