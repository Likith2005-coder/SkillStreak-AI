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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin motion-reduce:animate-none" />
        <p className="text-sm">Generating a 5-question quiz on {topicTitle}…</p>
      </div>
    );
  }

  if (phase === "error" || !quiz) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6">
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
          className="h-4 flex-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(progressPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Question ${current + 1} of ${total}`}
        >
          <div
            className="relative h-full rounded-full bg-primary-bright transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${Math.max(progressPct, 4)}%` }}
          >
            <span className="absolute inset-x-2 top-[3px] h-1.5 rounded-full bg-white/35" />
          </div>
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

      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-extrabold text-grape">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4" aria-hidden /> {topicTitle}
        </span>
        <span className="rounded-full bg-grape/10 px-2.5 py-0.5 text-xs uppercase tracking-wider">{quiz.level}</span>
        <span className="ml-auto text-muted-foreground">
          {current + 1} / {total}
        </span>
        <button
          type="button"
          onClick={() => setTimerOn((v) => !v)}
          className="focus-ring rounded-md text-xs font-bold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
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

      {/* The feedback slab: neutral until checked, then green or red with the
          explanation and the Continue key, Duolingo-style. */}
      <div
        className={cn(
          "mt-8 rounded-2xl border-2 p-4 transition-colors duration-200 sm:p-5",
          !revealed && "border-transparent",
          revealed && gotIt && "border-primary-bright/40 bg-primary-bright/10",
          revealed && !gotIt && "border-destructive-bright/40 bg-destructive-bright/10",
        )}
      >
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
                initial={reduce ? false : { scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 14 }}
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white",
                  gotIt ? "bg-primary-bright" : "bg-destructive-bright",
                )}
                aria-hidden
              >
                {gotIt ? <Check className="h-6 w-6" strokeWidth={4} /> : <X className="h-6 w-6" strokeWidth={4} />}
              </motion.span>
              <div>
                <p className={cn("font-display text-xl", gotIt ? "text-primary" : "text-destructive-text")}>
                  {gotIt ? PRAISE[current % PRAISE.length] : selected === null ? "Out of time!" : "Not quite."}
                </p>
                {!gotIt && q.correctIndex !== undefined && (
                  <p className="mt-0.5 text-sm font-bold text-destructive-text">
                    Correct answer: {q.options[q.correctIndex]}
                  </p>
                )}
                {q.explanation && <p className="mt-1.5 text-sm font-semibold text-foreground">{q.explanation}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between gap-3">
          <p className="hidden text-xs font-bold text-muted-foreground sm:block">
            {revealed ? "Press Enter to continue" : "Keys 1-4 to pick, Enter to check"}
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
                  Continue <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
