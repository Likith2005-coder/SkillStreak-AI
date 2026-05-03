"use client";

import { useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Award, Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuizBreakdownItem } from "@/lib/api";

type Props = {
  topicId: string;
  score: number;
  total: number;
  passed: boolean;
  breakdown: QuizBreakdownItem[];
  onRetake: () => void;
};

export function QuizResult({ topicId, score, total, passed, breakdown, onRetake }: Props) {
  // Confetti on perfect score.
  useEffect(() => {
    if (score !== total) return;
    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        origin: { y: 0.65 },
        spread: 80,
        startVelocity: 35,
        particleCount: Math.floor(160 * particleRatio),
        ...opts,
      });
    };
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, [score, total]);

  const percent = Math.round((score / total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      <section
        className={cn(
          "rounded-2xl border p-8 text-center backdrop-blur-md",
          passed
            ? "border-emerald-500/40 bg-emerald-500/10"
            : "border-rose-500/40 bg-rose-500/10"
        )}
      >
        <div
          className={cn(
            "mx-auto flex h-16 w-16 items-center justify-center rounded-full",
            passed ? "bg-emerald-500/20" : "bg-rose-500/20"
          )}
        >
          <Award className={cn("h-8 w-8", passed ? "text-emerald-300" : "text-rose-300")} />
        </div>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight">
          {score}/{total}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {percent}% · {passed ? "Topic marked complete." : "You need at least 3/5 to mark this complete."}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={onRetake} variant="outline">
            <RotateCcw className="h-4 w-4" />
            Retake with new questions
          </Button>
          <Button asChild>
            <Link href={`/topic/${topicId}`}>Back to topic</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="px-1 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Breakdown
        </h3>
        {breakdown.map((item, i) => (
          <BreakdownRow key={i} index={i} item={item} />
        ))}
      </section>
    </motion.div>
  );
}

function BreakdownRow({ index, item }: { index: number; item: QuizBreakdownItem }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 backdrop-blur",
        item.correct
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-rose-500/30 bg-rose-500/5"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
            item.correct ? "bg-emerald-500/20 text-emerald-200" : "bg-rose-500/20 text-rose-200"
          )}
        >
          {item.correct ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Q{index + 1}
          </div>
          <p className="mt-0.5 text-sm font-medium text-foreground">{item.question}</p>

          <div className="mt-3 space-y-1.5 text-xs">
            <Row
              label="You answered"
              value={item.options[item.selectedIndex]}
              tone={item.correct ? "good" : "bad"}
            />
            {!item.correct && (
              <Row
                label="Correct answer"
                value={item.options[item.correctIndex]}
                tone="good"
              />
            )}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{item.explanation}</p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: "good" | "bad" }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground">{label}:</span>
      <span className={cn(tone === "good" ? "text-emerald-300" : "text-rose-300")}>{value}</span>
    </div>
  );
}
