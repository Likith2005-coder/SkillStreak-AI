"use client";

import { useEffect } from "react";
import { Link } from "next-view-transitions";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { Check, RotateCcw, X } from "lucide-react";
import { SignalBotStatic } from "@/components/3d/SignalBotStatic";
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
  const reduce = useReducedMotion();
  // Confetti on a pass (a bigger burst on a perfect score), skipped
  // entirely for reduced motion; the green slab already carries the win.
  useEffect(() => {
    if (!passed || reduce) return;
    const big = score === total;
    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        origin: { y: 0.65 },
        spread: 80,
        startVelocity: 35,
        particleCount: Math.floor((big ? 200 : 90) * particleRatio),
        colors: ["#58cc02", "#1cb0f6", "#ffc800", "#ce82ff", "#ff9600"],
        ...opts,
      });
    };
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, [passed, score, total, reduce]);

  const percent = Math.round((score / total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-2xl space-y-10"
    >
      <section className="flex flex-col items-center text-center">
        <motion.div
          initial={reduce ? false : { scale: 0.5, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 12 }}
          className="h-28 w-28"
          aria-hidden
        >
          <SignalBotStatic className="h-full w-full" />
        </motion.div>
        <h2 className={cn("mt-4 font-display text-4xl", passed ? "text-xp" : "text-foreground")}>
          {score === total ? "Perfect lesson!" : passed ? "Lesson complete!" : "So close!"}
        </h2>
        <p className="mt-2 max-w-sm text-base font-semibold text-muted-foreground">
          {passed ? "Topic marked complete. Your streak thanks you." : "You need 3 out of 5 to complete this topic. New questions are one tap away."}
        </p>

        <div className="mt-7 grid w-full max-w-md grid-cols-2 gap-3">
          <ResultTile label="Score" value={`${score}/${total}`} face="bg-xp" edge="hsl(var(--xp-shade))" text="text-xp" delay={0.15} />
          <ResultTile
            label="Accuracy"
            value={`${percent}%`}
            face={passed ? "bg-primary" : "bg-destructive"}
            edge={passed ? "hsl(var(--primary-shade))" : "hsl(var(--destructive-shade))"}
            text={passed ? "text-primary" : "text-destructive-text"}
            delay={0.25}
          />
        </div>

        <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="flex-1">
            <Link href={`/topic/${topicId}`}>{passed ? "Continue" : "Back to topic"}</Link>
          </Button>
          <Button onClick={onRetake} variant="outline" size="lg" className="flex-1">
            <RotateCcw className="h-5 w-5" />
            Retake
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="px-1 text-lg font-black text-foreground">Review your answers</h3>
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
        "rounded-2xl border-2 border-b-4 bg-card p-5",
        item.correct ? "border-primary-bright/50" : "border-destructive-bright/50"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white",
            item.correct ? "bg-primary-bright" : "bg-destructive-bright"
          )}
        >
          {item.correct ? <Check className="h-4 w-4" strokeWidth={4} /> : <X className="h-4 w-4" strokeWidth={4} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-muted-foreground">Question {index + 1}</p>
          <p className="mt-0.5 text-base font-bold text-foreground">{item.question}</p>

          <div className="mt-3 space-y-1.5 text-sm">
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

          <p className="mt-3 text-sm font-semibold leading-relaxed text-muted-foreground">{item.explanation}</p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: "good" | "bad" }) {
  return (
    <div className="flex gap-2">
      <span className="font-semibold text-muted-foreground">{label}:</span>
      <span className={cn("font-extrabold", tone === "good" ? "text-primary" : "text-destructive-text")}>{value}</span>
    </div>
  );
}

function ResultTile({ label, value, face, edge, text, delay }: { label: string; value: string; face: string; edge: string; text: string; delay: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 18, delay: reduce ? 0 : delay }}
      className={cn("overflow-hidden rounded-2xl border-2", face)}
      style={{ borderColor: "transparent", boxShadow: `0 5px 0 ${edge}` }}
    >
      <p className="py-1 text-xs font-black uppercase tracking-wider text-white">{label}</p>
      <p className={cn("m-[2px] rounded-[14px] bg-card py-3 font-display text-2xl tabular-nums", text)}>{value}</p>
    </motion.div>
  );
}
