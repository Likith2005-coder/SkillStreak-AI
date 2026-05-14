"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage, Intent } from "@/lib/api";
import { TypingIndicator } from "./TypingIndicator";
import { ShikiCodeBlock } from "@/components/shared/ShikiCodeBlock";

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
          className="rounded bg-muted/60 px-1 py-0.5 text-[0.85em] font-mono"
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
