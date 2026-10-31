"use client";

/**
 * The welcome-header SignalBot, whose speech bubble carries a rotating
 * "Did you know?" fact for the learner's current domain. Rotates every 8s
 * with a soft crossfade while the tab is visible and the bubble isn't
 * hovered or focused. Every tip is laid into the same grid cell invisibly so
 * the bubble is sized to the longest one and never jumps. Under reduced
 * motion it stays on one tip and the "Next" button swaps instantly.
 */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, RefreshCw } from "lucide-react";
import { Mascot } from "@/components/playground/Mascot";
import { tipsFor } from "@/components/playground/tips";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;
const ROTATE_MS = 8000;

export function MascotTips({
  domainSlug,
  domainName,
  size = 104,
  className,
  bubbleClassName = "mb-4 w-[20rem] max-w-none",
}: {
  domainSlug?: string;
  domainName?: string;
  size?: number;
  className?: string;
  bubbleClassName?: string;
}) {
  const reduce = useReducedMotionSafe();
  const tips = useMemo(() => tipsFor(domainSlug), [domainSlug]);
  // Start on a day-dependent tip so each visit isn't the same first line.
  const [i, setI] = useState(() => new Date().getDate() % tips.length);
  const [paused, setPaused] = useState(false);
  const idx = i % tips.length;

  useEffect(() => {
    if (reduce || paused) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") setI((n) => (n + 1) % tips.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reduce, paused, tips.length]);

  const bubble = (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="label-mono flex min-w-0 items-center gap-1.5 text-grape">
          <Lightbulb className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">Did you know?</span>
          {domainName && <span className="sr-only"> ({domainName})</span>}
        </p>
        <button
          type="button"
          onClick={() => setI((n) => (n + 1) % tips.length)}
          aria-label="Next tip"
          className="focus-ring group -my-2 -mr-2 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
        >
          <RefreshCw
            className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90 motion-reduce:transition-none"
            aria-hidden
          />
        </button>
      </div>
      <div className="mt-2 grid" aria-live="polite">
        {/* Sizers: the longest tip sets the bubble height. */}
        {tips.map((t, k) => (
          <p key={k} aria-hidden className="invisible text-sm leading-snug [grid-area:1/1] [text-wrap:pretty]">
            {t}
          </p>
        ))}
        <AnimatePresence initial={false}>
          <motion.p
            key={`${domainSlug}-${idx}`}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -4 }}
            transition={{ duration: reduce ? 0 : 0.45, ease: EASE }}
            className="text-sm leading-snug text-foreground [grid-area:1/1] [text-wrap:pretty]"
          >
            {tips[idx]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="mt-3 flex gap-1" aria-hidden>
        {tips.map((_, k) => (
          <span
            key={k}
            className={cn(
              "h-0.5 flex-1 rounded-full transition-colors duration-300",
              k === idx ? "bg-grape shadow-[0_0_6px_hsl(var(--grape)/0.8)]" : "bg-white/10",
            )}
          />
        ))}
      </div>
    </div>
  );

  return (
    <Mascot
      bubble={bubble}
      size={size}
      side="left"
      className={className}
      bubbleClassName={bubbleClassName}
    />
  );
}
