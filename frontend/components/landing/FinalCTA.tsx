"use client";

/**
 * Closing CTA section just before the footer. Mirror of the BurstSection's
 * gradient panel, but a small static one so users who scroll past the bento
 * grid still get a clear "sign up" prompt without scrolling back up.
 */

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { HeroCTA } from "./HeroCTA";

export function FinalCTA() {
  return (
    <section className="px-4 py-24 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-cyan-600 via-violet-600 to-violet-600 px-6 py-16 text-center text-white shadow-2xl shadow-violet-500/20 sm:px-12 sm:py-20"
      >
        {/* Decorative blobs */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_75%,rgba(255,255,255,0.18),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(217,70,239,0.30),transparent_50%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
          aria-hidden
        />

        <div className="relative">
          <Sparkles className="mx-auto h-9 w-9" />
          <h3 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight md:text-5xl">
            Your first streak is one click away.
          </h3>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/85 md:text-base">
            Sign up in 60 seconds. Start with the topic the AI tutor recommends.
          </p>

          <div className="mt-8">
            <HeroCTA />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
