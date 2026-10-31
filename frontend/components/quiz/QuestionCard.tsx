"use client";

/**
 * One question, Midnight style: a big display prompt and four sleek answer
 * rows. Picking a row lights it blue ("selected"); once the answer is checked
 * the right row glows volt with a check and a wrong pick turns red and shakes.
 * Keys 1–4 pick from the keyboard (wired in QuizPlayer).
 */

import { motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  index: number;
  question: string;
  options: string[];
  selected: number | null;
  revealed: boolean;
  correctIndex?: number;
  onSelect: (i: number) => void;
};

export function QuestionCard({ index, question, options, selected, revealed, correctIndex, onSelect }: Props) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={index}
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={
        reduce
          ? { opacity: 0, transition: { duration: 0.1 } }
          : { opacity: 0, x: -24, transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] } }
      }
      transition={{ duration: reduce ? 0.12 : 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2
        className={cn(
          "font-display leading-[1.15] text-foreground sm:leading-[1.1] [text-wrap:balance]",
          // Long questions step down so the answers stay on screen.
          question.length > 120 ? "text-[1.35rem] sm:text-[1.75rem]" : "text-[1.5rem] sm:text-4xl",
        )}
      >
        {question}
      </h2>

      <div className="mt-8 grid gap-2.5" role="radiogroup" aria-label="Answers">
        {options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = revealed && i === correctIndex;
          const isWrongPick = revealed && isSelected && i !== correctIndex;
          const idle = revealed && !isCorrect && !isWrongPick;

          return (
            <motion.button
              key={i}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => !revealed && onSelect(i)}
              disabled={revealed}
              animate={
                isWrongPick && !reduce
                  ? { x: [0, -10, 10, -7, 7, 0] }
                  : isCorrect && !reduce
                    ? { scale: [1, 1.02, 1] }
                    : { x: 0, scale: 1 }
              }
              // A small press on the control people hit most; the shake and the
              // correct-answer pulse keep their longer timing.
              whileTap={revealed || reduce ? undefined : { scale: 0.98 }}
              transition={isCorrect || isWrongPick ? { duration: 0.4 } : { duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "focus-ring group flex min-h-[60px] w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-[background-color,border-color,box-shadow,opacity] duration-200",
                !revealed && !isSelected && "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]",
                !revealed && isSelected &&
                  "border-secondary/70 bg-secondary/10 shadow-[0_0_0_1px_hsl(var(--secondary)/0.5),0_0_32px_-8px_hsl(var(--secondary)/0.7)]",
                isCorrect &&
                  "border-primary/70 bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.5),0_0_36px_-8px_hsl(var(--primary)/0.75)]",
                isWrongPick &&
                  "border-destructive/70 bg-destructive/10 shadow-[0_0_0_1px_hsl(var(--destructive)/0.45),0_0_32px_-10px_hsl(var(--destructive)/0.7)]",
                idle && "border-white/[0.06] bg-white/[0.02] opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-mono text-[13px] font-medium transition-colors duration-200",
                  !revealed && !isSelected && "border-white/15 text-muted-foreground group-hover:border-white/25 group-hover:text-foreground",
                  !revealed && isSelected && "border-secondary bg-secondary text-secondary-foreground",
                  isCorrect && "border-primary bg-primary text-primary-foreground",
                  isWrongPick && "border-destructive bg-destructive text-destructive-foreground",
                  idle && "border-white/10 text-muted-foreground",
                )}
              >
                {isCorrect ? <Check className="h-4 w-4" strokeWidth={3} /> : isWrongPick ? <X className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-base font-medium leading-snug",
                  !revealed && isSelected ? "text-secondary-bright" : isCorrect ? "text-primary" : isWrongPick ? "text-destructive-text" : "text-foreground",
                )}
              >
                {opt}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
