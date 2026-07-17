"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ChevronRight,
  FileText,
  KeyRound,
  Loader2,
  Network,
  Radar,
  Search,
  ShieldAlert,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import { apiErrorMessage, fetchArsenal, type ArsenalPhase, type ArsenalTool } from "@/lib/api";
import { HackerShell, PromptLine } from "@/components/toolkit/HackerShell";
import { cn } from "@/lib/utils";

const PHASE_ICONS: Record<string, LucideIcon> = {
  search: Search,
  radar: Radar,
  "key-round": KeyRound,
  network: Network,
  "file-text": FileText,
};

const DIFFICULTY_STYLE: Record<string, string> = {
  beginner: "text-emerald-300 border-emerald-500/40",
  intermediate: "text-amber-300 border-amber-500/40",
  advanced: "text-rose-300 border-rose-500/40",
};

export default function ToolkitPage() {
  const [phases, setPhases] = useState<ArsenalPhase[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchArsenal()
      .then((p) => !cancelled && setPhases(p))
      .catch((err) => !cancelled && setError(apiErrorMessage(err, "Could not load the arsenal")));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <HackerShell prompt="root💀skillstreak: ~/arsenal">
      <header>
        <PromptLine path="~/arsenal" command="./list-tools --by-phase" />
        <h1 className="mt-4 font-mono text-2xl font-bold tracking-tight text-emerald-300 term-glow sm:text-3xl">
          &gt; THE_ARSENAL
        </h1>
        <p className="mt-3 max-w-3xl font-mono text-sm leading-relaxed text-emerald-100/70">
          Every phase of a penetration test, with the real tools used at each step — each with an
          AI-generated, command-packed field guide. Follow the kill chain:{" "}
          <span className="text-emerald-300">recon → scan → access → post-exploit → report</span>.
        </p>
      </header>

      <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] p-3.5 font-mono text-[11px] leading-relaxed text-amber-200/90">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <p>
          <strong className="font-semibold text-amber-200">[AUTHORIZED USE ONLY]</strong> These are
          professional security tools. Only use them on systems you own or have explicit written
          permission to test (your lab, HackTheBox/TryHackMe, CTFs, a scoped engagement).
          Unauthorized access is a crime.
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded border border-rose-500/40 bg-rose-500/10 px-3 py-2 font-mono text-sm text-rose-300">
          [error] {error}
        </div>
      )}

      {!phases && !error && (
        <div className="mt-10 flex items-center justify-center gap-2 font-mono text-sm text-emerald-400/70">
          <Loader2 className="h-4 w-4 animate-spin" /> loading modules<span className="term-cursor" />
        </div>
      )}

      {phases && (
        <div className="mt-8 space-y-10">
          {phases.map((phase) => (
            <PhaseSection key={phase.slug} phase={phase} />
          ))}
        </div>
      )}
    </HackerShell>
  );
}

function PhaseSection({ phase }: { phase: ArsenalPhase }) {
  const Icon = PHASE_ICONS[phase.icon] ?? Terminal;
  return (
    <section>
      <div className="flex items-start gap-3 border-l-2 border-emerald-500/40 pl-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/[0.06]">
          <Icon className="h-5 w-5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <div className="font-mono text-[11px] uppercase tracking-widest text-emerald-400/60">
            phase_{String(phase.order).padStart(2, "0")} · {phase.tools.length} tools
          </div>
          <h2 className="font-mono text-lg font-semibold text-emerald-200">{phase.name}</h2>
          <p className="mt-1 max-w-2xl font-mono text-xs text-emerald-100/60">{phase.summary}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {phase.tools.map((tool, i) => (
          <ToolCard key={tool.slug} tool={tool} index={i} />
        ))}
      </div>
    </section>
  );
}

function ToolCard({ tool, index }: { tool: ArsenalTool; index: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.2) }}
    >
      <Link
        href={`/toolkit/${tool.slug}`}
        className={cn(
          "group flex h-full flex-col rounded-lg border border-emerald-500/20 bg-black/40 p-3.5 transition-all",
          "hover:border-emerald-400/60 hover:bg-emerald-500/[0.04] hover:shadow-[0_0_20px_-6px_rgba(16,185,129,0.4)]"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-mono font-medium text-emerald-100 group-hover:text-emerald-300">
            <span className="text-emerald-500/60">$</span> {tool.name}
          </h3>
          <span
            className={cn(
              "shrink-0 rounded border bg-black/30 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide",
              DIFFICULTY_STYLE[tool.difficulty]
            )}
          >
            {tool.difficulty}
          </span>
        </div>
        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-400/60">
          {tool.category}
        </div>
        <p className="mt-2 flex-1 font-mono text-xs leading-relaxed text-emerald-100/60">
          {tool.tagline}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {tool.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded border border-emerald-500/20 bg-emerald-500/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-emerald-300/70"
              >
                #{t}
              </span>
            ))}
          </div>
          <ChevronRight className="h-4 w-4 text-emerald-500/40 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400" />
        </div>
      </Link>
    </motion.div>
  );
}
