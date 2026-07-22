"use client";

/**
 * Mini animated chat demo inside the "Streaming AI tutor" bento card.
 *
 * Plays once when scrolled into view: user asks a question, the tutor
 * "streams" back an answer with a syntax-highlighted code block and a copy
 * button — a live demonstration of the card's copy instead of empty space.
 */

import { motion, useReducedMotion } from "framer-motion";
import { Bot, Check, Copy } from "lucide-react";

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export function TutorPreview() {
  const reduced = useReducedMotion();
  // With reduced motion everything renders in place, fully visible.
  const anim = (delay: number) => (reduced ? {} : rise(delay));

  return (
    <div className="mt-6 space-y-3 text-[13px] leading-relaxed">
      {/* Chat header */}
      <motion.div {...anim(0.1)} className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/25 ring-1 ring-violet-400/30">
          <Bot className="h-4 w-4 text-violet-300" />
        </span>
        <span className="font-medium text-foreground/90">AI Tutor</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
          {!reduced && (
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-emerald-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
          )}
          {reduced && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
          streaming
        </span>
      </motion.div>

      {/* User bubble */}
      <motion.div {...anim(0.25)} className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm border border-cyan-400/25 bg-cyan-500/10 px-3.5 py-2 text-foreground/90">
          How do I hash a password safely in Node?
        </div>
      </motion.div>

      {/* Tutor bubble with code block */}
      <motion.div {...anim(0.5)} className="flex justify-start">
        <div className="max-w-[95%] space-y-2.5 rounded-2xl rounded-bl-sm border border-border/70 bg-background/50 px-3.5 py-2.5">
          <p className="text-muted-foreground">
            Never store plain text — use{" "}
            <span className="text-violet-300">bcrypt</span> with a salt round of
            10+:
          </p>

          {/* Code block with copy button — the feature, demonstrated */}
          <div className="overflow-hidden rounded-lg border border-border/70 bg-black/50 font-mono text-[11.5px]">
            <div className="flex items-center justify-between border-b border-border/60 bg-white/[0.03] px-3 py-1.5">
              <span className="text-[10px] text-muted-foreground">hash.js</span>
              <span className="inline-flex items-center gap-1 rounded border border-border/70 px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-foreground">
                <Copy className="h-3 w-3" /> Copy
              </span>
            </div>
            <div className="space-y-0.5 px-3 py-2.5 leading-[1.7]">
              <p>
                <span className="text-violet-300">const</span>{" "}
                <span className="text-cyan-300">hash</span>{" "}
                <span className="text-muted-foreground">=</span>{" "}
                <span className="text-violet-300">await</span>{" "}
                <span className="text-foreground/90">bcrypt.hash(</span>
                <span className="text-cyan-300">pw</span>
                <span className="text-foreground/90">, </span>
                <span className="text-amber-300">10</span>
                <span className="text-foreground/90">);</span>
              </p>
              <p className="flex items-center gap-1">
                <span className="text-emerald-300/80">
                  {"// stored ✓ — never reversible"}
                </span>
                {!reduced && (
                  <motion.span
                    aria-hidden
                    className="inline-block h-3.5 w-[7px] bg-violet-400"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                  />
                )}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Follow-up chips — the "intent-classified follow-ups" claim */}
      <motion.div {...anim(0.85)} className="flex flex-wrap gap-2 pt-0.5">
        <span className="rounded-full border border-border/70 bg-card/60 px-2.5 py-1 text-[11px] text-muted-foreground">
          Why salt rounds?
        </span>
        <span className="rounded-full border border-border/70 bg-card/60 px-2.5 py-1 text-[11px] text-muted-foreground">
          Quiz me on this
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300">
          <Check className="h-3 w-3" /> saved to history
        </span>
      </motion.div>
    </div>
  );
}
