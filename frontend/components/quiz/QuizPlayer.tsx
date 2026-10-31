"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Loader2, Sparkles, X } from "lucide-react";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  apiErrorMessage,
  generateQuiz,
  submitQuiz,
  type QuizGenerateResponse,
  type QuizSubmitResponse,
} from "@/lib/api";
import { QuestionCard } from "./QuestionCard";
import { QuizTimer } from "./QuizTimer";
import { QuizResult } from "./QuizResult";

type Props = {
  topicId: string;
  topicTitle: string;
};

const TIMER_SECONDS = 60;
const PRAISE = ["Nice!", "Correct!", "You got it!", "Spot on!", "Brilliant!"];

type Phase = "loading" | "ready" | "submitting" | "done" | "error";

export function QuizPlayer({ topicId, topicTitle }: Props) {
  const [quiz, setQuiz] = useState<QuizGenerateResponse | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);

  const [result, setResult] = useState<QuizSubmitResponse | null>(null);
  const [timerOn, setTimerOn] = useState(true);
  const reduce = useReducedMotionSafe();

  const load = useCallback(
    async (fresh: boolean) => {
      setPhase("loading");
      setErrorMsg(null);
      setCurrent(0);
      setSelected(null);
      setRevealed(false);
      setAnswers([]);
      setResult(null);
      try {
        const data = await generateQuiz(topicId, fresh);
        setQuiz(data);
        setPhase("ready");
      } catch (err) {
        setErrorMsg(apiErrorMessage(err, "Could not generate the quiz. Try again."));
        setPhase("error");
      }
    },
    [topicId]
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const reveal = useCallback(
    (pick: number | null) => {
      if (revealed) return;
      const final = pick ?? -1; // -1 means timed out / no pick
      setSelected(pick);
      setRevealed(true);
      setAnswers((a) => [...a, final]);
    },
    [revealed]
  );

  const next = useCallback(async () => {
    if (!quiz) return;
    if (current < quiz.questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setRevealed(false);
      return;
    }
    setPhase("submitting");
    try {
      // Replace any -1 (timeouts) with the user's selection at that step or 0 as default
      const safe = answers.map((a) => (a < 0 || a > 3 ? 0 : a));
      const res = await submitQuiz(topicId, safe);
      setResult(res);
      setPhase("done");
      const { surfaceGamification } = await import("@/lib/gamification-toasts");
      surfaceGamification(res.gamification);
    } catch (err) {
      setErrorMsg(apiErrorMessage(err, "Could not submit the quiz."));
      setPhase("error");
    }
  }, [quiz, current, answers, topicId]);

  // Keyboard: 1-4 pick an answer, Enter checks it, Enter again continues.
  useEffect(() => {
    if (phase !== "ready" || !quiz) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const n = Number(e.key);
      if (!revealed && n >= 1 && n <= quiz.questions[current].options.length) {
        setSelected(n - 1);
      } else if (e.key === "Enter" && !(t && t.tagName === "BUTTON")) {
        if (!revealed && selected !== null) reveal(selected);
        else if (revealed) next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, quiz, current, revealed, selected, reveal, next]);

  if (phase === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center" role="status">
        <span className="relative flex h-14 w-14 items-center justify-center">
          <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-primary/20 motion-reduce:animate-none" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/30 shadow-[0_0_32px_-4px_hsl(var(--primary)/0.6)]">
            <Sparkles className="h-6 w-6" strokeWidth={2} />
          </span>
        </span>
        <div>
          <p className="font-display text-2xl text-foreground">Writing your quiz</p>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">5 questions on {topicTitle}, tuned to your level…</p>
        </div>
      </div>
    );
  }

  if (phase === "error" || !quiz) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-destructive/30 bg-destructive/10 p-6">
        <p className="text-sm text-destructive-text">{errorMsg ?? "Quiz unavailable."}</p>
        <Button onClick={() => load(true)} variant="outline" className="mt-4">
          Try again
        </Button>
      </div>
    );
  }

  if (phase === "done" && result) {
    return (
      <QuizResult
        topicId={topicId}
        score={result.score}
        total={result.total}
        passed={result.passed}
        breakdown={result.breakdown}
        onRetake={() => load(true)}
      />
    );
  }

  const total = quiz.questions.length;
  const q = quiz.questions[current];
  const progressPct = ((current + (revealed ? 1 : 0)) / total) * 100;
  const gotIt = revealed && selected === q.correctIndex;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="flex items-center gap-4">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]"
          role="progressbar"
          aria-valuenow={Math.round(progressPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Question ${current + 1} of ${total}`}
        >
          <div
            className="h-full w-full origin-left rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.7)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ transform: `scaleX(${Math.max(progressPct, 3) / 100})` }}
          />
        </div>
        {timerOn && (
          <QuizTimer
            resetKey={`${current}-${quiz.questions.length}`}
            seconds={TIMER_SECONDS}
            paused={revealed || phase === "submitting"}
            onExpire={() => reveal(selected)}
          />
        )}
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <span className="flex min-w-0 items-center gap-1.5 font-medium text-grape">
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden /> <span className="truncate">{topicTitle}</span>
        </span>
        <span className="rounded-full border border-grape/25 bg-grape/10 px-2.5 py-0.5 text-xs font-medium capitalize text-grape">{quiz.level}</span>
        <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
          {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={() => setTimerOn((v) => !v)}
          className="focus-ring inline-flex min-h-9 items-center rounded-md px-1 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Timer {timerOn ? "on" : "off"}
        </button>
      </div>

      <div className="mt-4">
        <AnimatePresence mode="wait">
          <QuestionCard
            key={current}
            index={current}
            question={q.question}
            options={q.options}
            selected={selected}
            revealed={revealed}
            correctIndex={q.correctIndex}
            onSelect={(i) => setSelected(i)}
          />
        </AnimatePresence>
      </div>

      {/* The feedback slab: quiet until checked, then tinted volt or red with
          the explanation and the Continue key inside. */}
      <div
        className={cn(
          "relative mt-8 overflow-hidden rounded-xl border p-4 transition-[background-color,border-color,box-shadow] duration-300 sm:p-5",
          !revealed && "border-transparent",
          revealed && gotIt && "border-primary/35 bg-primary/[0.07] shadow-[0_0_48px_-16px_hsl(var(--primary)/0.6)]",
          revealed && !gotIt && "border-destructive/35 bg-destructive/[0.07] shadow-[0_0_48px_-16px_hsl(var(--destructive)/0.6)]",
        )}
      >
        {revealed && (
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 h-px",
              gotIt
                ? "bg-gradient-to-r from-transparent via-primary to-transparent"
                : "bg-gradient-to-r from-transparent via-destructive to-transparent",
            )}
          />
        )}
        <AnimatePresence initial={false}>
          {revealed && (
            <motion.div
              key="feedback"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mb-4 flex items-start gap-3"
              role="status"
            >
              <motion.span
                initial={reduce ? false : { scale: 0.6, rotate: -20, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  gotIt
                    ? "bg-primary text-primary-foreground shadow-[0_0_24px_-2px_hsl(var(--primary)/0.8)]"
                    : "bg-destructive text-destructive-foreground shadow-[0_0_24px_-2px_hsl(var(--destructive)/0.8)]",
                )}
                aria-hidden
              >
                {gotIt ? <Check className="h-5 w-5" strokeWidth={3} /> : <X className="h-5 w-5" strokeWidth={3} />}
              </motion.span>
              <div>
                <p className={cn("font-display text-2xl", gotIt ? "text-primary text-glow" : "text-destructive-text")}>
                  {gotIt ? PRAISE[current % PRAISE.length] : selected === null ? "Out of time!" : "Not quite."}
                </p>
                {!gotIt && q.correctIndex !== undefined && (
                  <p className="mt-1 text-sm font-medium text-destructive-text">
                    Correct answer: {q.options[q.correctIndex]}
                  </p>
                )}
                {q.explanation && <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-foreground/85">{q.explanation}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between gap-3">
          <p className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            {revealed ? (
              <>
                Press <Kbd>Enter</Kbd> to continue
              </>
            ) : (
              <>
                <Kbd>1</Kbd>–<Kbd>4</Kbd> to pick, <Kbd>Enter</Kbd> to check
              </>
            )}
          </p>
          {!revealed ? (
            <Button size="lg" className="w-full sm:ml-auto sm:w-44" onClick={() => reveal(selected)} disabled={selected === null}>
              Check
            </Button>
          ) : (
            <Button
              size="lg"
              variant={gotIt ? "default" : "destructive"}
              className="w-full sm:ml-auto sm:w-44"
              onClick={next}
              disabled={phase === "submitting"}
            >
              {phase === "submitting" ? (
                <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" />
              ) : current === total - 1 ? (
                "See result"
              ) : (
                <>
                  Continue <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-white/15 bg-white/[0.04] px-1 font-mono text-[10px] text-foreground/80">
      {children}
    </kbd>
  );
}
