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
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { SignalBotStatic } from "@/components/3d/SignalBotStatic";
import { Mascot } from "@/components/playground/Mascot";

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
      {/* Progress — a thin glowing bar, like a lesson */}
      <div className="mb-8 flex items-center gap-3">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]"
          role="progressbar"
          aria-valuenow={generating ? 100 : progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Assessment progress"
        >
          <motion.div
            className="h-full rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
            initial={false}
            animate={{ width: `${Math.max(generating ? 100 : progress, 4)}%` }}
            transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE }}
          >
          </motion.div>
        </div>
        <span className="font-mono text-xs font-medium tabular-nums text-muted-foreground">
          {Math.min(answeredCount + 1, visible.length)}/{visible.length}
        </span>
      </div>

      {/* Chat history — every answered exchange */}
      <div className="space-y-5">
        {visible.slice(0, index).map((q) => (
          <div key={q.id} className="space-y-3">
            <MentorBubble>{q.prompt}</MentorBubble>
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-md border border-secondary/30 bg-secondary/15 px-4 py-2.5 text-sm font-medium text-secondary-bright">
                {echoOf(q, raw)}
              </div>
            </div>
          </div>
        ))}

        {/* Current exchange */}
        {!generating && current && (
          <AnimatePresence mode="wait">
            <motion.div key={current.id} {...bubbleIn} className="space-y-4">
              {typing ? (
                <MentorBubble>
                  <span className="inline-flex items-center gap-1.5 py-1" aria-label="Mentor is typing">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-2 w-2 rounded-full bg-grape shadow-[0_0_8px_hsl(var(--grape)/0.8)]"
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
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
                    className="grid gap-2.5 sm:grid-cols-2 sm:pl-[52px]"
                  >
                    {current.options.map((opt) => {
                      const selected =
                        current.type === "multi" && multiDraft.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          aria-pressed={current.type === "multi" ? selected : undefined}
                          onClick={() =>
                            current.type === "multi"
                              ? toggleMulti(opt.value)
                              : pickSingle(opt.value)
                          }
                          className={cn(
                            "focus-ring group min-h-[52px] rounded-xl border px-4 py-3 text-left transition-[transform,background-color,border-color,box-shadow] duration-200 active:scale-[0.99] motion-reduce:transition-none",
                            selected
                              ? "border-secondary/60 bg-secondary/10 text-secondary-bright shadow-[0_0_0_1px_hsl(var(--secondary)/0.4),0_0_24px_-6px_hsl(var(--secondary)/0.6)]"
                              : "border-white/10 bg-white/[0.03] text-foreground hover:border-white/20 hover:bg-white/[0.06]"
                          )}
                        >
                          <span className="flex items-center gap-2 text-sm font-semibold">
                            {current.type === "multi" && (
                              <span
                                aria-hidden
                                className={cn(
                                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                                  selected ? "border-secondary bg-secondary text-secondary-foreground" : "border-white/20 bg-white/[0.03]"
                                )}
                              >
                                {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                              </span>
                            )}
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
                    <div className="sm:pl-[52px]">
                      <Button onClick={confirmMulti} className="w-full sm:w-auto">
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
          <motion.div {...bubbleIn} className="space-y-4">
            <MentorBubble>
              Great — that&apos;s everything I need. Designing your {domainName} plan…
            </MentorBubble>
            <div className="card-chunky border-beam flex items-center gap-3 px-4 py-4 text-sm text-muted-foreground sm:ml-[52px]">
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-grape motion-reduce:animate-none" />
              <span>
                Building your phases, picking resources, designing your capstone
                project — usually 20–40 seconds.
              </span>
            </div>
          </motion.div>
        )}

        {error && (
          <div
            className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive-text"
            role="alert"
          >
            <span className="flex-1">{error}</span>
            <Button size="sm" variant="outline" onClick={() => finish(raw)}>
              Retry
            </Button>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Footer controls */}
      {!generating && (
        <div className="mt-10 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={index === 0}
            className={cn("text-muted-foreground", index === 0 && "invisible")}
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.2} /> Back
          </Button>
          <Button variant="ghost" onClick={onSkip} className="h-auto min-h-11 whitespace-normal text-right text-muted-foreground">
            Skip — browse the curated trail instead
          </Button>
        </div>
      )}
    </div>
  );
}

function MentorBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-end gap-3">
      <span aria-hidden className="h-10 w-10 shrink-0">
        <SignalBotStatic className="h-full w-full" />
      </span>
      <div className="relative max-w-[85%] rounded-2xl rounded-bl-md border border-white/10 bg-card px-4 py-3 text-[15px] font-medium leading-snug text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]">
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
      className="mx-auto flex max-w-xl flex-col items-center text-center"
    >
      <Mascot
        message={`Hi! Tell me a little about you and I'll shape ${domainName} around it.`}
        size={96}
        className="justify-center text-left"
      />
      <h2 className="mt-8 font-display text-4xl leading-[1.02] text-foreground sm:text-5xl [text-wrap:balance]">
        Before the roadmap&nbsp;— let&apos;s make it{" "}
        <span className="font-serif-accent text-glow text-primary">yours</span>.
      </h2>
      <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
        Answer a few quick questions about your goals and experience with{" "}
        {domainName}, and your AI mentor will design a personal phase-by-phase
        plan — with resources, projects and a capstone build.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {["About 2 minutes", "Tap to answer", "Retake any time"].map((t) => (
          <span key={t} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-muted-foreground">
            {t}
          </span>
        ))}
      </div>
      <div className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto">
        <Button size="lg" onClick={onStart} className="w-full sm:w-auto sm:min-w-[300px]">
          Start the 2-minute chat
        </Button>
        <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
          Skip — show me the curated trail
        </Button>
      </div>
    </motion.div>
  );
}