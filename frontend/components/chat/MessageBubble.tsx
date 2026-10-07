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
        <span aria-hidden className="mt-0.5 h-10 w-10 shrink-0 rounded-full bg-grape/10 p-0.5">
          <SignalBotStatic className="h-full w-full" />
        </span>
      )}

      <div
        className={cn(
          "min-w-0 max-w-[85%] rounded-2xl px-4 py-3 text-[0.95rem]",
          isUser
            ? "rounded-br-md bg-secondary font-semibold text-white"
            : "rounded-tl-md border-2 border-b-4 border-border bg-card text-foreground"
        )}
        style={isUser ? { boxShadow: "0 4px 0 hsl(var(--secondary-shade))" } : undefined}
      >
        {!isUser && message.intent && (
          <div className="mb-2 inline-flex items-center rounded-full bg-grape/10 px-2.5 py-0.5 text-xs font-extrabold text-grape">
            {INTENT_LABEL[message.intent]}
          </div>
        )}

        {showTyping ? (
          <TypingIndicator />
        ) : isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <article className="prose prose-sm max-w-none font-medium prose-headings:mb-2 prose-headings:mt-4 prose-headings:font-black prose-headings:text-foreground prose-p:leading-relaxed prose-p:text-foreground prose-a:font-bold prose-a:text-secondary prose-strong:font-extrabold prose-strong:text-foreground prose-code:text-foreground prose-li:text-foreground prose-pre:bg-transparent prose-pre:p-0 prose-code:before:content-none prose-code:after:content-none">
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
          className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] font-semibold"
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
