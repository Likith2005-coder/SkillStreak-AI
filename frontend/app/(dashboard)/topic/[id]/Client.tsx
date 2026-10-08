"use client";

import { useEffect, useState } from "react";
import { Link } from "next-view-transitions";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { ShikiCodeBlock } from "@/components/shared/ShikiCodeBlock";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  ListChecks,
  Loader2,
  RefreshCw,
  Sparkles,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { ResourceList } from "@/components/resources/ResourceList";
import { surfaceGamification } from "@/lib/gamification-toasts";

import {
  apiErrorMessage,
  completeTopic,
  explainTopic,
  fetchTopic,
  type ExplainResponse,
  type TopicView,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { styleFor } from "@/lib/domain-style";
import { DomainTile, domainPalette, withAlpha } from "@/components/shared/DomainIcon";
import { cn } from "@/lib/utils";

export default function TopicPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [topic, setTopic] = useState<TopicView | null>(null);
  const [topicError, setTopicError] = useState<string | null>(null);

  const [explainState, setExplainState] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "ok"; data: ExplainResponse }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const [completeState, setCompleteState] = useState<"idle" | "saving" | "done">("idle");

  // Fetch topic + auto-trigger explanation.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchTopic(id)
      .then((t) => {
        if (cancelled) return;
        setTopic(t);
        if (t.progress?.status === "completed") setCompleteState("done");
      })
      .catch((err) => {
        if (!cancelled) setTopicError(apiErrorMessage(err, "Could not load topic"));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!topic) return;
    requestExplanation(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic?.id]);

  async function requestExplanation(_isRetry: boolean) {
    if (!id) return;
    setExplainState({ kind: "loading" });
    try {
      const data = await explainTopic(id);
      setExplainState({ kind: "ok", data });
    } catch (err) {
      setExplainState({
        kind: "error",
        message: apiErrorMessage(err, "Could not generate an explanation"),
      });
    }
  }

  async function handleMarkComplete() {
    if (!id || completeState !== "idle") return;
    // Optimistic: flip to "done" instantly so the action feels immediate.
    setCompleteState("done");
    try {
      const { gamification } = await completeTopic(id);
      // Reconcile: XP / streak / badge deltas are server-authoritative.
      surfaceGamification(gamification);
    } catch (err) {
      // Visible rollback so the user isn't misled into thinking it saved.
      setCompleteState("idle");
      toast.error("Couldn't mark complete", {
        description: `${apiErrorMessage(err, "Please try again")} — not saved.`,
      });
    }
  }

  if (topicError) {
    return (
      <main className="container px-4 py-8">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive-text">
          {topicError}
        </div>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" strokeWidth={2.2} /> Back
          </Button>
        </div>
      </main>
    );
  }

  if (!topic) {
    return <TopicSkeleton />;
  }

  const s = styleFor(topic.roadmap.domain.color);
  const pal = domainPalette(topic.roadmap.domain.color);
  const best = topic.progress?.bestScore ?? null;
  const quizLabel = best != null ? "Take quiz again" : "Start quiz";

  return (
    <main className="container relative px-4 py-8">
      {/* Domain-colour light pooling behind the title */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-10 -z-10 h-[360px] overflow-hidden">
        <div className="grid-faint absolute inset-0" />
        <div
          className="absolute -left-20 -top-24 h-[340px] w-[560px] rounded-full blur-[90px]"
          style={{ background: `radial-gradient(closest-side, ${withAlpha(pal.bright, 0.22)}, transparent)` }}
        />
      </div>

      <Link
        href={`/domains/${topic.roadmap.domain.slug}`}
        className="focus-ring group -ml-2 inline-flex h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none" strokeWidth={2.2} />
        {topic.roadmap.domain.name} roadmap
      </Link>

      <header className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        <DomainTile name={topic.roadmap.domain.icon} color={topic.roadmap.domain.color} size={60} className="mt-1 hidden sm:flex" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", s.badgeBg)}>
              {topic.roadmap.domain.name}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-xs tabular-nums text-muted-foreground">
              Topic {String(topic.orderIndex).padStart(2, "0")}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
              {topic.phase}
            </span>
            {completeState === "done" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" /> Completed
              </span>
            )}
          </div>
          <h1 className="mt-4 max-w-4xl font-display text-[clamp(2rem,5vw,3.75rem)] leading-[1.02] text-foreground [text-wrap:balance]">
            {topic.title}
          </h1>
          <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-muted-foreground">{topic.summary}</p>
        </div>
      </header>

      <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        {/* AI explanation — the reading column */}
        <div className="min-w-0">
          <div className="card-chunky p-5 sm:p-10">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-5">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-grape/10 text-grape ring-1 ring-grape/25 shadow-[0_0_24px_-6px_hsl(var(--grape)/0.6)]"
                >
                  <Sparkles
                    className={cn("h-5 w-5", explainState.kind === "loading" && "animate-pulse motion-reduce:animate-none")}
                    strokeWidth={2.2}
                  />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-foreground">The lesson</h2>
                  <p className="text-xs text-muted-foreground">
                    {explainState.kind === "loading"
                      ? "Your AI tutor is writing it…"
                      : explainState.kind === "ok" && explainState.data.cached
                        ? "Explained by your AI tutor · saved copy"
                        : "Explained by your AI tutor"}
                  </p>
                </div>
              </div>
              {explainState.kind === "ok" && (
                <Button variant="ghost" size="sm" onClick={() => requestExplanation(true)} className="text-muted-foreground">
                  <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.4} />
                  <span className="sr-only sm:not-sr-only">Regenerate</span>
                </Button>
              )}
            </div>

            <div className="mt-6">
              {explainState.kind === "loading" && <ExplanationSkeleton />}

              {explainState.kind === "error" && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-text">
                  <p className="font-semibold">Couldn&apos;t generate the explanation.</p>
                  <p className="mt-1">{explainState.message}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => requestExplanation(true)}>
                    <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.4} />
                    Try again
                  </Button>
                </div>
              )}

              {explainState.kind === "ok" && <ExplanationContent markdown={explainState.data.explanation} />}
            </div>
          </div>

          {/* End-of-lesson CTA: the natural next step once you've read it */}
          {explainState.kind === "ok" && (
            <div className="card-chunky relative mt-6 overflow-hidden">
              <div
                aria-hidden
                className="pointer-events-none absolute -left-16 -top-24 h-64 w-[30rem] rounded-full bg-primary/15 blur-3xl"
              />
              <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div>
                  <p className="font-display text-3xl leading-tight text-foreground">
                    Read it? <span className="font-serif-accent text-glow text-primary">Prove it.</span>
                  </p>
                  <p className="mt-1.5 text-[15px] text-muted-foreground">5 quick questions. Get 3 right to complete the topic.</p>
                </div>
                <Button asChild size="lg" className="shrink-0">
                  <Link href={`/quiz/${topic.id}`}>
                    {quizLabel} <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <motion.aside
          className="space-y-4 lg:sticky lg:top-20 lg:self-start"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
          }}
        >
          {/* The lit panel: the one primary action on this screen */}
          <SidebarCard className="border-beam !border-primary/25">
            <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
              <span className="absolute -right-16 -top-20 h-48 w-64 rounded-full bg-primary/20 blur-3xl" />
            </span>
            <div className="relative">
              <div className="flex items-center gap-2.5">
                <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/25">
                  <ListChecks className="h-[18px] w-[18px]" strokeWidth={2.2} />
                </span>
                <h2 className="text-base font-semibold text-foreground">Lesson quiz</h2>
                {best != null && (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-xp/25 bg-xp/10 px-2.5 py-0.5 font-mono text-xs font-medium tabular-nums text-xp">
                    <Trophy className="h-3.5 w-3.5" /> {best}/5
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                5 AI-generated MCQs. Pass with 3/5 to mark this topic complete.
              </p>
              <Button asChild size="lg" className="mt-4 w-full">
                <Link href={`/quiz/${topic.id}`}>
                  {quizLabel} <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
                </Link>
              </Button>
            </div>
          </SidebarCard>

          <SidebarCard>
            <h2 className="text-base font-semibold text-foreground">Mark progress</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              When you understand the explanation and feel ready, mark this topic
              complete.
            </p>
            <Button
              className="mt-4 w-full"
              variant="outline"
              onClick={handleMarkComplete}
              disabled={completeState !== "idle"}
            >
              {completeState === "saving" && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
              {completeState === "done" && <CheckCircle2 className="h-5 w-5 text-primary" />}
              {completeState === "done"
                ? "Completed"
                : completeState === "saving"
                  ? "Saving…"
                  : "Mark complete"}
            </Button>
          </SidebarCard>

          <SidebarCard>
            <h2 className="mb-3 text-base font-semibold text-foreground">Resources</h2>
            <ResourceList topicId={topic.id} />
          </SidebarCard>

          <SidebarCard>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-grape" strokeWidth={2.2} />
              <h2 className="text-base font-semibold text-foreground">Talk to the AI tutor</h2>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Open a chat pre-loaded with this topic. Ask for analogies, deeper
              dives, or a quick quiz.
            </p>
            <Button asChild className="mt-4 w-full" variant="outline">
              <Link href={`/chatbot?topic=${topic.id}`}>
                <Bot className="h-4 w-4 text-grape" />
                Ask about this topic
              </Link>
            </Button>
          </SidebarCard>
        </motion.aside>
      </section>
    </main>
  );
}

function SidebarCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: reduce ? 0 : 10 },
        show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] } },
      }}
      className={cn("card-chunky p-5", className)}
    >
      {children}
    </motion.div>
  );
}

