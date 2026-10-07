"use client";

/**
 * Word that rotates through a list inside a clipped "slot" — the outgoing word
 * slides up and out while the incoming word rises from below, both clipped to
 * the line box so nothing ever floats outside it. Used in the landing hero
 * ("Master tech" → "Master Cyber" → …).
 *
 * Baseline correctness: the invisible longest-word reserver stays IN FLOW so it
 * sets the element's width AND text baseline (an `overflow:hidden` box loses its
 * baseline and the word would float up). The animated words live in a *nested*
 * absolutely-positioned `overflow-hidden` layer, so the clip that contains the
 * slide never affects the outer baseline the headline aligns to.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";

interface RotatingWordProps {
  words: string[];
  /** Milliseconds between word swaps. */
  intervalMs?: number;
  className?: string;
}

export function RotatingWord({ words, intervalMs = 2200, className }: RotatingWordProps) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((n) => (n + 1) % words.length), intervalMs);
    return () => clearInterval(t);
  }, [reduce, words.length, intervalMs]);

  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), "");

  if (reduce) {
    return <span className={className}>{words[0]}</span>;
  }

  return (
    <span className="relative inline-block align-baseline">
      {/* In-flow reserver: sets width to the longest word and gives the element
          a real text baseline so the headline line stays aligned. */}
      <span aria-hidden className="invisible whitespace-nowrap">
        {longest}
      </span>
      {/* Nested clip layer — absolute so it doesn't disturb the baseline above,
          overflow-hidden so the vertical slide is contained to the line box. */}
      {/* The clip extends past the line box on every side, and the word is
          offset back by the same amount, so the baseline is unchanged. Without
          the bleed, tall ascenders/descenders and the text-shadow glow get
          sliced at the box edge into a visible rectangle. */}
      <span
        className="absolute -inset-x-[0.5em] -bottom-[0.35em] -top-[0.2em] overflow-hidden"
        style={{
          // Soft top/bottom edges instead of a hard clip: words fade as they
          // slide out (never painting over the line above), and the glow
          // never ends in a visible rectangle.
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0, #000 0.32em, #000 calc(100% - 0.4em), transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0, #000 0.32em, #000 calc(100% - 0.4em), transparent 100%)",
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={words[i]}
            initial={{ y: "70%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-70%", opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            // The gradient must live on the *visible* word — a stacked child
            // can't inherit a clipped gradient from an ancestor.
            className={`absolute left-[0.5em] top-[0.2em] whitespace-nowrap ${className ?? ""}`}
          >
            {words[i]}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
