"use client";

/**
 * Word-by-word fade-in headline. Splits a string into words, wraps each in
 * a span, and animates them in with a stagger when the element enters view.
 *
 * Use for big section headlines — gives the page a "title typing in" feel
 * without using scroll-jacking heavy plugins.
 */

import { motion, useReducedMotion } from "framer-motion";

interface RevealTextProps {
  text: string;
  className?: string;
  delay?: number;
  /** Stagger between word reveals (seconds). */
  stagger?: number;
  /** Render words inside this element. Default: span. */
  as?: "span" | "div";
}

export function RevealText({
  text,
  className,
  delay = 0,
  stagger = 0.045,
  as: Tag = "span",
}: RevealTextProps) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  if (reduce) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block"
          variants={{
            hidden: { opacity: 0, y: "0.4em", filter: "blur(4px)" },
            show: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
            },
          }}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </motion.span>
  );
}
