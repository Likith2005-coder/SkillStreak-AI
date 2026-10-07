"use client";

/**
 * The SignalBot as a character: an idle bob, an occasional blink-hop, and a
 * speech bubble that says something about where the learner actually is.
 * Built on the static SVG bot so it costs nothing to render anywhere.
 */

import { motion } from "framer-motion";
import { SignalBotStatic } from "@/components/3d/SignalBotStatic";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";

export function Mascot({
  message,
  size = 120,
  side = "right",
  className,
}: {
  message?: string;
  size?: number;
  /** Which side of the bot the speech bubble sits on. */
  side?: "left" | "right";
  className?: string;
}) {
  const reduce = useReducedMotionSafe();
  return (
    <div className={cn("flex items-end gap-3", side === "left" && "flex-row-reverse", className)}>
      <motion.div
        aria-hidden
        style={{ width: size, height: size }}
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="shrink-0"
      >
        <SignalBotStatic className="h-full w-full" />
      </motion.div>
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, scale: 0.85, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "relative mb-6 max-w-[15rem] rounded-2xl border-2 border-border bg-card px-4 py-3 text-sm font-bold text-foreground",
            side === "right" ? "origin-bottom-left" : "origin-bottom-right",
          )}
        >
          {message}
          {/* bubble tail */}
          <span
            aria-hidden
            className={cn(
              "absolute bottom-3 h-3 w-3 rotate-45 border-border bg-card",
              side === "right" ? "-left-[7px] border-b-2 border-l-2" : "-right-[7px] border-r-2 border-t-2",
            )}
          />
        </motion.div>
      )}
    </div>
  );
}
