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

  // The block stays dark on every theme (syntax colours are tuned for it);
  // only the frame joins the chunky look: rounded, 2px rim, heavier bottom edge.
  return (
    <div className="not-prose group relative my-4 overflow-hidden rounded-2xl border-2 border-b-[5px] border-[#1c2128] bg-[#22272e]">
      <div className="flex items-center justify-between border-b-2 border-[#1c2128] bg-black/20 py-1 pl-4 pr-1.5">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">{lang || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={3} /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {html ? (
        <div
          className="shiki-block overflow-x-auto text-[13px] leading-relaxed [&>pre]:!bg-transparent [&>pre]:p-4"
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
