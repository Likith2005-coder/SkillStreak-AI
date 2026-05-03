"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  index: number;
  total: number;
  question: string;
  options: string[];
  selected: number | null;
  revealed: boolean;
  correctIndex?: number;
  explanation?: string;
  onSelect: (i: number) => void;
};

const LABELS = ["A", "B", "C", "D"];

export function QuestionCard({
  index,
  total,
  question,
  options,
  selected,
  revealed,
  correctIndex,
  explanation,
  onSelect,
}: Props) {
  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, rotateY: -90 }}
      animate={{ opacity: 1, rotateY: 0 }}
      exit={{ opacity: 0, rotateY: 90 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformPerspective: 1200 }}
      className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur-md sm:p-8"
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
        <span>
          Question {index + 1} of {total}
        </span>
      </div>

      <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {question}
      </h2>

      <div className="mt-6 grid gap-3">
        {options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = revealed && i === correctIndex;
          const isWrongPick = revealed && isSelected && i !== correctIndex;

          return (
            <motion.button
              key={i}
              type="button"
              onClick={() => !revealed && onSelect(i)}
              disabled={revealed}
              whileHover={!revealed ? { x: 4 } : undefined}
              whileTap={!revealed ? { scale: 0.985 } : undefined}
              animate={isWrongPick ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
              transition={isWrongPick ? { duration: 0.4 } : { duration: 0.2 }}
              className={cn(
                "group flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                !revealed && isSelected && "border-primary/60 bg-primary/10",
                !revealed && !isSelected && "border-border bg-card/50 hover:border-primary/40",
                isCorrect && "border-emerald-500/60 bg-emerald-500/15",
                isWrongPick && "border-rose-500/60 bg-rose-500/15",
                revealed && !isCorrect && !isWrongPick && "border-border bg-card/30 opacity-60"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  isCorrect && "border-emerald-500/60 bg-emerald-500/20 text-emerald-200",
                  isWrongPick && "border-rose-500/60 bg-rose-500/20 text-rose-200",
                  !revealed && "border-border text-muted-foreground group-hover:text-foreground",
                  revealed && !isCorrect && !isWrongPick && "border-border text-muted-foreground"
                )}
              >
                {revealed && isCorrect ? (
                  <Check className="h-4 w-4" />
                ) : revealed && isWrongPick ? (
                  <X className="h-4 w-4" />
                ) : (
                  LABELS[i]
                )}
              </span>
              <span className="text-sm leading-relaxed text-foreground">{opt}</span>
            </motion.button>
          );
        })}
      </div>

      {revealed && explanation && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="mt-5 rounded-xl border border-border bg-card/50 p-4 text-sm text-muted-foreground"
        >
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground">
            Explanation
          </div>
          {explanation}
        </motion.div>
      )}
    </motion.div>
  );
}
