"use client";

/**
 * Word that rotates through a list with a smooth in/out animation. Used
 * in the landing hero ("Master tech" → "Master Cybersecurity" → …).
 *
 * Uses framer-motion's AnimatePresence with mode="popLayout" so the
 * outgoing and incoming words swap in place without layout jitter.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

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

  if (reduce) {
    return <span className={className}>{words[0]}</span>;
  }

  return (
    <span className={`relative inline-block align-baseline ${className ?? ""}`}>
      {/* Reserve width to the longest word so the line doesn't reflow */}
      <span aria-hidden className="invisible whitespace-nowrap">
        {words.reduce((a, b) => (b.length > a.length ? b : a), "")}
      </span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={words[i]}
          initial={{ y: "0.6em", opacity: 0, filter: "blur(6px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-0.6em", opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 whitespace-nowrap"
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
