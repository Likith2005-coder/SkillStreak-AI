"use client";

/**
 * Word that rotates through a list inside a clipped "slot" — the outgoing word
 * lifts away into a blur while the incoming one rises a short way out of one,
 * clipped to the line box so nothing paints over the lines around it. Used in the landing hero
 * ("Master tech" → "Master Cyber" → …).
 *
 * Baseline correctness: the invisible longest-word reserver stays IN FLOW so it
 * sets the element's width AND text baseline (an `overflow:hidden` box loses its
 * baseline and the word would float up). The animated words live in a *nested*
 * absolutely-positioned `overflow-hidden` layer, so the clip that contains the
 * slide never affects the outer baseline the headline aligns to.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

  // The slot is as wide as the word on show, not the longest word: a fixed
  // longest-word slot leaves empty space after short words ("AI"), which
  // pushes a centred headline visibly left. Widths come from invisible copies
  // of every word in the same font, re-measured when fonts load or the
  // viewport (and so the clamp()ed font size) changes.
  const measureRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [width, setWidth] = useState<number | null>(null);
  const [animateWidth, setAnimateWidth] = useState(false);
  const [resizeTick, setResizeTick] = useState(0);

  useLayoutEffect(() => {
    if (reduce) return;
    const el = measureRefs.current[i];
    if (el) setWidth(el.getBoundingClientRect().width);
  }, [i, reduce, resizeTick]);

  useEffect(() => {
    if (reduce) return;
    const bump = () => setResizeTick((n) => n + 1);
    window.addEventListener("resize", bump);
    document.fonts?.ready.then(bump);
    // Only animate width changes after the first measurement, so the slot
    // doesn't visibly shrink on load.
    const t = setTimeout(() => setAnimateWidth(true), 50);
    return () => {
      window.removeEventListener("resize", bump);
      clearTimeout(t);
    };
  }, [reduce]);

  if (reduce) {
    return <span className={className}>{words[0]}</span>;
  }

  return (
    <span
      className="relative inline-block align-baseline"
      style={{
        width: width ?? undefined,
        transition: animateWidth ? "width 0.5s cubic-bezier(0.22, 1, 0.36, 1)" : undefined,
      }}
    >
      {/* In-flow reserver: gives the element a real text baseline so the
          headline line stays aligned (its width is overridden above). */}
      <span aria-hidden className="invisible whitespace-nowrap">
        {longest}
      </span>
      {/* Invisible copies used only to measure each word's width. */}
      {words.map((w, n) => (
        <span
          key={w}
          aria-hidden
          ref={(el) => {
            measureRefs.current[n] = el;
          }}
          className="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap"
        >
          {w}
        </span>
      ))}
      {/* Nested clip layer — absolute so it doesn't disturb the baseline above,
          overflow-hidden so the vertical slide is contained to the line box. */}
      {/* The clip extends past the line box on every side, and the word is
          offset back by the same amount, so the baseline is unchanged. Without
          the bleed, tall ascenders/descenders and the text-shadow glow get
          sliced at the box edge into a visible rectangle. */}
      <span
        // The bottom bleed stays small: the headline's leading is tight (0.95),
        // so anything deeper paints the incoming word over the next line.
        className="absolute -inset-x-[0.5em] -bottom-[0.14em] -top-[0.2em] overflow-hidden"
        style={{
          // Soft top/bottom edges instead of a hard clip: words fade as they
          // slide out (never painting over the line above), and the glow
          // never ends in a visible rectangle.
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0, #000 0.32em, #000 calc(100% - 0.22em), transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0, #000 0.32em, #000 calc(100% - 0.22em), transparent 100%)",
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={words[i]}
            // A clean handoff: the outgoing word leaves fast (exits are quicker
            // than entrances), and the incoming one waits a beat, so the two
            // never share the slot at full strength.
            // A short rise out of a blur (the headline's own opening move):
            // the travel is small enough that the word never crosses into
            // the tightly-leaded line below.
            initial={{ y: "0.16em", opacity: 0, filter: "blur(8px)" }}
            animate={{ y: "0em", opacity: 1, filter: "blur(0px)", transition: { duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ y: "-0.22em", opacity: 0, filter: "blur(6px)", transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } }}
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
