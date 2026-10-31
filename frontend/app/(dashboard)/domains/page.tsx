"use client";

import { useEffect, useState, type CSSProperties } from "react";
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
import { DomainTile, domainPalette, withAlpha } from "@/components/shared/DomainIcon";
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

  const curated = domains?.filter((d) => d.isCurated).length ?? 5;
  const count = domains ? domains.length : 9;

  return (
    <main className="container relative px-4 py-10 sm:py-14">
      {/* Hero light: an aurora pool and a faint grid behind the headline */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-10 -z-10 h-[420px] overflow-hidden">
        <div className="grid-faint absolute inset-0" />
        <div className="absolute left-[8%] top-0 h-72 w-72 rounded-full bg-aurora-1/20 blur-[90px]" />
        <div className="absolute left-[38%] top-16 h-64 w-64 rounded-full bg-aurora-3/10 blur-[90px]" />
      </div>

      <header className="flex items-end justify-between gap-6">
        <div className="max-w-3xl">
          <p className="label-mono text-muted-foreground">
            {count} domains · {curated} curated roadmaps
          </p>
          <h1 className="mt-3 font-display text-[clamp(2.4rem,6vw,4.75rem)] leading-[0.95] text-foreground [text-wrap:balance]">
            {count} paths into{" "}
            <span className="font-serif-accent text-glow text-primary">modern tech</span>
          </h1>
          <p className="mt-5 max-w-[60ch] text-base leading-relaxed text-muted-foreground">
            Every domain is a full roadmap, from your first concept to job-ready. The AI
            tutor fills in anything else you&apos;re curious about along the way.
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
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive-text">
          {error}
        </div>
      )}

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
  // The cursor spotlight and the hover glow take the domain's own colour.
  const lit = {
    "--spot": hexToHslTriplet(p.bright),
    "--glow": withAlpha(p.bright, 0.35),
  } as CSSProperties;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduce ? 0 : 0.5,
        delay: reduce ? 0 : Math.min(index * 0.06, 0.4),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="h-full"
    >
      <Link
        href={href}
        // View-transition names pair this card with the roadmap header, so
        // opening a domain morphs the card into the page instead of cutting.
        style={{ viewTransitionName: `domain-card-${domain.slug}`, ...lit }}
        className="card-chunky card-press spotlight focus-ring group flex h-full flex-col overflow-hidden p-6 hover:!shadow-[inset_0_1px_0_rgb(255_255_255/0.07),0_24px_60px_-24px_var(--glow)]"
      >
        <div className="flex items-start justify-between gap-3">
          <DomainTile
            name={domain.icon}
            color={domain.color}
            size={52}
            className="transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
            style={{ viewTransitionName: `domain-icon-${domain.slug}` }}
          />
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
              domain.isCurated
                ? "border-primary/25 bg-primary/10 text-primary"
                : "border-grape/25 bg-grape/10 text-grape"
            )}
          >
            {domain.isCurated ? (
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            )}
            {domain.isCurated ? "Full roadmap" : "AI tutor"}
          </span>
        </div>

        <h2
          style={{ viewTransitionName: `domain-title-${domain.slug}` }}
          className="mt-6 w-fit font-display text-[1.6rem] leading-tight text-foreground"
        >
          {domain.name}
        </h2>
        <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-muted-foreground">
          {domain.description}
        </p>

        <div className="mt-5 flex flex-wrap gap-1.5">
          <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", s.badgeBg)}>
            {domain.difficulty}
          </span>
          {domain.roadmap && (
            <>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
                {domain.roadmap.totalTopics} topics
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
                <Clock className="h-3 w-3" aria-hidden /> ~{domain.roadmap.estimatedDays} days
              </span>
            </>
          )}
        </div>

        {/* Pushes the footer to the bottom so every card in a row lines up */}
        <div className="flex-1" />

        {progress && progress.done > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <span className="label-mono text-muted-foreground">Progress</span>
              <span className="font-mono text-xs font-semibold tabular-nums" style={{ color: p.light }}>
                {progress.done}/{progress.total}
              </span>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${domain.name}: ${progress.done} of ${progress.total} topics done`}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(pct, 4)}%`,
                  background: p.bright,
                  boxShadow: `0 0 12px ${withAlpha(p.bright, 0.7)}`,
                }}
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <span className="text-sm font-semibold text-foreground">
            {domain.isCurated ? (progress && progress.done > 0 ? "Keep going" : "Open roadmap") : "Ask the AI tutor"}
          </span>
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
            style={{ color: p.light }}
          >
            <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

/** `#rrggbb` to `H S% L%`, so a domain hex can feed the hsl()-based spotlight. */
function hexToHslTriplet(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let sat = 0;
  if (max !== min) {
    const d = max - min;
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(sat * 100)}% ${Math.round(l * 100)}%`;
}

function DomainSkeleton() {
  return (
    <div className="card-chunky p-6" aria-hidden>
      <div className="flex items-start justify-between">
        <div className="h-[52px] w-[52px] animate-pulse rounded-[28%] bg-muted motion-reduce:animate-none" />
        <div className="h-6 w-24 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
      </div>
      <div className="mt-5 h-7 w-2/3 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      <div className="mt-3 h-4 w-full animate-pulse rounded bg-muted motion-reduce:animate-none" />
      <div className="mt-1.5 h-4 w-4/5 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      <div className="mt-5 h-5 w-1/2 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
    </div>
  );
}
