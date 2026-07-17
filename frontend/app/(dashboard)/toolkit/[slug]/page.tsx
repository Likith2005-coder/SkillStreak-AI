"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ExternalLink, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { ShikiCodeBlock } from "@/components/shared/ShikiCodeBlock";
import { HackerShell, PromptLine } from "@/components/toolkit/HackerShell";
import { cn } from "@/lib/utils";
import { apiErrorMessage, fetchToolGuide, type ToolGuideResponse } from "@/lib/api";

const DIFFICULTY_STYLE: Record<string, string> = {
  beginner: "text-emerald-300 border-emerald-500/40",
  intermediate: "text-amber-300 border-amber-500/40",
  advanced: "text-rose-300 border-rose-500/40",
};

export default function ToolPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ok"; data: ToolGuideResponse }
    | { kind: "error"; message: string }
  >({ kind: "loading" });

  useEffect(() => {
    if (!slug) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function load() {
    setState({ kind: "loading" });
    try {
      const data = await fetchToolGuide(slug);
      setState({ kind: "ok", data });
    } catch (err) {
      setState({ kind: "error", message: apiErrorMessage(err, "Could not load this guide") });
    }
  }

  const toolName = state.kind === "ok" ? state.data.tool.name : slug;

  return (
    <HackerShell prompt={`root💀skillstreak: ~/arsenal/${slug}`}>
      <Link
        href="/toolkit"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-400/70 transition hover:text-emerald-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        cd ../arsenal
      </Link>

      {state.kind === "loading" && (
        <div className="mt-8">
          <PromptLine path={`~/arsenal/${slug}`} command={`man ${toolName.toLowerCase()}`} />
          <div className="mt-6 flex items-center gap-2 font-mono text-sm text-emerald-400/70">
            <Loader2 className="h-4 w-4 animate-spin" /> compiling field guide<span className="term-cursor" />
          </div>
        </div>
      )}

      {state.kind === "error" && (
        <div className="mt-8 rounded border border-rose-500/40 bg-rose-500/10 p-4 font-mono text-sm text-rose-300">
          <p>[error] couldn&apos;t load this guide.</p>
          <p className="mt-1 opacity-90">{state.message}</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={load}
              className="inline-flex items-center gap-1.5 rounded border border-emerald-500/40 px-3 py-1.5 text-emerald-300 transition hover:bg-emerald-500/10"
            >
              <RefreshCw className="h-3.5 w-3.5" /> retry
            </button>
            <button
              onClick={() => router.push("/toolkit")}
              className="rounded border border-emerald-500/20 px-3 py-1.5 text-emerald-400/70 transition hover:text-emerald-300"
            >
              back
            </button>
          </div>
        </div>
      )}

      {state.kind === "ok" && (
        <>
          <header className="mt-5">
            <PromptLine path={`~/arsenal/${slug}`} command={`man ${state.data.tool.name.toLowerCase()}`} />
            <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-emerald-400/60">
              {state.data.phase && (
                <>
                  <span className="text-emerald-300">{state.data.phase.name}</span>
                  <span className="opacity-40">·</span>
                </>
              )}
              <span>{state.data.tool.category}</span>
              <span className="opacity-40">·</span>
              <span
                className={cn(
                  "rounded border bg-black/30 px-1.5 py-0.5 text-[9px]",
                  DIFFICULTY_STYLE[state.data.tool.difficulty]
                )}
              >
                {state.data.tool.difficulty}
              </span>
            </div>
            <h1 className="mt-2 font-mono text-3xl font-bold tracking-tight text-emerald-300 term-glow">
              {state.data.tool.name}
            </h1>
            <p className="mt-2 max-w-2xl font-mono text-sm text-emerald-100/70">
              {state.data.tool.tagline}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href={state.data.tool.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded border border-emerald-500/30 bg-black/30 px-3 py-1.5 font-mono text-xs text-emerald-300/80 transition hover:border-emerald-400/60 hover:text-emerald-200"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                official_site
              </a>
              {state.data.cached && (
                <span className="rounded border border-emerald-500/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-400/60">
                  cached
                </span>
              )}
              <button
                onClick={load}
                className="ml-auto inline-flex items-center gap-1.5 font-mono text-xs text-emerald-400/70 transition hover:text-emerald-300"
              >
                <RefreshCw className="h-3.5 w-3.5" /> regenerate
              </button>
            </div>
          </header>

          <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] p-3 font-mono text-[11px] text-amber-200/90">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <p>
              [authorized use only] — your own lab, a CTF, or a system you have written permission to
              assess.
            </p>
          </div>

          <div className="mt-6 rounded-lg border border-emerald-500/20 bg-black/40 p-5 sm:p-6">
            <GuideContent markdown={state.data.guide} />
          </div>
        </>
      )}
    </HackerShell>
  );
}

function GuideContent({ markdown }: { markdown: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="prose prose-invert prose-sm max-w-none prose-headings:mt-7 prose-headings:mb-3 prose-h2:text-lg prose-h2:font-semibold prose-h2:tracking-tight prose-h2:flex prose-h2:items-center prose-h2:gap-2 prose-p:leading-relaxed prose-strong:text-foreground prose-li:marker:text-emerald-400 prose-table:text-xs prose-pre:!bg-transparent prose-pre:!p-0 prose-pre:!border-0 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-h2:before:content-[''] prose-h2:before:h-1 prose-h2:before:w-6 prose-h2:before:rounded-full"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={guideMdComponents}>
        {markdown}
      </ReactMarkdown>
    </motion.article>
  );
}

const guideMdComponents: Components = {
  pre({ children }) {
    const codeNode = Array.isArray(children) ? children[0] : children;
    const props =
      codeNode && typeof codeNode === "object" && "props" in codeNode
        ? (codeNode as { props: { className?: string; children?: React.ReactNode } }).props
        : { className: "", children: "" };
    const lang = (props.className?.match(/language-([\w-]+)/)?.[1] ?? "bash").toLowerCase();
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
