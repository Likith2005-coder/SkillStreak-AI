"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, MessageCircle, Sparkles } from "lucide-react";
import { apiErrorMessage, fetchDomains, type Domain } from "@/lib/api";
import { styleFor } from "@/lib/domain-style";
import { DomainIcon } from "@/components/shared/DomainIcon";
import { cn } from "@/lib/utils";

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDomains()
      .then((d) => {
        if (!cancelled) setDomains(d);
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, "Could not load domains"));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="container px-4 py-10">
      <header className="max-w-2xl">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Pick your domain
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          9 paths into modern tech
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Five domains have full curated roadmaps. The other four are served
          on-demand by the AI tutor — same depth, generated as you go.
        </p>
      </header>

      {error && (
        <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {domains === null && !error
          ? Array.from({ length: 6 }).map((_, i) => <DomainSkeleton key={i} />)
          : domains?.map((d, i) => <DomainCard key={d.id} domain={d} index={i} />)}
      </section>
    </main>
  );
}

function DomainCard({ domain, index }: { domain: Domain; index: number }) {
  const s = styleFor(domain.color);
  const reduce = useReducedMotion();
  const href = domain.isCurated ? `/domains/${domain.slug}` : `/chatbot?domain=${domain.slug}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduce ? 0 : 0.4,
        delay: reduce ? 0 : Math.min(index * 0.06, 0.4),
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={reduce ? undefined : { y: -4, scale: 1.01 }}
      whileTap={reduce ? undefined : { scale: 0.995 }}
      className="group relative isolate"
    >
      {/* Outer halo — soft glow outside the card edge */}
      <div
        className={cn(
          "pointer-events-none absolute -inset-px -z-10 rounded-2xl bg-gradient-to-br opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-50",
          s.gradientFrom,
          s.gradientTo
        )}
        aria-hidden
      />

      <Link
        href={href}
        className={cn(
          "relative isolate flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/70 p-6 backdrop-blur-md transition-colors duration-300",
          s.cardHover
        )}
      >
        {/* Inside-the-card colored wash — fades in on hover, low opacity so text stays readable */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-25",
            s.gradientFrom,
            s.gradientTo
          )}
          aria-hidden
        />
        {/* Diagonal sheen that sweeps across on hover */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"
          aria-hidden
        />
        {/* Inset border highlight */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-1 ring-inset transition-opacity duration-300 group-hover:opacity-100",
            s.ring
          )}
          aria-hidden
        />

        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]",
              s.iconBg
            )}
          >
            <DomainIcon name={domain.icon} className={cn("h-5 w-5", s.text)} />
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
              domain.isCurated
                ? s.badgeBg
                : "border-border bg-card/60 text-muted-foreground"
            )}
          >
            {domain.isCurated ? <BookOpen className="h-3 w-3" /> : <MessageCircle className="h-3 w-3" />}
            {domain.isCurated ? "Curated" : "Via chatbot"}
          </span>
        </div>

        <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground drop-shadow-sm">
          {domain.name}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground transition-colors duration-300 group-hover:text-white">
          {domain.description}
        </p>

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground transition-colors duration-300 group-hover:text-white/80">
          <span className="capitalize">{domain.difficulty}</span>
          {domain.roadmap && (
            <span>
              {domain.roadmap.totalTopics} topics · ~{domain.roadmap.estimatedDays}d
            </span>
          )}
        </div>

        <div
          className={cn(
            "mt-5 inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-300 group-hover:translate-x-1 group-hover:text-white",
            s.text
          )}
        >
          {domain.isCurated ? "Open roadmap" : "Ask the AI tutor"}
          <ArrowRight className="h-4 w-4" />
        </div>
      </Link>
    </motion.div>
  );
}

function DomainSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-6">
      <div className="flex items-start justify-between">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-muted/50" />
        <div className="h-5 w-20 animate-pulse rounded-full bg-muted/40" />
      </div>
      <div className="mt-5 h-5 w-2/3 animate-pulse rounded bg-muted/50" />
      <div className="mt-2 h-4 w-full animate-pulse rounded bg-muted/30" />
      <div className="mt-1.5 h-4 w-4/5 animate-pulse rounded bg-muted/30" />
    </div>
  );
}
