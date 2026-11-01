"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Scroll-reveal wrapper — content eases up + fades in as it enters the
 * viewport, once. The staggered, spring-timed entrance is what separates a
 * "premium, hand-directed" feel from a flat AI-generated page.
 */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * A section heading that rises out of a mask, once, as it enters the
 * viewport, with a thin line of light drawing out beneath it.
 *
 *   variant "rise"  the heading slides up from behind its own baseline
 *   variant "focus" it also comes into focus (a one-off blur), for variety
 *   line            where the light line sits: centred, left, or none
 *
 * The clip only exists while the heading is moving: once it lands the mask is
 * dropped so glows and descenders are never shaved. Transform/opacity only,
 * plus a single short blur for "focus". Reduced motion: static and visible.
 */
export function MaskHeading({
  children,
  id,
  className,
  wrapClassName,
  variant = "rise",
  line = "center",
  delay = 0,
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
  wrapClassName?: string;
  variant?: "rise" | "focus";
  line?: "center" | "left" | "none";
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const [landed, setLanded] = useState(false);
  const clip = !reduce && !landed;
  // Watch the wrapper, not the heading: the heading starts below its own clip
  // box, so an observer on it would see nothing and never fire.
  const wrap = useRef<HTMLDivElement>(null);
  const seen = useInView(wrap, { once: true, amount: 0.5 });
  const on = seen || reduce;
  const hidden =
    variant === "focus" ? { y: "70%", opacity: 0, filter: "blur(10px)" } : { y: "105%", opacity: 0.2 };
  const shown =
    variant === "focus"
      ? { y: "0%", opacity: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }
      : { y: "0%", opacity: 1 };

  return (
    <div ref={wrap} className={wrapClassName}>
      {/* Padding + equal negative margin: the clip box bleeds past the line box
          so descenders survive the mask without shifting layout. */}
      <div className={cn("-my-[0.18em] py-[0.18em]", clip && "overflow-hidden")}>
        <motion.h2
          id={id}
          className={className}
          initial={hidden}
          animate={on ? shown : hidden}
          transition={{ duration: reduce ? 0 : variant === "focus" ? 1.05 : 0.95, delay: reduce ? 0 : delay, ease: EASE }}
          onAnimationComplete={() => on && setLanded(true)}
        >
          {children}
        </motion.h2>
      </div>
      {line !== "none" && (
        <motion.span
          aria-hidden
          initial={{ scaleX: 0, opacity: 0 }}
          animate={on ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
          transition={{ duration: reduce ? 0 : 1.1, delay: reduce ? 0 : delay + 0.35, ease: EASE }}
          className={cn(
            "mt-5 block h-px w-28 bg-[linear-gradient(90deg,transparent,hsl(var(--aurora-3)),hsl(var(--primary)),transparent)] shadow-[0_0_14px_1px_hsl(var(--aurora-3)/0.55)] md:w-40",
            line === "center" ? "mx-auto origin-center" : "origin-left",
          )}
        />
      )}
    </div>
  );
}

/**
 * A soft seam of light between two sections: a hairline that draws out from
 * the centre with a faint glow pooled under it, so sections flow into each
 * other instead of meeting at a hard edge.
 */
export function Seam({ className, tone = "aurora-2" }: { className?: string; tone?: "aurora-1" | "aurora-2" | "aurora-3" | "primary" }) {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden className={cn("pointer-events-none relative mx-auto h-px w-full max-w-5xl px-4", className)}>
      <motion.div
        initial={{ scaleX: 0.2, opacity: 0 }}
        {...{ [reduce ? "animate" : "whileInView"]: { scaleX: 1, opacity: 1 } }}
        viewport={{ once: true, amount: 1 }}
        transition={{ duration: reduce ? 0 : 1.6, ease: EASE }}
        className="relative h-px w-full origin-center"
        style={{ background: `linear-gradient(90deg, transparent, hsl(var(--${tone}) / 0.55) 50%, transparent)` }}
      >
        <span
          className="absolute left-1/2 top-1/2 h-24 w-[70%] -translate-x-1/2 -translate-y-1/2"
          style={{ background: `radial-gradient(closest-side, hsl(var(--${tone}) / 0.12), transparent)` }}
        />
      </motion.div>
    </div>
  );
}
