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
import { DomainTile } from "@/components/shared/DomainIcon";
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
        <div className="rounded-2xl border-2 border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive-text">
          {topicError}
        </div>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" strokeWidth={3} /> Back
          </Button>
        </div>
      </main>
    );
  }

  if (!topic) {
    return <TopicSkeleton />;
  }

  const s = styleFor(topic.roadmap.domain.color);
  const best = topic.progress?.bestScore ?? null;
  const quizLabel = best != null ? "Take quiz again" : "Start quiz";

  return (
    <main className="container px-4 py-8">
      <Link
        href={`/domains/${topic.roadmap.domain.slug}`}
        className="focus-ring -ml-2 inline-flex h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-extrabold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={3} />
        {topic.roadmap.domain.name} roadmap
      </Link>

      <header className="mt-2 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        <DomainTile name={topic.roadmap.domain.icon} color={topic.roadmap.domain.color} size={64} tilt={-6} className="mt-1 hidden sm:flex" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-extrabold", s.iconBg, s.text)}>
              {topic.roadmap.domain.name}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-extrabold tabular-nums text-foreground">
              Topic {topic.orderIndex}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-extrabold capitalize text-foreground">
              {topic.phase}
            </span>
            {completeState === "done" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-extrabold text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" /> Completed
              </span>
            )}
          </div>
          <h1 className="mt-3 font-display text-3xl leading-tight text-foreground sm:text-4xl [text-wrap:balance]">
            {topic.title}
          </h1>
          <p className="mt-2 max-w-3xl text-base font-semibold text-muted-foreground">{topic.summary}</p>
        </div>
      </header>

      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        {/* AI explanation — the reading column */}
        <div className="min-w-0">
          <div className="card-chunky p-5 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden
                  className="flex h-10 w-10 -rotate-6 items-center justify-center rounded-xl bg-grape-bright"
                  style={{ boxShadow: "0 4px 0 hsl(var(--grape-shade))" }}
                >
                  <Sparkles
                    className={cn("h-5 w-5 text-white", explainState.kind === "loading" && "animate-pulse motion-reduce:animate-none")}
                    strokeWidth={2.6}
                  />
                </span>
                <div>
                  <h2 className="text-lg font-black text-foreground">The lesson</h2>
                  <p className="text-xs font-bold text-muted-foreground">
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
                  <RefreshCw className="h-3.5 w-3.5" strokeWidth={3} />
                  <span className="sr-only sm:not-sr-only">Regenerate</span>
                </Button>
              )}
            </div>

            <div className="mt-6">
              {explainState.kind === "loading" && <ExplanationSkeleton />}

              {explainState.kind === "error" && (
                <div className="rounded-2xl border-2 border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-text">
                  <p className="font-extrabold">Couldn&apos;t generate the explanation.</p>
                  <p className="mt-1 font-semibold">{explainState.message}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => requestExplanation(true)}>
                    <RefreshCw className="h-3.5 w-3.5" strokeWidth={3} />
                    Try again
                  </Button>
                </div>
              )}

              {explainState.kind === "ok" && <ExplanationContent markdown={explainState.data.explanation} />}
            </div>
          </div>

          {/* End-of-lesson CTA: the natural next step once you've read it */}
          {explainState.kind === "ok" && (
            <div
              className="mt-6 flex flex-col gap-4 rounded-[1.5rem] bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between"
              style={{ boxShadow: "0 6px 0 hsl(var(--primary-shade))" }}
            >
              <div>
                <p className="font-display text-2xl leading-tight">Read it? Prove it.</p>
                <p className="mt-1 text-sm font-semibold">5 quick questions. Get 3 right to complete the topic.</p>
              </div>
              <Link
                href={`/quiz/${topic.id}`}
                className="focus-ring inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-8 text-base font-black uppercase tracking-wide text-primary transition-[transform,box-shadow] duration-100 [box-shadow:0_5px_0_hsl(var(--primary-shade))] active:translate-y-[5px] active:[box-shadow:none] motion-reduce:transition-none"
              >
                {quizLabel} <ArrowRight className="h-5 w-5" strokeWidth={3} />
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <motion.aside
          className="space-y-4"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
          }}
        >
          <SidebarCard>
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" strokeWidth={2.6} />
              <h2 className="text-base font-black text-foreground">Lesson quiz</h2>
              {best != null && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-xp/10 px-2.5 py-0.5 text-xs font-extrabold tabular-nums text-xp">
                  <Trophy className="h-3.5 w-3.5" /> Best {best}/5
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm font-semibold text-muted-foreground">
              5 AI-generated MCQs. Pass with 3/5 to mark this topic complete.
            </p>
            <Button asChild size="lg" className="mt-4 w-full uppercase">
              <Link href={`/quiz/${topic.id}`}>{quizLabel}</Link>
            </Button>
          </SidebarCard>

          <SidebarCard>
            <h2 className="text-base font-black text-foreground">Mark progress</h2>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">
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
            <h2 className="mb-3 text-base font-black text-foreground">Resources</h2>
            <ResourceList topicId={topic.id} />
          </SidebarCard>

          <SidebarCard>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-grape" strokeWidth={2.6} />
              <h2 className="text-base font-black text-foreground">Talk to the AI tutor</h2>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-muted-foreground">
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

function SidebarCard({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: reduce ? 0 : 10 },
        show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] } },
      }}
      className="card-chunky p-5"
    >
      {children}
    </motion.div>
  );
}

function ExplanationContent({ markdown }: { markdown: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="prose prose-slate max-w-none text-[1.0625rem] prose-headings:font-black prose-headings:text-foreground prose-h2:mb-3 prose-h2:mt-9 prose-h2:flex prose-h2:items-center prose-h2:gap-2.5 prose-h2:text-xl prose-h2:before:h-6 prose-h2:before:w-1.5 prose-h2:before:shrink-0 prose-h2:before:rounded-full prose-h2:before:bg-primary-bright prose-h2:before:content-[''] prose-h3:text-lg prose-p:font-medium prose-p:leading-relaxed prose-p:text-foreground prose-a:font-bold prose-a:text-secondary prose-strong:font-extrabold prose-strong:text-foreground prose-li:font-medium prose-li:text-foreground prose-li:marker:text-primary-bright prose-blockquote:rounded-r-xl prose-blockquote:border-secondary-bright prose-blockquote:bg-secondary/5 prose-blockquote:py-1 prose-blockquote:font-semibold prose-blockquote:not-italic prose-blockquote:text-foreground prose-pre:!m-0 prose-pre:!border-0 prose-pre:!bg-transparent prose-pre:!p-0 prose-code:rounded-md prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:font-semibold prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none prose-th:text-foreground prose-td:text-foreground"
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
          <div className={`h-6 ${h} animate-pulse rounded-lg bg-muted motion-reduce:animate-none`} />
          {(lines as string[]).map((w, j) => (
            <div
              key={j}
              className={`h-4 ${w} animate-pulse rounded bg-muted motion-reduce:animate-none`}
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
      <div className="h-11 w-40 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
      <div className="mt-2 flex gap-6">
        <div className="hidden h-16 w-16 shrink-0 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none sm:block" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-48 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
          <div className="h-9 w-2/3 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted motion-reduce:animate-none" />
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