// The dark reading experience: 17px body at a calm 1.75 line height in a soft
// off-white, display-face headings with a glowing volt marker, blue links,
// volt list markers, quotes as a tinted well, inline code in a hairline chip.
const LESSON_PROSE = [
  "prose prose-invert max-w-[72ch] text-[1.0625rem]",
  "prose-p:leading-[1.75] prose-p:text-foreground/[0.82] prose-li:text-foreground/[0.82] prose-li:my-1.5",
  "prose-headings:font-display prose-headings:font-bold prose-headings:tracking-[-0.025em] prose-headings:text-foreground",
  "prose-h2:mb-4 prose-h2:mt-12 prose-h2:flex prose-h2:items-center prose-h2:gap-3 prose-h2:text-[1.6rem]",
  "prose-h2:before:h-[1.1em] prose-h2:before:w-[3px] prose-h2:before:shrink-0 prose-h2:before:rounded-full prose-h2:before:bg-primary prose-h2:before:shadow-[0_0_12px_hsl(var(--primary)/0.8)] prose-h2:before:content-['']",
  "prose-h3:mt-8 prose-h3:text-xl",
  "prose-a:font-medium prose-a:text-secondary prose-a:decoration-secondary/40 prose-a:underline-offset-4 hover:prose-a:decoration-secondary",
  "prose-strong:font-semibold prose-strong:text-foreground",
  "prose-li:marker:text-primary",
  "prose-blockquote:rounded-r-lg prose-blockquote:border-l-secondary/60 prose-blockquote:bg-secondary/[0.06] prose-blockquote:py-1 prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:text-foreground/90",
  "prose-pre:!m-0 prose-pre:!border-0 prose-pre:!bg-transparent prose-pre:!p-0",
  "prose-code:rounded-md prose-code:border prose-code:border-white/10 prose-code:bg-white/[0.05] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.88em] prose-code:font-medium prose-code:text-primary prose-code:before:content-none prose-code:after:content-none",
  "prose-hr:border-white/[0.08] prose-th:text-foreground prose-td:text-foreground/[0.82] prose-thead:border-white/15 prose-tr:border-white/[0.06]",
].join(" ");

