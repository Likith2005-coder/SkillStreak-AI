"use client";

/**
 * Conversational onboarding assessment — feels like chatting with an AI
 * mentor, not filling a form. One question at a time: the mentor "types",
 * asks, the learner taps a chip, the exchange stacks up as chat history.
 *
 * Single/boolean questions auto-advance on tap; multi-selects confirm with
 * a Continue button. Conditional questions (known topics, certification)
 * appear only when relevant. Finishing fires one LLM generation on the
 * backend and hands off to the personalized plan page.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Bot, Check, Loader2, Sparkles } from "lucide-react";

import {
  apiErrorMessage,
  submitAssessment,
  type AssessmentAnswers,
  type AssessmentQuestion,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  slug: string;
  domainName: string;
  questions: AssessmentQuestion[];
  onDone: () => void;
  onSkip: () => void;
};

type RawAnswers = Record<string, string | string[]>;

/** Convert chip answers into the typed API payload. */
function toPayload(raw: RawAnswers): AssessmentAnswers {
  const bool = (id: string) => raw[id] === "yes";
  const arr = (id: string) =>
    (Array.isArray(raw[id]) ? (raw[id] as string[]) : []).filter((v) => v !== "none");
  return {
    why: (raw.why as string) ?? "curiosity",
    level: ((raw.level as string) ?? "beginner") as AssessmentAnswers["level"],
    learnedBefore: bool("learnedBefore"),
    knownTopics: arr("knownTopics"),
    dailyMinutes: Number(raw.dailyMinutes ?? 30),
    style: (raw.style as string) ?? "mix",
    mode: (raw.mode as string) ?? "roadmap",
    endGoal: (raw.endGoal as string) ?? "Specialist in this domain",
    wantsCert: bool("wantsCert"),
    certification: bool("wantsCert") ? ((raw.certification as string) ?? null) : null,
    languages: arr("languages"),
    os: ((raw.os as string) ?? "windows") as AssessmentAnswers["os"],
  };
}

/** Human-readable echo of an answer for the chat history bubble. */
function echoOf(q: AssessmentQuestion, raw: RawAnswers): string {
  const v = raw[q.id];
  if (Array.isArray(v)) {
    if (v.length === 0) return "None yet";
    const labels = v.map((x) => q.options.find((o) => o.value === x)?.label ?? x);
    return labels.length > 3 ? `${labels.slice(0, 3).join(", ")} +${labels.length - 3}` : labels.join(", ");
  }
  return q.options.find((o) => o.value === v)?.label ?? String(v ?? "");
}

