"use client";

/**
 * Cinematic page header used across the app — a bordered panel with the neon
 * knowledge-grid horizon, a giant ghost word, a monospace eyebrow, and a
 * gradient title. Mirrors the landing hero so the whole product feels like one
 * world. Pass `right` for a slot on the right (stat, robot, badge, etc.).
 */

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  icon,
  title,
  subtitle,
  ghost,
  right,
  className,
}: {
  eyebrow?: string;
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  ghost?: string;
  right?: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/50 bg-card/20 px-6 pb-16 pt-8 backdrop-blur-sm lg:px-8",
        className
      )}
    >
      {/* Neon knowledge-grid horizon */}
      <div className="grid-scene" aria-hidden>
        <div className="grid-floor" />
      </div>
      {/* Giant ghost word */}
      {ghost && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 flex items-center overflow-hidden opacity-[0.55]"
        >
          <span className="ghost-word pl-4 text-[16vw] leading-none lg:text-[9vw]">{ghost}</span>
        </div>
      )}

      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 12 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"
      >
        <div className="max-w-2xl">
          {eyebrow && (
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.28em] text-primary/70">
              {icon}
              {eyebrow}
            </div>
          )}
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {right && <div className="relative z-10 shrink-0">{right}</div>}
      </motion.div>
    </header>
  );
}
