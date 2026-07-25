"use client";

/**
 * Personalized plan — the output of the AI-mentor assessment. Renders the
 * learner profile, an adaptive-tips banner driven by live quiz scores, the
 * phase-by-phase roadmap (accordion timeline), the capstone build guide,
 * and the week-1 daily schedule.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clapperboard,
  Dumbbell,
  FileText,
  Flag,
  Hammer,
  Loader2,
  RefreshCcw,
  Rocket,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  apiErrorMessage,
  fetchPersonalizedPlan,
  type PlanPhase,
  type PlanResource,
  type PlanResponse,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

function resourceHref(r: PlanResource, kind: "videos" | "docs" | "courses" | "practice"): string {
  if (r.url) return r.url;
  const q = encodeURIComponent(r.query ?? r.title);
  return kind === "videos"
    ? `https://www.youtube.com/results?search_query=${q}`
    : `https://www.google.com/search?q=${q}`;
}

export function PlanClient() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [data, setData] = useState<PlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openPhase, setOpenPhase] = useState(0);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetchPersonalizedPlan(slug)
      .then((d) => {
        if (cancelled) return;
        if (!d.exists) {
          router.replace(`/domains/${slug}?assess=1`);
          return;
        }
        setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, "Could not load your plan"));
      });
    return () => {
      cancelled = true;
    };
  }, [slug, router]);

  if (error) {
    return (
      <main className="container px-4 py-10">
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      </main>
    );
  }
  if (!data || !data.exists) {
    return (
      <main className="container flex items-center gap-3 px-4 py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading your plan…
      </main>
    );
  }

  const { profile, plan, adaptive, domain } = data;
  const rise = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-40px" },
          transition: { duration: 0.5, delay, ease: EASE },
        };

  return (
    <main className="container max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/domains/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {domain.name}
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => router.push(`/domains/${slug}?assess=1`)}
        >
          <RefreshCcw className="h-3.5 w-3.5" /> Retake assessment
        </Button>
      </div>

      <motion.div {...rise()}>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Your {domain.name} plan
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          {profile.summary}
        </p>
      </motion.div>

      {/* Learner profile */}
      <motion.section
        {...rise(0.05)}
        className="mt-8 rounded-3xl border border-border/70 bg-card/50 p-6 backdrop-blur-sm"
        aria-label="Your learner profile"
      >
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
          <Fact label="Level" value={cap(profile.level)} />
          <Fact label="Goal" value={profile.goal} />
          <Fact label="Daily study" value={`${profile.dailyMinutes} min`} />
          <Fact label="Learning style" value={cap(profile.style)} />
          <Fact label="Pace" value={cap(profile.pace)} />
          <Fact label="Est. completion" value={`~${profile.estimatedWeeks} weeks`} />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <ChipList
            title="Strengths"
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            items={profile.strengths}
            tone="emerald"
          />
          <ChipList
            title="To strengthen"
            icon={<TrendingDown className="h-3.5 w-3.5" />}
            items={profile.weaknesses}
            tone="rose"
          />
        </div>
        {profile.certification && (
          <p className="mt-4 text-xs text-muted-foreground">
            Certification track: <span className="text-cyan-300">{profile.certification}</span>
          </p>
        )}
      </motion.section>

      {/* Adaptive tips */}
      {adaptive.advice && (
        <motion.div
          {...rise(0.08)}
          className={cn(
            "mt-4 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
            adaptive.weakTopics.length > 0
              ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          )}
          role="status"
        >
          {adaptive.weakTopics.length > 0 ? (
            <TrendingDown className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div>
            <span className="font-medium">Adaptive check-in: </span>
            {adaptive.advice}
          </div>
        </motion.div>
      )}

      {/* Phases */}
      <motion.h2 {...rise(0.1)} className="mt-12 font-display text-2xl font-bold tracking-tight">
        Your phases
      </motion.h2>
      <div className="mt-5 space-y-3">
        {plan.phases.map((phase, i) => (
          <PhaseCard
            key={phase.n}
            phase={phase}
            open={openPhase === i}
            onToggle={() => setOpenPhase(openPhase === i ? -1 : i)}
            rise={rise(0.04 * i)}
          />
        ))}
      </div>

      {/* Capstone */}
      <motion.section
        {...rise(0.1)}
        className="relative mt-12 overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-500/[0.12] via-card/50 to-cyan-500/[0.08] p-6 sm:p-8"
        aria-label="Capstone project"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/25 ring-1 ring-violet-400/40">
            <Rocket className="h-5 w-5 text-violet-300" />
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-violet-300">
              Capstone project
            </p>
            <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
              {plan.capstone.title}
            </h2>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {plan.capstone.brief}
        </p>

        <h3 className="mt-6 text-sm font-semibold text-foreground">Step-by-step build</h3>
        <ol className="mt-3 space-y-2.5">
          {plan.capstone.steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/90">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/25 font-mono text-[10px] font-bold text-violet-200">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Deliverables</h3>
            <ul className="mt-2 space-y-1.5">
              {plan.capstone.deliverables.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Show it off</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {plan.capstone.showoff}
            </p>
          </div>
        </div>
      </motion.section>

      {/* Week 1 */}
      {plan.week1.length > 0 && (
        <>
          <motion.h2
            {...rise(0.1)}
            className="mt-12 flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight"
          >
            <Calendar className="h-5 w-5 text-cyan-300" /> Your first week
          </motion.h2>
          <div className="mt-5 space-y-2.5">
            {plan.week1.map((d, i) => (
              <motion.div
                key={d.day}
                {...rise(0.03 * i)}
                className="rounded-2xl border border-border/70 bg-card/50 p-4"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                    Day {d.day}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{d.focus}</span>
                </div>
                <div className="mt-2.5 grid gap-x-6 gap-y-1.5 text-[13px] text-muted-foreground sm:grid-cols-2">
                  <DayItem icon={<Clapperboard className="h-3.5 w-3.5 text-violet-300" />} label="Watch" text={d.watch} />
                  <DayItem icon={<FileText className="h-3.5 w-3.5 text-cyan-300" />} label="Read" text={d.read} />
                  <DayItem icon={<Dumbbell className="h-3.5 w-3.5 text-emerald-300" />} label="Practice" text={d.practice} />
                  <DayItem icon={<Target className="h-3.5 w-3.5 text-amber-300" />} label="Quiz" text={d.quiz} />
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      <div className="mt-12 flex flex-wrap gap-3">
        <Button asChild size="lg" className="rounded-full px-7">
          <Link href={`/domains/${slug}`}>
            Start learning on the trail <BookOpen className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </main>
  );
}

/* ── Pieces ─────────────────────────────────────────────────────────────── */

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ChipList({
  title,
  icon,
  items,
  tone,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  tone: "emerald" | "rose";
}) {
  const chip =
    tone === "emerald"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : "border-rose-500/30 bg-rose-500/10 text-rose-200";
  const head = tone === "emerald" ? "text-emerald-300" : "text-rose-300";
  return (
    <div>
      <p className={cn("flex items-center gap-1.5 text-xs font-medium", head)}>
        {icon} {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((s, i) => (
          <span key={i} className={cn("rounded-full border px-2.5 py-1 text-xs", chip)}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function DayItem({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <p className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>
        <span className="font-medium text-foreground/80">{label}:</span> {text}
      </span>
    </p>
  );
}

const RESOURCE_META = [
  { key: "videos" as const, label: "Videos", icon: Clapperboard, color: "text-violet-300" },
  { key: "docs" as const, label: "Docs", icon: FileText, color: "text-cyan-300" },
  { key: "courses" as const, label: "Courses", icon: BookOpen, color: "text-emerald-300" },
  { key: "practice" as const, label: "Practice", icon: Dumbbell, color: "text-amber-300" },
];

function PhaseCard({
  phase,
  open,
  onToggle,
  rise,
}: {
  phase: PlanPhase;
  open: boolean;
  onToggle: () => void;
  rise: Record<string, unknown>;
}) {
  return (
    <motion.div
      {...rise}
      className={cn(
        "overflow-hidden rounded-2xl border transition-colors",
        open ? "border-cyan-400/40 bg-card/70" : "border-border/70 bg-card/40 hover:border-cyan-400/25"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-4 p-5 text-left"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 font-mono text-sm font-bold text-cyan-300 ring-1 ring-cyan-400/30">
          {String(phase.n).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-semibold text-foreground">
            {phase.title}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {phase.objective}
          </span>
        </span>
        <span className="shrink-0 rounded-full border border-border bg-background/60 px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
          ~{phase.days}d
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="space-y-6 border-t border-border/60 p-5 pt-5">
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{phase.why}</p>

          <div>
            <h4 className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Topics
            </h4>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {phase.topics.map((t, i) => (
                <span
                  key={i}
                  className="rounded-full border border-border bg-background/60 px-2.5 py-1 text-xs text-foreground/90"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {RESOURCE_META.map(({ key, label, icon: Icon, color }) => {
              const list = phase.resources?.[key] ?? [];
              if (list.length === 0) return null;
              return (
                <div key={key}>
                  <h4 className={cn("flex items-center gap-1.5 text-xs font-medium", color)}>
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </h4>
                  <ul className="mt-2 space-y-1.5">
                    {list.map((r, i) => (
                      <li key={i}>
                        <a
                          href={resourceHref(r, key)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[13px] text-foreground/85 underline-offset-4 transition-colors hover:text-cyan-300 hover:underline"
                        >
                          {r.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {phase.exercises?.length > 0 && (
            <div>
              <h4 className="flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                <Dumbbell className="h-3.5 w-3.5" /> Hands-on exercises
              </h4>
              <ul className="mt-2 space-y-1.5">
                {phase.exercises.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/70" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {phase.miniProject && (
            <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.07] p-4">
              <h4 className="flex items-center gap-1.5 text-xs font-medium text-violet-300">
                <Hammer className="h-3.5 w-3.5" /> Mini project — {phase.miniProject.title}
              </h4>
              <p className="mt-1.5 text-[13px] text-muted-foreground">{phase.miniProject.brief}</p>
              <ol className="mt-2.5 space-y-1.5">
                {phase.miniProject.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-foreground/85">
                    <span className="mt-px shrink-0 font-mono text-[11px] font-bold text-violet-300">
                      {i + 1}.
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <p className="flex items-start gap-2 text-[13px] text-amber-200/90">
            <Flag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
            <span>
              <span className="font-medium">Milestone:</span> {phase.milestone}
            </span>
          </p>
        </div>
      )}
    </motion.div>
  );
}
