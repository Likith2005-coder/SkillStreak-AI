"use client";

/**
 * Renders a ```mermaid block from an AI lesson as a real SVG diagram.
 *
 * - `mermaid` (~large) is imported only when a lesson actually has a diagram,
 *   and initialised once with a Midnight theme.
 * - `securityLevel: "strict"`: labels are sanitised, no click handlers.
 * - If the source doesn't parse, we quietly fall back to showing it as a
 *   normal code block. Never a broken box or a red error.
 */

import { useEffect, useId, useRef, useState } from "react";
import { Workflow } from "lucide-react";
import { ShikiCodeBlock } from "@/components/shared/ShikiCodeBlock";

type MermaidApi = typeof import("mermaid").default;

let mermaidPromise: Promise<MermaidApi> | null = null;

// Midnight tokens (app/globals.css) as hex: mermaid's colour maths needs hex.
const C = {
  ground: "#07080b", // --background
  card: "#0e0f13", // --card
  muted: "#16171d", // --muted
  border: "#2a2d36", // a step brighter than --border so edges read
  text: "#f3f4f7", // --foreground
  textMuted: "#9fa3b2", // --muted-foreground
  volt: "#b2ff3d", // --primary
  blue: "#668fff", // --secondary
  violet: "#b285ff", // --grape
};

function loadMermaid(): Promise<MermaidApi> {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        fontFamily: "inherit",
        themeVariables: {
          darkMode: true,
          background: C.card,
          fontFamily: "inherit",
          fontSize: "14px",
          primaryColor: "#151a10",
          primaryTextColor: C.text,
          primaryBorderColor: C.volt,
          secondaryColor: "#10152a",
          secondaryTextColor: C.text,
          secondaryBorderColor: C.blue,
          tertiaryColor: "#17112a",
          tertiaryTextColor: C.text,
          tertiaryBorderColor: C.violet,
          lineColor: C.blue,
          textColor: C.text,
          mainBkg: "#141820",
          nodeBorder: C.blue,
          nodeTextColor: C.text,
          clusterBkg: C.muted,
          clusterBorder: C.border,
          titleColor: C.text,
          edgeLabelBackground: C.card,
          // sequence diagrams
          actorBkg: "#141820",
          actorBorder: C.blue,
          actorTextColor: C.text,
          actorLineColor: C.border,
          signalColor: C.textMuted,
          signalTextColor: C.text,
          labelBoxBkgColor: C.muted,
          labelBoxBorderColor: C.border,
          labelTextColor: C.text,
          loopTextColor: C.text,
          noteBkgColor: "#17112a",
          noteBorderColor: C.violet,
          noteTextColor: C.text,
          activationBkgColor: C.muted,
          activationBorderColor: C.volt,
          sequenceNumberColor: C.ground,
          // class diagrams
          classText: C.text,
        },
        flowchart: { useMaxWidth: true, htmlLabels: true, curve: "basis", padding: 12 },
        sequence: { useMaxWidth: true, mirrorActors: false },
        class: { useMaxWidth: true },
      });
      return mermaid;
    });
  }
  return mermaidPromise;
}

/** First line of the diagram → a human description for screen readers. */
function describe(code: string): string {
  const head = code.trim().split("\n")[0]?.trim() ?? "";
  if (/^sequenceDiagram/.test(head)) return "Sequence diagram";
  if (/^classDiagram/.test(head)) return "Class diagram";
  return "Flow diagram";
}

export function MermaidDiagram({ code, caption }: { code: string; caption?: string }) {
  const rawId = useId();
  const id = `mmd-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [state, setState] = useState<{ kind: "loading" } | { kind: "ok"; svg: string } | { kind: "error" }>({
    kind: "loading",
  });
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    (async () => {
      try {
        const mermaid = await loadMermaid();
        await mermaid.parse(code); // throws on invalid syntax
        const { svg } = await mermaid.render(id, code);
        if (!cancelled) setState({ kind: "ok", svg });
      } catch {
        if (!cancelled) setState({ kind: "error" });
      } finally {
        // Mermaid can leave a temporary (error) node in <body> on failure.
        document.getElementById(`d${id}`)?.remove();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, id]);

  // Keep diagrams legible on phones: never shrink below ~520px (or their
  // natural width, if smaller); the panel scrolls horizontally instead.
  useEffect(() => {
    if (state.kind !== "ok") return;
    const svg = hostRef.current?.querySelector("svg");
    if (!svg) return;
    const natural = parseFloat(svg.style.maxWidth || "") || svg.viewBox.baseVal?.width || 0;
    if (natural > 0) svg.style.minWidth = `${Math.min(natural, 520)}px`;
    svg.style.height = "auto";
    svg.removeAttribute("height");
  }, [state]);

  if (state.kind === "error") {
    return <ShikiCodeBlock code={code} lang="text" />;
  }

  const label = caption ? `${describe(code)}: ${caption}` : describe(code);

  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-white/[0.08] bg-[hsl(var(--background)/0.6)] shadow-[inset_0_1px_0_hsl(0_0%_100%/0.04)]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
        <Workflow aria-hidden className="h-4 w-4 text-secondary" strokeWidth={2.2} />
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Diagram
        </span>
      </div>
      <div className="overflow-x-auto overscroll-x-contain">
        {state.kind === "loading" ? (
          <div className="p-6" aria-hidden>
            <div className="mx-auto flex max-w-md flex-col items-center gap-3">
              <div className="h-9 w-40 animate-pulse rounded-lg bg-white/[0.05] motion-reduce:animate-none" />
              <div className="h-5 w-px bg-white/10" />
              <div className="flex gap-4">
                <div className="h-9 w-28 animate-pulse rounded-lg bg-white/[0.05] motion-reduce:animate-none" />
                <div className="h-9 w-28 animate-pulse rounded-lg bg-white/[0.05] motion-reduce:animate-none" />
              </div>
              <div className="h-5 w-px bg-white/10" />
              <div className="h-9 w-36 animate-pulse rounded-lg bg-white/[0.05] motion-reduce:animate-none" />
            </div>
            <span className="sr-only">Drawing the diagram…</span>
          </div>
        ) : (
          <div
            ref={hostRef}
            role="img"
            aria-label={label}
            className="flex min-w-fit justify-center p-4 sm:p-6 [&_svg]:mx-auto [&_svg]:block"
            dangerouslySetInnerHTML={{ __html: state.svg }}
          />
        )}
      </div>
      {caption && (
        <figcaption className="border-t border-white/[0.06] px-4 py-2.5 text-[13px] leading-snug text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
