"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronRight } from "lucide-react";

/**
 * "Check yourself" answer, hidden until tapped. The lesson's
 * `<details><summary>Answer</summary>…</details>` HTML is converted to a
 * ````answer fence by `prepareLessonMarkdown` (no raw HTML ever reaches the
 * DOM); this renders it as a native, keyboard-accessible <details>.
 */
export function AnswerReveal({ markdown }: { markdown: string }) {
  return (
    <details className="not-prose group my-3 rounded-lg border border-white/[0.08] bg-white/[0.025] transition-colors open:border-primary/25 open:bg-primary/[0.04] motion-reduce:transition-none">
      <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none [&::-webkit-details-marker]:hidden">
        <ChevronRight
          aria-hidden
          className="h-4 w-4 shrink-0 text-primary transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none"
          strokeWidth={2.4}
        />
        <span className="group-open:hidden">Show answer</span>
        <span className="hidden group-open:inline">Answer</span>
      </summary>
      <div className="px-4 pb-3.5 pl-10 text-[15px] leading-relaxed text-foreground/[0.82] [&_code]:rounded [&_code]:bg-white/[0.06] [&_code]:px-1 [&_code]:text-primary [&_p+p]:mt-2 [&_strong]:text-foreground">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </details>
  );
}
