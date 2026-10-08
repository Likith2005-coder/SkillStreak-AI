"use client";

/**
 * Code block that highlights via Shiki on mount and shows a plain
 * monospace fallback during the brief async load. Includes a copy
 * button that appears on hover.
 *
 * Drop-in for the `pre` slot of react-markdown.
 */

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { highlight } from "@/lib/shiki";

interface ShikiCodeBlockProps {
  code: string;
  lang: string;
}

export function ShikiCodeBlock({ code, lang }: ShikiCodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    highlight(code, lang).then((out) => {
      if (!cancelled) setHtml(out);
    });
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  // A deeper well than the panel it sits in: hairline rim, a faint top lip,
  // a mono language tag with a volt dot, and a quiet copy control.
  return (
    <div className="not-prose group relative my-6 overflow-hidden rounded-xl border border-white/10 bg-[#07090d] shadow-[inset_0_1px_0_rgb(255_255_255/0.05),0_12px_32px_-16px_rgb(0_0_0/0.8)]">
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] py-1 pl-4 pr-1.5">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-slate-400">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.9)]" />
          {lang || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2.6} /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {html ? (
        <div
          className="shiki-block overflow-x-auto font-mono text-[13px] leading-relaxed [&>pre]:!bg-transparent [&>pre]:p-4"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-slate-200">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
