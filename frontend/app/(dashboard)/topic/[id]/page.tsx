"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, useReducedMotion } from "framer-motion";
import { ShikiCodeBlock } from "@/components/shared/ShikiCodeBlock";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ListChecks,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
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
import { DomainIcon } from "@/components/shared/DomainIcon";
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
    if (!id || completeState === "saving") return;
    setCompleteState("saving");
    try {
      const { gamification } = await completeTopic(id);
      setCompleteState("done");
      surfaceGamification(gamification);
    } catch (err) {
      setCompleteState("idle");
      console.error(apiErrorMessage(err));
    }
  }

  if (topicError) {
    return (
      <main className="container px-4 py-10">
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {topicError}
        </div>
        <div className="mt-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
      </main>
    );
  }

  if (!topic) {
    return (
      <main className="container flex items-center justify-center px-4 py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </main>
    );
  }

  const s = styleFor(topic.roadmap.domain.color);

  return (
    <main className="container px-4 py-10">
      <Link
        href={`/domains/${topic.roadmap.domain.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {topic.roadmap.domain.name} roadmap
      </Link>

      <header className="mt-4 flex flex-col gap-4 rounded-2xl border border-border bg-card/50 p-6 backdrop-blur sm:flex-row sm:items-start">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            s.iconBg
          )}
        >
          <DomainIcon name={topic.roadmap.domain.icon} className={cn("h-6 w-6", s.text)} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <span>{topic.roadmap.domain.name}</span>
            <span className="opacity-40">·</span>
            <span>Topic {String(topic.orderIndex).padStart(2, "0")}</span>
            <span className="opacity-40">·</span>
            <span className="capitalize">{topic.phase}</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">
            {topic.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{topic.summary}</p>
        </div>
      </header>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* AI explanation — main column */}
        <div className="lg:col-span-2">
          <div
            className={cn(
              "rounded-2xl border border-border bg-card/50 p-6 backdrop-blur ring-1 ring-inset",
              s.ring
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles
                  className={cn(
                    "h-4 w-4",
                    s.text,
                    explainState.kind === "loading" && "animate-pulse"
                  )}
                />
                AI explanation
                {explainState.kind === "loading" && (
                  <span className="text-xs font-normal text-muted-foreground">
                    generating…
                  </span>
                )}
                {explainState.kind === "ok" && explainState.data.cached && (
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Cached
                  </span>
                )}
              </div>
              {explainState.kind === "ok" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => requestExplanation(true)}
                  className="text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Regenerate
                </Button>
              )}
            </div>

            <div className="mt-5">
              {explainState.kind === "loading" && <ExplanationSkeleton />}

              {explainState.kind === "error" && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  <p className="font-medium">Couldn&apos;t generate the explanation.</p>
                  <p className="mt-1 opacity-90">{explainState.message}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => requestExplanation(true)}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Try again
                  </Button>
                </div>
              )}

              {explainState.kind === "ok" && (
                <ExplanationContent markdown={explainState.data.explanation} />
              )}
            </div>

          </div>
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
            <h2 className="text-sm font-medium">Mark progress</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              When you understand the explanation and feel ready, mark this topic
              complete.
            </p>
            <Button
              size="md"
              className="mt-4 w-full"
              variant={completeState === "done" ? "outline" : "default"}
              onClick={handleMarkComplete}
              disabled={completeState !== "idle"}
            >
              {completeState === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
              {completeState === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              {completeState === "done"
                ? "Completed"
                : completeState === "saving"
                  ? "Saving…"
                  : "Mark complete"}
            </Button>
          </SidebarCard>

          <SidebarCard>
            <div className="flex items-center gap-2 text-sm font-medium">
              <ListChecks className="h-4 w-4 text-primary" />
              Quiz
              {topic.progress?.bestScore != null && (
                <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Best {topic.progress.bestScore}/5
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              5 AI-generated MCQs. Pass with 3/5 to mark this topic complete.
            </p>
            <Button asChild size="sm" className="mt-3 w-full">
              <Link href={`/quiz/${topic.id}`}>
                <ListChecks className="h-4 w-4" />
                {topic.progress?.bestScore != null ? "Take quiz again" : "Take quiz"}
              </Link>
            </Button>
          </SidebarCard>

          <SidebarCard>
            <ResourceList topicId={topic.id} />
          </SidebarCard>

          <SidebarCard>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Bot className="h-4 w-4 text-primary" />
              Talk to the AI tutor
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Open a chat pre-loaded with this topic. Ask for analogies, deeper
              dives, or a quick quiz.
            </p>
            <Button asChild size="sm" className="mt-3 w-full" variant="outline">
              <Link href={`/chatbot?topic=${topic.id}`}>
                <Bot className="h-4 w-4" />
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
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
      }}
      whileHover={reduce ? undefined : { y: -2 }}
      className="rounded-2xl border border-border bg-card/40 p-5 backdrop-blur-sm transition-colors hover:border-primary/30"
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
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="prose prose-invert prose-sm max-w-none prose-headings:mt-7 prose-headings:mb-3 prose-h2:text-lg prose-h2:font-semibold prose-h2:tracking-tight prose-h2:text-foreground prose-h2:flex prose-h2:items-center prose-h2:gap-2 prose-p:leading-relaxed prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground prose-li:marker:text-primary prose-pre:!bg-transparent prose-pre:!p-0 prose-pre:!border-0 prose-code:bg-muted/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none prose-h2:before:content-[''] prose-h2:before:h-1 prose-h2:before:w-6 prose-h2:before:bg-gradient-to-r prose-h2:before:from-primary prose-h2:before:to-fuchsia-500 prose-h2:before:rounded-full"
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
    <div className="space-y-6">
      {[
        ["w-1/3", ["w-3/4", "w-full", "w-5/6"]],
        ["w-1/4", ["w-full", "w-11/12", "w-4/5", "w-3/4", "w-2/3"]],
        ["w-2/5", ["w-5/6", "w-full", "w-3/4"]],
      ].map(([h, lines], i) => (
        <div key={i} className="space-y-3">
          <div className={`h-5 ${h} animate-pulse rounded bg-muted/60`} />
          {(lines as string[]).map((w, j) => (
            <div
              key={j}
              className={`h-3.5 ${w} animate-pulse rounded bg-muted/30`}
              style={{ animationDelay: `${(i * 4 + j) * 60}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

