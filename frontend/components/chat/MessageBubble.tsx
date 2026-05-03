"use client";

import { useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Check, Copy, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage, Intent } from "@/lib/api";
import { TypingIndicator } from "./TypingIndicator";

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

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  const showTyping = message.streaming && !message.content;

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUser ? "animate-slide-in-right justify-end" : "animate-fade-in justify-start"
      )}
    >
      {!isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
          <Bot className="h-3.5 w-3.5" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
          isUser
            ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white"
            : "border border-border bg-card/60 text-foreground"
        )}
      >
        {!isUser && message.intent && (
          <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            {INTENT_LABEL[message.intent]}
          </div>
        )}

        {showTyping ? (
          <TypingIndicator />
        ) : isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <article className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:mt-4 prose-headings:mb-2 prose-pre:bg-transparent prose-pre:p-0 prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {message.content}
            </ReactMarkdown>
          </article>
        )}
      </div>

      {isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-card/60 text-muted-foreground">
          <User className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
}

const mdComponents: Components = {
  pre({ children }) {
    return <CodeBlock>{children}</CodeBlock>;
  },
  code({ className, children, ...rest }) {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="rounded bg-muted/60 px-1 py-0.5 text-[0.85em] font-mono"
          {...rest}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={cn("font-mono text-[0.85em]", className)} {...rest}>
        {children}
      </code>
    );
  },
};

function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const text = extractText(children);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="group relative my-2 rounded-lg border border-border bg-muted/40">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/70 px-2 py-1 text-[11px] text-muted-foreground opacity-0 backdrop-blur transition group-hover:opacity-100 hover:text-foreground"
        aria-label={copied ? "Copied" : "Copy code"}
      >
        {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed">{children}</pre>
    </div>
  );
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return extractText((node as { props: { children: React.ReactNode } }).props.children);
  }
  return "";
}
