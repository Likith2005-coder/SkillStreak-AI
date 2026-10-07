"use client";

/**
 * One question, playground style: a big friendly prompt and four chunky
 * answer keys. Picking a key presses it into a blue "selected" state; once
 * the answer is checked the right key turns green and a wrong pick turns red
 * and shakes. Keys 1–4 pick from the keyboard (wired in QuizPlayer).
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
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
      transition={{ duration: reduce ? 0.12 : 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="font-display text-2xl text-foreground sm:text-3xl [text-wrap:balance]">{question}</h2>

      <div className="mt-7 grid gap-3" role="radiogroup" aria-label="Answers">
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
                    ? { scale: [1, 1.03, 1] }
                    : { x: 0, scale: 1 }
              }
              transition={{ duration: 0.4 }}
              className={cn(
                "focus-ring group flex w-full items-center gap-4 rounded-2xl border-2 border-b-[5px] px-4 py-3.5 text-left transition-[transform,background-color,border-color] duration-100",
                !revealed && "active:translate-y-[3px] active:border-b-2",
                !revealed && !isSelected && "border-border bg-card hover:bg-muted",
                !revealed && isSelected && "border-secondary-bright bg-secondary-bright/10",
                isCorrect && "border-primary-bright bg-primary-bright/15",
                isWrongPick && "border-destructive-bright bg-destructive-bright/10",
                idle && "border-border bg-card opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-black",
                  !revealed && !isSelected && "border-border text-muted-foreground",
                  !revealed && isSelected && "border-secondary-bright text-secondary",
                  isCorrect && "border-primary-bright bg-primary-bright text-white",
                  isWrongPick && "border-destructive-bright bg-destructive-bright text-white",
                  idle && "border-border text-muted-foreground",
                )}
              >
                {isCorrect ? <Check className="h-4 w-4" strokeWidth={4} /> : isWrongPick ? <X className="h-4 w-4" strokeWidth={4} /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-base font-bold leading-snug",
                  !revealed && isSelected ? "text-secondary" : isCorrect ? "text-primary" : isWrongPick ? "text-destructive-text" : "text-foreground",
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
