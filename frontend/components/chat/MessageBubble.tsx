"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import type { ChatMessage, Intent } from "@/lib/api";
import { TypingIndicator } from "./TypingIndicator";
import { ShikiCodeBlock } from "@/components/shared/ShikiCodeBlock";
import { SignalBotStatic } from "@/components/3d/SignalBotStatic";

type Props = {
  message: ChatMessage & { streaming?: boolean };
};

const INTENT_LABEL: Record<Intent, string> = {
  explain: "Explain",
  roadmap: "Roadmap",
  quiz: "Quiz",
  recommend: "Resources",
  doubt: "Debug",
  motivational: "Pep talk",
};

// Markdown on dark, tuned for long reading: calm body colour, display-face
// headings, volt list markers, hairline rules and tables.
const PROSE = cn(
  "prose prose-sm prose-invert max-w-none text-[0.95rem] leading-relaxed [overflow-wrap:anywhere] prose-code:break-words",
  "prose-p:my-3 prose-p:leading-[1.7] prose-p:text-foreground/90",
  "prose-headings:mb-2 prose-headings:mt-6 prose-headings:font-display prose-headings:tracking-[-0.02em] prose-headings:text-foreground",
  "prose-h1:text-xl prose-h2:text-lg prose-h3:text-base",
  "prose-strong:font-semibold prose-strong:text-foreground",
  "prose-a:font-medium prose-a:text-secondary prose-a:underline-offset-4 prose-a:decoration-secondary/40 hover:prose-a:decoration-secondary",
  "prose-li:my-1 prose-li:text-foreground/90 prose-ul:my-3 prose-ol:my-3 marker:prose-li:text-primary",
  "prose-blockquote:border-l-grape/50 prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:text-muted-foreground",
  "prose-hr:border-white/[0.08]",
  "prose-th:border-b prose-th:border-white/10 prose-th:text-foreground prose-td:border-white/[0.06] prose-tr:border-white/[0.06]",
  "prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none",
  "prose-pre:bg-transparent prose-pre:p-0",
  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
);

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  const showTyping = message.streaming && !message.content;

  if (isUser) {
    return (
      <div className="flex w-full animate-slide-in-right justify-end">
        <div className="min-w-0 max-w-[85%] rounded-2xl rounded-br-md border border-secondary/20 bg-secondary/[0.1] px-4 py-2.5 text-[0.95rem] leading-relaxed text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] sm:max-w-[75%]">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  // Assistant: no bubble. The answer reads as a document beside the bot,
  // the way premium AI products set long-form replies.
  return (
    <div className="flex w-full animate-fade-in justify-start gap-3">
      <span
        aria-hidden
        className={cn(
          "relative mt-0.5 h-8 w-8 shrink-0 rounded-full bg-white/[0.04] p-0.5 ring-1 ring-grape/30 shadow-[0_0_18px_-4px_hsl(var(--grape)/0.6)]",
          message.streaming && "ring-grape/60 shadow-[0_0_24px_-2px_hsl(var(--grape)/0.75)]"
        )}
      >
        <SignalBotStatic className="h-full w-full" />
      </span>

      <div className="min-w-0 flex-1 pt-0.5">
        {message.intent && (
          <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-grape/25 bg-grape/10 px-2.5 py-0.5 text-xs font-medium text-grape">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-grape shadow-[0_0_6px_hsl(var(--grape))]" />
            {INTENT_LABEL[message.intent]}
          </div>
        )}

        {showTyping ? (
          <TypingIndicator />
        ) : (
          <article className={PROSE}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {message.content}
            </ReactMarkdown>
          </article>
        )}
      </div>
    </div>
  );
}

const mdComponents: Components = {
  // react-markdown gives us a `pre > code className="language-xxx"` tree;
  // we read the lang off the inner code and hand the raw text to Shiki.
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
  code({ className, children, ...rest }) {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[0.82em] font-normal text-primary-bright"
          {...rest}
        >
          {children}
        </code>
      );
    }
    // The block path is handled by `pre` above — render the code node naked
    // here so we don't double-wrap.
    return (
      <code className={cn("font-mono text-[0.85em]", className)} {...rest}>
        {children}
      </code>
    );
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
