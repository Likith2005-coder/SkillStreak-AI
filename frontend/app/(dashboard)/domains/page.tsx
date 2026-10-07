"use client";

import { useEffect, useState } from "react";
import { Link } from "next-view-transitions";
import { MorphTextStyle } from "@/components/shared/MorphTextStyle";
import { Mascot } from "@/components/playground/Mascot";
import { motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { ArrowRight, BookOpen, Clock, MessageCircle } from "lucide-react";
import {
  apiErrorMessage,
  fetchDomains,
  fetchOverview,
  type Domain,
  type DomainProgressTile,
} from "@/lib/api";
import { rememberDomains } from "@/lib/domainCache";
import { styleFor } from "@/lib/domain-style";
import { DomainTile, domainPalette } from "@/components/shared/DomainIcon";
import { cn } from "@/lib/utils";

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Per-domain progress is a nice-to-have: the grid never waits on it.
  const [progress, setProgress] = useState<Map<string, DomainProgressTile>>(new Map());

  useEffect(() => {
    let cancelled = false;
    fetchDomains()
      .then((d) => {
        if (!cancelled) {
          rememberDomains(d);
          setDomains(d);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, "Could not load domains"));
      });
    fetchOverview()
      .then((o) => {
        if (!cancelled) setProgress(new Map(o.perDomain.map((t) => [t.slug, t])));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="container px-4 py-8 sm:py-10">
      <header className="flex items-end justify-between gap-6">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl text-foreground sm:text-5xl [text-wrap:balance]">
            9 paths into <span className="text-primary">modern tech</span>
          </h1>
          <p className="mt-3 text-base font-semibold text-muted-foreground">
            Five domains have full curated roadmaps. The other four are served
            on-demand by the AI tutor — same depth, generated as you go.
          </p>
        </div>
        <Mascot
          message="Pick one. I'll be your guide the whole way!"
          size={104}
          side="left"
          className="hidden shrink-0 md:flex"
        />
      </header>

      {error && (
        <div className="mt-6 rounded-2xl border-2 border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive-text">
          {error}
        </div>
      )}

      <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {domains === null && !error
          ? Array.from({ length: 6 }).map((_, i) => <DomainSkeleton key={i} />)
          : domains?.map((d, i) => (
              <DomainCard key={d.id} domain={d} index={i} progress={progress.get(d.slug)} />
            ))}
        <MorphTextStyle slugs={domains?.map((d) => d.slug) ?? []} />
      </section>
    </main>
  );
}

// Alternating tilts so the grid of stickers looks hand-placed, not stamped.
const TILTS = [-6, 5, -4, 7, -7, 4];

function DomainCard({
  domain,
  index,
  progress,
}: {
  domain: Domain;
  index: number;
  progress?: DomainProgressTile;
}) {
  const s = styleFor(domain.color);
  const p = domainPalette(domain.color);
  const reduce = useReducedMotion();
  const href = domain.isCurated ? `/domains/${domain.slug}` : `/chatbot?domain=${domain.slug}`;
  const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduce ? 0 : 0.45,
        delay: reduce ? 0 : Math.min(index * 0.06, 0.4),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="h-full"
    >
      <Link
        href={href}
        // View-transition names pair this card with the roadmap header, so
        // opening a domain morphs the card into the page instead of cutting.
        style={{ viewTransitionName: `domain-card-${domain.slug}` }}
        className="card-chunky card-press focus-ring group flex h-full flex-col p-5 transition-colors hover:bg-muted/40"
      >
        <div className="flex items-start justify-between gap-3">
          <DomainTile
            name={domain.icon}
            color={domain.color}
            size={60}
            tilt={TILTS[index % TILTS.length]}
            className="transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none"
            style={{ viewTransitionName: `domain-icon-${domain.slug}` }}
          />
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold",
              domain.isCurated ? "bg-primary/10 text-primary-shade" : "bg-grape/10 text-grape-shade"
            )}
          >
            {domain.isCurated ? <BookOpen className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
            {domain.isCurated ? "Full roadmap" : "AI tutor"}
          </span>
        </div>

        <h2
          style={{ viewTransitionName: `domain-title-${domain.slug}` }}
          className="mt-5 w-fit font-display text-2xl leading-tight text-foreground"
        >
          {domain.name}
        </h2>
        <p className="mt-1.5 line-clamp-3 text-sm font-semibold leading-relaxed text-muted-foreground">
          {domain.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-extrabold capitalize", s.iconBg, s.text)}>
            {domain.difficulty}
          </span>
          {domain.roadmap && (
            <>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-extrabold text-foreground">
                {domain.roadmap.totalTopics} topics
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-extrabold text-foreground">
                <Clock className="h-3 w-3" aria-hidden /> ~{domain.roadmap.estimatedDays} days
              </span>
            </>
          )}
        </div>

        {/* Pushes the footer to the bottom so every card in a row lines up */}
        <div className="flex-1" />

        {progress && progress.done > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="text-foreground">Your progress</span>
              <span className={cn("tabular-nums", s.text)}>
                {progress.done}/{progress.total}
              </span>
            </div>
            <div
              className="mt-1.5 h-4 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${domain.name}: ${progress.done} of ${progress.total} topics done`}
            >
              <div className="relative h-full rounded-full" style={{ width: `${Math.max(pct, 6)}%`, background: p.bright }}>
                <span className="absolute inset-x-2 top-[3px] h-1.5 rounded-full bg-white/35" />
              </div>
            </div>
          </div>
        )}

        <div
          className={cn(
            "mt-5 inline-flex items-center gap-1.5 text-sm font-black uppercase tracking-wide",
            s.text
          )}
        >
          {domain.isCurated ? (progress && progress.done > 0 ? "Keep going" : "Open roadmap") : "Ask the AI tutor"}
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
            strokeWidth={3}
          />
        </div>
      </Link>
    </motion.div>
  );
}

function DomainSkeleton() {
  return (
    <div className="card-chunky p-5" aria-hidden>
      <div className="flex items-start justify-between">
        <div className="h-[60px] w-[60px] animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
        <div className="h-6 w-24 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
      </div>
      <div className="mt-5 h-7 w-2/3 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      <div className="mt-3 h-4 w-full animate-pulse rounded bg-muted motion-reduce:animate-none" />
      <div className="mt-1.5 h-4 w-4/5 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      <div className="mt-5 h-5 w-1/2 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
    </div>
  );
}
