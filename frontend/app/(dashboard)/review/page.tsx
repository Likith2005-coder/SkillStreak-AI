"use client";

/**
 * Mistake Review: a focused session over the questions the learner missed in
 * recent quizzes. Same look and keys as the quiz (1–4 pick, Enter checks,
 * Enter continues). The server holds the answers: the card only learns the
 * correct option after "Check". A right answer fixes the mistake for good
 * (+5 XP, once); a wrong one stays in the queue for next time.
 */

import { useCallback, useEffect, useState } from "react";
import { Link } from "next-view-transitions";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, CheckCheck, Gem, Loader2, RotateCcw, X } from "lucide-react";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { Mascot } from "@/components/playground/Mascot";
import { Button } from "@/components/ui/button";
import { styleFor } from "@/lib/domain-style";
import { cn } from "@/lib/utils";
import {
  answerReview,
  apiErrorMessage,
  fetchReview,
  type ReviewAnswerResponse,
  type ReviewItem,
} from "@/lib/api";

const EASE = [0.22, 1, 0.36, 1] as const;
const PRAISE = ["Fixed!", "Nailed it this time!", "That one's yours now.", "Locked in!", "Got it!"];

type Phase = "loading" | "error" | "empty" | "ready" | "done";

export default function ReviewPage() {
  const reduce = useReducedMotionSafe();
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [total, setTotal] = useState(0);

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ReviewAnswerResponse | null>(null);
  const [fixed, setFixed] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);

  const load = useCallback(async () => {
    setPhase("loading");
    setErrorMsg(null);
    setCurrent(0);
    setSelected(null);
    setResult(null);
    setFixed(0);
    setXpEarned(0);
    try {
      const data = await fetchReview();
      setItems(data.items);
      setTotal(data.total);
      setPhase(data.items.length === 0 ? "empty" : "ready");
    } catch (err) {
      setErrorMsg(apiErrorMessage(err, "Could not load your mistakes."));
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const item = items[current];
  const revealed = result !== null;

  const check = useCallback(async () => {
    if (!item || selected === null || revealed || checking) return;
    setChecking(true);
    try {
      const res = await answerReview(item.key, selected);
      setResult(res);
      if (res.correct) setFixed((n) => n + 1);
      if (res.xpAwarded > 0) setXpEarned((n) => n + res.xpAwarded);
      if (res.gamification) {
        // The inline slab already says "+5 XP"; only surface the bigger
        // moments (level up, streak, badges) as toasts.
        const { surfaceGamification } = await import("@/lib/gamification-toasts");
        surfaceGamification({ ...res.gamification, xp: { ...res.gamification.xp, totalAwarded: 0 } });
      }
    } catch (err) {
      setErrorMsg(apiErrorMessage(err, "Could not check that answer."));
    } finally {
      setChecking(false);
    }
  }, [item, selected, revealed, checking]);

  const next = useCallback(() => {
    if (current < items.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setResult(null);
      setErrorMsg(null);
    } else {
      setPhase("done");
    }
  }, [current, items.length]);

  // Keyboard: 1-4 pick, Enter checks, Enter again continues.
  useEffect(() => {
    if (phase !== "ready" || !item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const n = Number(e.key);
      if (!revealed && !checking && n >= 1 && n <= item.options.length) {
        setSelected(n - 1);
      } else if (e.key === "Enter" && !(t && t.tagName === "BUTTON")) {
        if (!revealed && selected !== null) check();
        else if (revealed) next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, item, revealed, checking, selected, check, next]);

  return (
    <main className="container relative max-w-3xl px-4 py-8">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-10 -z-10 h-[320px] overflow-hidden">
        <div className="absolute left-1/2 top-[-40%] h-[300px] w-[600px] max-w-[100vw] -translate-x-1/2 rounded-full bg-destructive/10 blur-[90px]" />
      </div>
      <Link
        href="/dashboard"
        className="focus-ring group -ml-2 inline-flex h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none" strokeWidth={2.2} />
        Dashboard
      </Link>

      <div className="mt-4">
        {phase === "loading" && (
          <div className="flex min-h-[60vh] items-center justify-center" role="status">
            <Mascot message="Pulling up the ones that got away…" size={104} />
          </div>
        )}

        {phase === "error" && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6">
            <p className="text-sm text-destructive-text">{errorMsg ?? "Review unavailable."}</p>
            <Button onClick={load} variant="outline" className="mt-4">
              Try again
            </Button>
          </div>
        )}

        {phase === "empty" && <EmptyState />}

        {phase === "done" && (
          <DoneScreen
            seen={items.length}
            fixed={fixed}
            xp={xpEarned}
            remaining={Math.max(0, total - fixed)}
            onAgain={load}
          />
        )}

        {phase === "ready" && item && (
          <Session
            item={item}
            index={current}
            count={items.length}
            selected={selected}
            onSelect={setSelected}
            result={result}
            checking={checking}
            errorMsg={errorMsg}
            onCheck={check}
            onNext={next}
            reduce={reduce}
          />
        )}
      </div>
    </main>
  );
}

function Session({
  item,
  index,
  count,
  selected,
  onSelect,
  result,
  checking,
  errorMsg,
  onCheck,
  onNext,
  reduce,
}: {
  item: ReviewItem;
  index: number;
  count: number;
  selected: number | null;
  onSelect: (i: number) => void;
  result: ReviewAnswerResponse | null;
  checking: boolean;
  errorMsg: string | null;
  onCheck: () => void;
  onNext: () => void;
  reduce: boolean;
}) {
  const revealed = result !== null;
  const gotIt = !!result?.correct;
  const progressPct = ((index + (revealed ? 1 : 0)) / count) * 100;
  const s = styleFor(item.domain.color);
  const last = index === count - 1;
  const missedOn = new Date(item.attemptedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div>
      <header className="flex items-center gap-4">
        <span className="label-mono flex shrink-0 items-center gap-1.5 text-destructive-text">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Review
        </span>
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]"
          role="progressbar"
          aria-valuenow={Math.round(progressPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Question ${index + 1} of ${count}`}
        >
          <div
            className="h-full w-full origin-left rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.7)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ transform: `scaleX(${Math.max(progressPct, 3) / 100})` }}
          />
        </div>
        <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
          {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </span>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <span className={cn("inline-flex min-w-0 max-w-full items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", s.badgeBg)}>
          <span className="truncate">{item.domain.name}</span>
        </span>
        <Link
          href={`/topic/${item.topicId}`}
          className="focus-ring min-w-0 truncate rounded font-medium text-foreground/90 underline-offset-4 hover:underline"
        >
          {item.topicTitle}
        </Link>
        <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">Missed {missedOn}</span>
      </div>

      <div className="mt-4">
        <AnimatePresence mode="wait">
          <QuestionCard
            key={item.key}
            index={index}
            question={item.question}
            options={item.options}
            selected={selected}
            revealed={revealed}
            correctIndex={result?.correctIndex}
            onSelect={(i) => !checking && onSelect(i)}
          />
        </AnimatePresence>
      </div>

      {!revealed && item.lastAnswer >= 0 && item.lastAnswer < item.options.length && (
        <p className="mt-3 text-xs text-muted-foreground">
          Last time you picked <span className="font-mono text-destructive-text">{item.lastAnswer + 1}</span>. Think it through again.
        </p>
      )}

      {errorMsg && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive-text" role="alert">
          {errorMsg}
        </p>
      )}

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
          {result && (
            <motion.div
              key="feedback"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
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
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className={cn("font-display text-2xl", gotIt ? "text-primary text-glow" : "text-destructive-text")}>
                    {gotIt ? PRAISE[index % PRAISE.length] : "Not quite."}
                  </span>
                  {gotIt && result.xpAwarded > 0 && (
                    <motion.span
                      initial={reduce ? false : { opacity: 0, y: 6, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: reduce ? 0 : 0.35, delay: reduce ? 0 : 0.15, ease: EASE }}
                      className="inline-flex items-center gap-1 rounded-full border border-xp/30 bg-xp/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-xp"
                    >
                      <Gem className="h-3.5 w-3.5" aria-hidden /> +{result.xpAwarded} XP
                    </motion.span>
                  )}
                </p>
                {!gotIt && (
                  <p className="mt-1 text-sm font-medium text-destructive-text">
                    Correct answer: {item.options[result.correctIndex]}
                  </p>
                )}
                {result.explanation && (
                  <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-foreground/85">{result.explanation}</p>
                )}
                {!gotIt && (
                  <p className="mt-2 text-xs text-muted-foreground">It stays in your review queue for another try.</p>
                )}
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
            <Button size="lg" className="w-full sm:ml-auto sm:w-44" onClick={onCheck} disabled={selected === null || checking}>
              {checking ? <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-label="Checking" /> : "Check"}
            </Button>
          ) : (
            <Button size="lg" variant={gotIt ? "default" : "destructive"} className="w-full sm:ml-auto sm:w-44" onClick={onNext}>
              {last ? (
                "Finish"
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

function EmptyState() {
  return (
    <div className="card-chunky relative mx-auto mt-6 flex max-w-xl flex-col items-center overflow-hidden px-6 py-12 text-center">
      <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-56 w-80 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.16),transparent)] blur-2xl" />
      <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/30 shadow-[0_0_32px_-4px_hsl(var(--primary)/0.6)]">
        <CheckCheck className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="mt-5 font-display text-3xl text-foreground">
        No mistakes to <span className="font-serif-accent text-primary text-glow">review</span>.
      </h1>
      <p className="mt-2 max-w-[40ch] text-[15px] leading-relaxed text-muted-foreground">
        Take a quiz and anything you miss lands here.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/dashboard">
            Back to dashboard <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/domains">Browse domains</Link>
        </Button>
      </div>
    </div>
  );
}

function DoneScreen({
  seen,
  fixed,
  xp,
  remaining,
  onAgain,
}: {
  seen: number;
  fixed: number;
  xp: number;
  remaining: number;
  onAgain: () => void;
}) {
  const reduce = useReducedMotionSafe();
  const perfect = fixed === seen && seen > 0;

  useEffect(() => {
    if (!perfect) return;
    let cancelled = false;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      confetti({
        origin: { y: 0.6 },
        particleCount: 110,
        spread: 90,
        startVelocity: 38,
        colors: ["#b6ff3b", "#7c5cff", "#4f7dff", "#22d3ee"],
        disableForReducedMotion: true,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [perfect]);

  const stats = [
    { label: "Fixed", value: `${fixed}/${seen}`, cls: "text-primary text-glow" },
    { label: "XP earned", value: `+${xp}`, cls: "text-xp" },
    { label: "Still open", value: String(remaining), cls: remaining > 0 ? "text-destructive-text" : "text-foreground" },
  ];

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.15 : 0.45, ease: EASE }}
      className="card-chunky border-beam relative mx-auto mt-6 max-w-xl px-6 py-10 text-center sm:px-10"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <div className="absolute -top-24 left-1/2 h-56 w-96 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--aurora-1)/0.22),transparent)] blur-2xl" />
      </div>
      <p className="label-mono text-primary">Review complete</p>
      <h1 className="mt-3 font-display text-4xl leading-tight text-foreground [text-wrap:balance]">
        {perfect ? (
          <>
            Every one <span className="font-serif-accent text-primary text-glow">fixed</span>.
          </>
        ) : fixed > 0 ? (
          <>
            {fixed} down, <span className="font-serif-accent text-primary">sharper</span> already.
          </>
        ) : (
          <>Tough set. They&apos;ll be here when you&apos;re ready.</>
        )}
      </h1>
      <dl className="mt-8 grid grid-cols-3 divide-x divide-white/[0.06] border-y border-white/[0.06] py-5">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0 px-2">
            <dt className="label-mono truncate text-muted-foreground">{s.label}</dt>
            <dd className={cn("mt-1.5 font-display text-3xl tabular-nums", s.cls)}>{s.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/dashboard">
            Back to dashboard <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
          </Link>
        </Button>
        {remaining > 0 && (
          <Button variant="outline" size="lg" onClick={onAgain}>
            <RotateCcw className="h-4 w-4" aria-hidden /> Review again
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-white/15 bg-white/[0.04] px-1 font-mono text-[10px] text-foreground/80">
      {children}
    </kbd>
  );
}