function ExplanationContent({ markdown }: { markdown: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={LESSON_PROSE}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={topicMdComponents}>
        {markdown}
      </ReactMarkdown>
    </motion.article>
  );
}

const topicMdComponents: Components = {
  pre({ children }) {
    const codeNode = Array.isArray(children) ? children[0] : children;
    const props =
      codeNode && typeof codeNode === "object" && "props" in codeNode
        ? (codeNode as { props: { className?: string; children?: React.ReactNode } }).props
        : { className: "", children: "" };
    const lang = (props.className?.match(/language-([\w-]+)/)?.[1] ?? "").toLowerCase();
    const text = extractText(props.children);
    return <ShikiCodeBlock code={text} lang={lang} />;
  },
};

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return extractText((node as { props: { children: React.ReactNode } }).props.children);
  }
  return "";
}

function ExplanationSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Writing the lesson">
      {[
        ["w-1/3", ["w-3/4", "w-full", "w-5/6"]],
        ["w-1/4", ["w-full", "w-11/12", "w-4/5", "w-3/4", "w-2/3"]],
        ["w-2/5", ["w-5/6", "w-full", "w-3/4"]],
      ].map(([h, lines], i) => (
        <div key={i} className="space-y-3">
          <div className={`h-6 ${h} animate-pulse rounded-lg bg-white/[0.05] motion-reduce:animate-none`} />
          {(lines as string[]).map((w, j) => (
            <div
              key={j}
              className={`h-4 ${w} animate-pulse rounded bg-white/[0.04] motion-reduce:animate-none`}
              style={{ animationDelay: `${(i * 4 + j) * 60}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Shared by the route's loading.tsx and the client's own first paint. */
export function TopicSkeleton() {
  return (
    <main className="container px-4 py-8" role="status" aria-label="Loading topic">
      <div className="h-11 w-40 animate-pulse rounded-lg bg-white/[0.04] motion-reduce:animate-none" />
      <div className="mt-2 flex gap-6">
        <div className="hidden h-[60px] w-[60px] shrink-0 animate-pulse rounded-[28%] bg-white/[0.05] motion-reduce:animate-none sm:block" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-48 animate-pulse rounded-full bg-white/[0.05] motion-reduce:animate-none" />
          <div className="h-9 w-2/3 animate-pulse rounded-lg bg-white/[0.05] motion-reduce:animate-none" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-white/[0.04] motion-reduce:animate-none" />
        </div>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <div className="card-chunky h-[420px] animate-pulse motion-reduce:animate-none" />
        <div className="space-y-4">
          <div className="card-chunky h-44 animate-pulse motion-reduce:animate-none" />
          <div className="card-chunky h-32 animate-pulse motion-reduce:animate-none" />
        </div>
      </div>
    </main>
  );
}
