"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
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
    } catch (err) {
      setErrorMsg(apiErrorMessage(err, "Could not submit the quiz."));
      setPhase("error");
    }
  }, [quiz, current, answers, topicId]);

  if (phase === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Generating a 5-question quiz on {topicTitle}…</p>
      </div>
    );
  }

  if (phase === "error" || !quiz) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6">
        <p className="text-sm text-destructive">{errorMsg ?? "Quiz unavailable."}</p>
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

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Quiz · {quiz.level}
            {quiz.cached && (
              <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[10px]">
                Cached
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{topicTitle}</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setTimerOn((v) => !v)}
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Timer: {timerOn ? "on" : "off"}
          </button>
          {timerOn && (
            <QuizTimer
              resetKey={`${current}-${quiz.questions.length}`}
              seconds={TIMER_SECONDS}
              paused={revealed || phase === "submitting"}
              onExpire={() => reveal(selected)}
            />
          )}
        </div>
      </header>

      <div className="h-1 w-full overflow-hidden rounded-full bg-card">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <QuestionCard
          key={current}
          index={current}
          total={total}
          question={q.question}
          options={q.options}
          selected={selected}
          revealed={revealed}
          correctIndex={q.correctIndex}
          explanation={q.explanation}
          onSelect={(i) => setSelected(i)}
        />
      </AnimatePresence>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {revealed
            ? "Locked. Tap Next to continue."
            : selected === null
              ? "Pick the best answer."
              : "Your pick is locked when you tap Reveal."}
        </p>
        <div className="flex items-center gap-2">
          {!revealed ? (
            <Button onClick={() => reveal(selected)} disabled={selected === null}>
              Lock answer
            </Button>
          ) : (
            <Button onClick={next} disabled={phase === "submitting"}>
              {phase === "submitting" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : current === total - 1 ? (
                "See result"
              ) : (
                <>
                  Next <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
