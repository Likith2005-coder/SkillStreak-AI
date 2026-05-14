"use client";

/**
 * Lazy singleton Shiki highlighter. We load grammars on demand and keep a
 * single highlighter instance for the page lifetime — building one is
 * ~100KB of WASM and ~100ms, so amortising matters.
 *
 * Themes: `github-dark-dimmed` reads cleanly against our slate background
 * without screaming "VS Code". Add another theme to `themes` below if you
 * want light-mode parity later.
 */

import type { Highlighter, BundledLanguage } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

const COMMON_LANGS: BundledLanguage[] = [
  "ts",
  "tsx",
  "js",
  "jsx",
  "python",
  "bash",
  "shell",
  "sql",
  "json",
  "yaml",
  "html",
  "css",
  "go",
  "rust",
  "java",
  "c",
  "cpp",
  "csharp",
  "ruby",
  "php",
  "markdown",
  "diff",
];

export async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      const { createHighlighter } = await import("shiki");
      return createHighlighter({
        themes: ["github-dark-dimmed"],
        langs: COMMON_LANGS,
      });
    })();
  }
  return highlighterPromise;
}

/**
 * Highlight a snippet. Falls back to a plain pre+code if the language is
 * unknown — never throws into the rendering tree.
 */
export async function highlight(code: string, lang: string): Promise<string> {
  const normalized = normalizeLang(lang);
  try {
    const h = await getHighlighter();
    return h.codeToHtml(code, {
      lang: normalized,
      theme: "github-dark-dimmed",
    });
  } catch {
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  }
}

function normalizeLang(lang: string): BundledLanguage {
  const l = (lang || "").toLowerCase().trim();
  if (!l) return "ts";
  if (l === "typescript") return "ts";
  if (l === "javascript") return "js";
  if (l === "py") return "python";
  if (l === "sh" || l === "zsh") return "bash";
  if (l === "yml") return "yaml";
  if (l === "c++") return "cpp";
  if (l === "cs") return "csharp";
  if ((COMMON_LANGS as string[]).includes(l)) return l as BundledLanguage;
  return "ts";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
