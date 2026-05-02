"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
          : domains?.map((d) => <DomainCard key={d.id} domain={d} />)}
      </section>
    </main>
  );
}

function DomainCard({ domain }: { domain: Domain }) {
  const s = styleFor(domain.color);
  const href = domain.isCurated ? `/domains/${domain.slug}` : `/chatbot?domain=${domain.slug}`;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border bg-card/50 p-6 backdrop-blur transition-all",
        s.cardHover,
        "hover:-translate-y-0.5 hover:shadow-lg"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 -z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br",
          s.gradientFrom,
          s.gradientTo,
          "blur-2xl"
        )}
        aria-hidden
      />

      <div className="flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", s.iconBg)}>
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

      <h2 className="mt-4 text-lg font-semibold tracking-tight">{domain.name}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{domain.description}</p>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span className="capitalize">{domain.difficulty}</span>
        {domain.roadmap && (
          <span>
            {domain.roadmap.totalTopics} topics · ~{domain.roadmap.estimatedDays}d
          </span>
        )}
      </div>

      <div
        className={cn(
          "mt-5 inline-flex items-center gap-1.5 text-sm font-medium transition-transform",
          s.text,
          "group-hover:translate-x-1"
        )}
      >
        {domain.isCurated ? "Open roadmap" : "Ask the AI tutor"}
        <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
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
