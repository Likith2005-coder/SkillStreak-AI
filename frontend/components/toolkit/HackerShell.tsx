"use client";

/**
 * Scoped hacker/terminal theme wrapper for the Ethical Hacking Arsenal.
 * Provides the near-black phosphor-grid background, a terminal window chrome
 * bar, and a monospace green scope. Everything inside inherits the `.hacker`
 * theme (see globals.css).
 */

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

export function HackerShell({
  prompt,
  children,
}: {
  prompt: string;
  children: React.ReactNode;
}) {
  return (
    <div className="hacker relative min-h-screen text-emerald-100">
      <div className="hacker-bg" aria-hidden />
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-emerald-500/25 bg-black/60 shadow-[0_0_40px_-10px_rgba(16,185,129,0.25)] backdrop-blur-sm">
          {/* Terminal title bar */}
          <div className="flex items-center gap-2 border-b border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-2.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            <span className="ml-3 truncate font-mono text-xs text-emerald-300/80">
              {prompt}
            </span>
          </div>
          <div className="p-5 sm:p-7">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** A green shell prompt line, e.g. `┌──(root㉿skillstreak)-[~/arsenal]`.
 *  Pass `typed` to have the command type itself out with a trailing cursor. */
export function PromptLine({
  path,
  command,
  typed = false,
}: {
  path: string;
  command?: string;
  typed?: boolean;
}) {
  const shown = useTypewriter(typed && command ? command : null);
  const isTyping = typed && command != null && shown.length < command.length;

  return (
    <div className="font-mono text-xs leading-relaxed">
      <div className="text-emerald-400/70">
        ┌──(<span className="text-emerald-300">root💀skillstreak</span>)-[<span className="text-sky-300">{path}</span>]
      </div>
      <div className="text-emerald-400/70">
        └─<span className="text-emerald-300">$</span>{" "}
        {command ? (
          <span className="text-emerald-100">
            {typed ? shown : command}
            {isTyping && <span className="term-cursor" />}
          </span>
        ) : (
          <span className="term-cursor" />
        )}
      </div>
    </div>
  );
}

/** Types `text` out one char at a time; returns the full string immediately
 *  when null (disabled) or when the user prefers reduced motion. */
function useTypewriter(text: string | null, charMs = 34): string {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(text ?? "");

  useEffect(() => {
    if (text == null) return;
    if (reduce) {
      setShown(text);
      return;
    }
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, charMs);
    return () => clearInterval(id);
  }, [text, reduce, charMs]);

  return shown;
}
