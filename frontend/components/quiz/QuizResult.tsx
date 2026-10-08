"use client";

import { useEffect, useState } from "react";
import { Link } from "next-view-transitions";
import confetti from "canvas-confetti";
import { animate, motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { ArrowRight, Check, RotateCcw, X } from "lucide-react";
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

// The aurora spectrum (violet, blue, cyan, volt) plus a white spark: the
// celebration palette. Literal hex because canvas-confetti can't read CSS vars.
const AURORA = ["#9f6bff", "#3d74ff", "#1fd5ff", "#b8ff3d", "#ffffff"];

const EASE = [0.22, 1, 0.36, 1] as const;

export function QuizResult({ topicId, score, total, passed, breakdown, onRetake }: Props) {
  const reduce = useReducedMotion();
  // Confetti on a pass (a bigger burst on a perfect score), skipped
  // entirely for reduced motion; the lit score already carries the win.
  useEffect(() => {
    if (!passed || reduce) return;
    const big = score === total;
    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        origin: { y: 0.45 },
        spread: 80,
        startVelocity: 35,
        particleCount: Math.floor((big ? 200 : 90) * particleRatio),
        colors: AURORA,
        ...opts,
      });
    };
    // Let the score land first, then burst.
    const t = setTimeout(() => {
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }, 450);
    return () => clearTimeout(t);
  }, [passed, score, total, reduce]);

  const percent = Math.round((score / total) * 100);
  const shownScore = useCountUp(score, reduce, 0.9, 0.2);
  const shownPct = useCountUp(percent, reduce, 1.1, 0.3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
      className="mx-auto max-w-2xl space-y-12"
    >
      <section
        className={cn(
          "card-chunky relative flex flex-col items-center px-5 pb-8 pt-10 text-center sm:px-10",
          passed && "border-beam"
        )}
      >
        {/* Light behind the moment: aurora on a pass, a dim red on a miss */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          {passed ? (
            <>
              <div className="absolute left-1/2 top-[-30%] h-[340px] w-[520px] -translate-x-1/2 rounded-full bg-aurora-1/25 blur-[80px]" />
              <div className="absolute left-[20%] top-[10%] h-[200px] w-[260px] rounded-full bg-aurora-3/15 blur-[70px]" />
              <div className="absolute right-[15%] top-[20%] h-[200px] w-[240px] rounded-full bg-primary/15 blur-[70px]" />
            </>
          ) : (
            <div className="absolute left-1/2 top-[-30%] h-[300px] w-[480px] -translate-x-1/2 rounded-full bg-destructive/10 blur-[80px]" />
          )}
          <div className="grid-faint absolute inset-0" />
        </div>

        <motion.div
          initial={reduce ? false : { scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 14 }}
          className="relative h-24 w-24"
          aria-hidden
        >
          <SignalBotStatic className="h-full w-full" />
        </motion.div>

        <p className="label-mono mt-5 text-muted-foreground">{passed ? "Topic complete" : "Not passed yet"}</p>
        <h2 className="mt-2 font-display text-[clamp(2.25rem,7vw,3.75rem)] leading-[1] text-foreground [text-wrap:balance]">
          {score === total ? (
            <>
              Perfect <span className="font-serif-accent text-glow text-primary">lesson.</span>
            </>
          ) : passed ? (
            <>
              Lesson <span className="font-serif-accent text-glow text-primary">complete.</span>
            </>
          ) : (
            <>
              So <span className="font-serif-accent text-destructive-text">close.</span>
            </>
          )}
        </h2>
        <p className="mt-3 max-w-sm text-base leading-relaxed text-muted-foreground">
          {passed ? "Topic marked complete. Your streak thanks you." : "You need 3 out of 5 to complete this topic. New questions are one tap away."}
        </p>

        {/* The score: big lit numbers that count up */}
        <div className="relative mt-8 grid w-full max-w-md grid-cols-2 divide-x divide-white/[0.08] rounded-xl border border-white/[0.08] bg-white/[0.03]">
          <ResultStat label="Score" delay={0.15} reduce={reduce}>
            <span className="text-xp [text-shadow:0_0_28px_hsl(var(--xp)/0.55)]">{shownScore}</span>
            <span className="text-muted-foreground">/{total}</span>
          </ResultStat>
          <ResultStat label="Accuracy" delay={0.25} reduce={reduce}>
            <span
              className={cn(
                passed ? "text-primary text-glow" : "text-destructive-text [text-shadow:0_0_28px_hsl(var(--destructive)/0.45)]"
              )}
            >
              {shownPct}
            </span>
            <span className="text-muted-foreground">%</span>
          </ResultStat>
        </div>

        <div className="relative mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:flex-1">
            <Link href={`/topic/${topicId}`}>
              {passed ? "Continue" : "Back to topic"} <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
            </Link>
          </Button>
          <Button onClick={onRetake} variant="outline" size="lg" className="w-full sm:flex-1">
            <RotateCcw className="h-4 w-4" strokeWidth={2.2} />
            Retake
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="px-1 font-display text-2xl text-foreground">Review your answers</h3>
        {breakdown.map((item, i) => (
          <BreakdownRow key={i} index={i} item={item} />
        ))}
      </section>
    </motion.div>
  );
}

/** Tween an integer from 0 to `to` once, on mount. Static for reduced motion. */
function useCountUp(to: number, reduce: boolean, duration: number, delay: number): number {
  const [v, setV] = useState(reduce ? to : 0);
  useEffect(() => {
    if (reduce) {
      setV(to);
      return;
    }
    const c = animate(0, to, {
      duration,
      delay,
      ease: EASE,
      onUpdate: (x) => setV(Math.round(x)),
      onComplete: () => setV(to),
    });
    return () => c.stop();
  }, [to, reduce, duration, delay]);
  return v;
}

function ResultStat({
  label,
  delay,
  reduce,
  children,
}: {
  label: string;
  delay: number;
  reduce: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 18, delay: reduce ? 0 : delay }}
      className="px-4 py-5"
    >
      <p className="label-mono text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-display text-5xl tabular-nums leading-none">{children}</p>
    </motion.div>
  );
}

function BreakdownRow({ index, item }: { index: number; item: QuizBreakdownItem }) {
  return (
    <div className={cn("card-chunky p-5", item.correct ? "!border-primary/25" : "!border-destructive/25")}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            item.correct
              ? "bg-primary text-primary-foreground shadow-[0_0_16px_-2px_hsl(var(--primary)/0.7)]"
              : "bg-destructive text-destructive-foreground shadow-[0_0_16px_-2px_hsl(var(--destructive)/0.7)]"
          )}
        >
          {item.correct ? <Check className="h-4 w-4" strokeWidth={3} /> : <X className="h-4 w-4" strokeWidth={3} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="label-mono text-muted-foreground">Question {String(index + 1).padStart(2, "0")}</p>
          <p className="mt-1 text-base font-semibold leading-snug text-foreground">{item.question}</p>

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

          <p className="mt-3 border-t border-white/[0.06] pt-3 text-sm leading-relaxed text-muted-foreground">{item.explanation}</p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: "good" | "bad" }) {
  return (
    <div className="flex gap-2">
      <span className="shrink-0 text-muted-foreground">{label}:</span>
      <span className={cn("font-medium", tone === "good" ? "text-primary" : "text-destructive-text")}>{value}</span>
    </div>
  );
}