export function AssessmentWizard({ slug, domainName, questions, onDone, onSkip }: Props) {
  const reduce = useReducedMotion();
  const [raw, setRaw] = useState<RawAnswers>({});
  const [index, setIndex] = useState(0);
  const [typing, setTyping] = useState(true);
  const [multiDraft, setMultiDraft] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Questions whose dependsOn matches the current answers.
  const visible = useMemo(
    () =>
      questions.filter((q) => {
        if (!q.dependsOn) return true;
        const dep = raw[q.dependsOn.id];
        const want = q.dependsOn.value === true ? "yes" : q.dependsOn.value;
        return dep === want || dep === q.dependsOn.value;
      }),
    [questions, raw]
  );

  const current = visible[index];
  const answeredCount = index;
  const progress = Math.round((answeredCount / visible.length) * 100);

  // Mentor "typing…" beat before each question lands.
  useEffect(() => {
    if (reduce) {
      setTyping(false);
      return;
    }
    setTyping(true);
    const t = setTimeout(() => setTyping(false), 550);
    return () => clearTimeout(t);
  }, [index, reduce]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [index, typing, multiDraft.length, generating, reduce]);

  const advance = (next: RawAnswers) => {
    setRaw(next);
    setMultiDraft([]);
    // Recompute visibility against the *new* answers to find the next stop.
    const nextVisible = questions.filter((q) => {
      if (!q.dependsOn) return true;
      const dep = next[q.dependsOn.id];
      const want = q.dependsOn.value === true ? "yes" : q.dependsOn.value;
      return dep === want || dep === q.dependsOn.value;
    });
    if (index + 1 >= nextVisible.length) {
      void finish(next);
    } else {
      setIndex(index + 1);
    }
  };

  const pickSingle = (value: string) => {
    if (!current || generating) return;
    advance({ ...raw, [current.id]: value });
  };

  const toggleMulti = (value: string) => {
    setMultiDraft((d) => {
      if (value === "none") return d.includes("none") ? [] : ["none"];
      const withoutNone = d.filter((x) => x !== "none");
      return withoutNone.includes(value)
        ? withoutNone.filter((x) => x !== value)
        : [...withoutNone, value];
    });
  };

  const confirmMulti = () => {
    if (!current) return;
    advance({ ...raw, [current.id]: multiDraft });
  };

  const goBack = () => {
    if (index === 0 || generating) return;
    const prev = visible[index - 1];
    const next = { ...raw };
    delete next[prev.id];
    setRaw(next);
    setMultiDraft([]);
    setIndex(index - 1);
  };

  const finish = async (finalRaw: RawAnswers) => {
    setGenerating(true);
    setError(null);
    try {
      await submitAssessment(slug, toPayload(finalRaw));
      onDone();
    } catch (err) {
      setGenerating(false);
      setError(apiErrorMessage(err, "Could not generate your plan — please try again"));
    }
  };

  const bubbleIn = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 14, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.4, ease: EASE },
      };

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Progress */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/60">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
            animate={{ width: `${generating ? 100 : progress}%` }}
            transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE }}
          />
        </div>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {Math.min(answeredCount + 1, visible.length)}/{visible.length}
        </span>
      </div>

      {/* Chat history — every answered exchange */}
      <div className="space-y-4">
        {visible.slice(0, index).map((q) => (
          <div key={q.id} className="space-y-2.5">
            <MentorBubble>{q.prompt}</MentorBubble>
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-sm border border-cyan-400/25 bg-cyan-500/10 px-3.5 py-2 text-sm text-foreground/90">
                {echoOf(q, raw)}
              </div>
            </div>
          </div>
        ))}

        {/* Current exchange */}
        {!generating && current && (
          <AnimatePresence mode="wait">
            <motion.div key={current.id} {...bubbleIn} className="space-y-3">
              {typing ? (
                <MentorBubble>
                  <span className="inline-flex items-center gap-1 py-0.5" aria-label="Mentor is typing">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-violet-300"
                        animate={{ opacity: [0.25, 1, 0.25] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
                      />
                    ))}
                  </span>
                </MentorBubble>
              ) : (
                <>
                  <MentorBubble>{current.prompt}</MentorBubble>
                  <motion.div
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.08, ease: EASE }}
                    className="flex flex-wrap gap-2 pl-10"
                  >
                    {current.options.map((opt) => {
                      const selected =
                        current.type === "multi" && multiDraft.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            current.type === "multi"
                              ? toggleMulti(opt.value)
                              : pickSingle(opt.value)
                          }
                          className={cn(
                            "group rounded-2xl border px-4 py-2.5 text-left text-sm transition-all",
                            selected
                              ? "border-cyan-400/60 bg-cyan-500/15 text-foreground"
                              : "border-border bg-card/60 text-foreground/90 hover:border-cyan-400/40 hover:bg-card hover:-translate-y-0.5"
                          )}
                        >
                          <span className="flex items-center gap-2 font-medium">
                            {selected && <Check className="h-3.5 w-3.5 text-cyan-300" />}
                            {opt.label}
                          </span>
                          {opt.hint && (
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {opt.hint}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                  {current.type === "multi" && (
                    <div className="pl-10">
                      <Button size="sm" onClick={confirmMulti} className="rounded-full px-5">
                        {multiDraft.length > 0
                          ? `Continue with ${multiDraft.length} selected`
                          : "None of these — continue"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Generation state — the mentor goes to work */}
        {generating && (
          <motion.div {...bubbleIn} className="space-y-3">
            <MentorBubble>
              Great — that&apos;s everything I need. Designing your {domainName} plan…
            </MentorBubble>
            <div className="flex items-center gap-3 rounded-2xl border border-violet-500/25 bg-violet-500/[0.07] px-4 py-3.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-300" />
              <span>
                Building your phases, picking resources, designing your capstone
                project — usually 20–40 seconds.
              </span>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
            {error}
            <Button
              size="sm"
              variant="outline"
              className="ml-3 rounded-full"
              onClick={() => finish(raw)}
            >
              Retry
            </Button>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Footer controls */}
      {!generating && (
        <div className="mt-8 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={goBack}
            disabled={index === 0}
            className={cn(
              "inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground",
              index === 0 && "invisible"
            )}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip — browse the curated trail instead
          </button>
        </div>
      )}
    </div>
  );
}

function MentorBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/25 ring-1 ring-violet-400/30">
        <Bot className="h-4 w-4 text-violet-300" />
      </span>
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-border/70 bg-card/70 px-4 py-2.5 text-sm leading-relaxed text-foreground/95">
        {children}
      </div>
    </div>
  );
}

/** Intro screen shown before the first question. */
export function AssessmentIntro({
  domainName,
  onStart,
  onSkip,
}: {
  domainName: string;
  onStart: () => void;
  onSkip: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE }}
      className="mx-auto max-w-xl text-center"
    >
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/20 ring-1 ring-violet-400/30">
        <Sparkles className="h-7 w-7 text-violet-300" />
      </span>
      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Before the roadmap — let&apos;s make it <span className="text-cyan-300">yours</span>.
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
        Answer a few quick questions about your goals and experience with{" "}
        {domainName}, and your AI mentor will design a personal phase-by-phase
        plan — with resources, projects and a capstone build.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3">
        <Button size="lg" onClick={onStart} className="rounded-full px-8">
          Start the 2-minute chat
        </Button>
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Skip — show me the curated trail
        </button>
      </div>
    </motion.div>
  );
}
