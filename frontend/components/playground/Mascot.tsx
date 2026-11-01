"use client";

/**
 * The SignalBot as a character: an idle bob over a soft glow, a live bot
 * that watches the cursor and reacts (SignalBotLive), and a sleek speech
 * bubble that says something about where the learner actually is.
 *
 * When the bot says a reactive line ("Let's go!", "Boop!", a bus line…) it
 * briefly takes over the bubble: the normal content fades out but keeps its
 * size (so nothing shifts), the line pops in on top, and after ~2.5s the
 * normal content returns. Without a bubble, the bot shows its own floating one.
 */

import { useCallback, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SignalBotLive } from "@/components/3d/SignalBotLive";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";

export function Mascot({
  message,
  bubble,
  bubbleClassName,
  size = 120,
  side = "right",
  className,
  quiet,
}: {
  message?: string;
  /** Custom bubble content (e.g. a rotating tip); replaces `message`. */
  bubble?: ReactNode;
  bubbleClassName?: string;
  size?: number;
  /** Which side of the bot the speech bubble sits on. */
  side?: "left" | "right";
  className?: string;
  /** The bot never says reactive lines. */
  quiet?: boolean;
}) {
  const reduce = useReducedMotionSafe();
  const hasBubble = !!(bubble || message);
  const [quip, setQuip] = useState<{ id: number; text: string } | null>(null);
  const n = useRef(0);
  const onSay = useCallback((text: string | null) => setQuip(text ? { id: ++n.current, text } : null), []);

  return (
    <div className={cn("flex items-end gap-3", side === "left" && "flex-row-reverse", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        {/* soft light pool under the bot */}
        <span
          aria-hidden
          className="absolute inset-x-[10%] bottom-0 h-1/3 rounded-full bg-[radial-gradient(closest-side,hsl(var(--aurora-3)/0.35),transparent)] blur-md"
        />
        <div className="anim-bob-6 relative h-full w-full">
          <SignalBotLive className="h-full w-full" onSay={hasBubble ? onSay : undefined} quiet={quiet} />
        </div>
      </div>
      {hasBubble && (
        <motion.div
          key={bubble ? "bubble" : message}
          initial={reduce ? false : { opacity: 0, scale: 0.9, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "relative mb-6 max-w-[15rem] rounded-xl border border-white/10 bg-card/90 px-4 py-3 text-sm leading-snug text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_16px_40px_-16px_rgb(0_0_0/0.8)] backdrop-blur-sm",
            side === "right" ? "origin-bottom-left" : "origin-bottom-right",
            bubbleClassName,
          )}
        >
          <div
            className={cn(
              "transition-opacity duration-200 motion-reduce:transition-none",
              quip && "pointer-events-none opacity-0",
            )}
          >
            {bubble ?? message}
          </div>
          {/* A reactive line sits on top of the normal content for a moment. */}
          <AnimatePresence>
            {quip && (
              <motion.p
                key={quip.id}
                aria-hidden
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: reduce ? 0 : 0.15 } }}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 24 }}
                className="pointer-events-none absolute inset-0 grid place-items-center px-4 text-center text-base font-semibold text-foreground [text-wrap:balance]"
              >
                {quip.text}
              </motion.p>
            )}
          </AnimatePresence>
          {/* bubble tail */}
          <span
            aria-hidden
            className={cn(
              "absolute bottom-3 h-2.5 w-2.5 rotate-45 border-white/10 bg-card",
              side === "right" ? "-left-[6px] border-b border-l" : "-right-[6px] border-r border-t",
            )}
          />
        </motion.div>
      )}
    </div>
  );
}
