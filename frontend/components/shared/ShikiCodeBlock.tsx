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

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-border bg-[#22272e]">
      {lang && (
        <div className="flex items-center justify-between border-b border-border/60 bg-black/20 px-3 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>{lang}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 opacity-0 transition hover:bg-white/5 hover:text-foreground group-hover:opacity-100"
            aria-label={copied ? "Copied" : "Copy code"}
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
      {html ? (
        <div
          className="shiki-block overflow-x-auto text-[13px] leading-relaxed [&>pre]:!bg-transparent [&>pre]:p-4"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-foreground/80">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
