"use client";

/**
 * Page header used across the app, playground edition: a friendly status pill
 * (the old monospace eyebrow), a big heavy display title and a short subtitle,
 * with an optional slot on the right (stat, robot, badge, etc.).
 *
 * `ghost` is still accepted for compatibility but no longer rendered — the
 * giant outlined background word was dark-theme decoration.
 */

import { motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  icon,
  title,
  subtitle,
  right,
  className,
}: {
  eyebrow?: string;
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** @deprecated no longer rendered */
  ghost?: string;
  right?: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <header className={cn("relative pb-2 pt-4", className)}>
      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 12 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"
      >
        <div className="max-w-2xl">
          {eyebrow && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-extrabold text-primary [&_svg]:text-primary">
              {icon}
              {eyebrow}
            </span>
          )}
          <h1 className="mt-3 font-display text-4xl text-foreground sm:text-5xl [text-wrap:balance]">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-base font-semibold text-muted-foreground [text-wrap:pretty]">{subtitle}</p>
          )}
        </div>
        {right && <div className="relative shrink-0">{right}</div>}
      </motion.div>
    </header>
  );
}
