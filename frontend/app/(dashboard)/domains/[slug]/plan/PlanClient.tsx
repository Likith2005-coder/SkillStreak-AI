"use client";

/**
 * Personalized plan — the output of the AI-mentor assessment. Renders the
 * learner profile, an adaptive-tips banner driven by live quiz scores, the
 * phase-by-phase roadmap (accordion timeline), the capstone build guide,
 * and the week-1 daily schedule.
 */

import { useEffect, useState } from "react";
import { Link } from "next-view-transitions";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
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
import { Mascot } from "@/components/playground/Mascot";
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
      <main className="container max-w-4xl px-4 py-8">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive-text">
          {error}
        </div>
      </main>
    );
  }
  if (!data || !data.exists) {
    return (
      <main className="container flex min-h-[60vh] items-center justify-center px-4 py-16" role="status">
        <Mascot message="Fetching your plan…" size={104} />
      </main>
    );
  }

  const { profile, plan, adaptive, domain } = data;
  // Above the fold animates on mount; further down reveals on scroll.
  const rise = (delay = 0, onMount = false) =>
    reduce
      ? {}
      : onMount
        ? {
            initial: { opacity: 0, y: 18 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.5, delay, ease: EASE },
          }
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
          className="focus-ring -ml-2 inline-flex h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.2} /> {domain.name}
        </Link>
        <Button variant="outline" size="sm" onClick={() => router.push(`/domains/${slug}?assess=1`)}>
          <RefreshCcw className="h-3.5 w-3.5" strokeWidth={2.2} /> Retake assessment
        </Button>
      </div>

      <motion.div {...rise(0, true)} className="mt-4 flex items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-[clamp(2.25rem,5.5vw,4rem)] leading-[0.98] text-foreground [text-wrap:balance]">
            Your {domain.name} <span className="font-serif-accent text-glow text-primary">plan</span>
          </h1>
          <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
            {profile.summary}
          </p>
        </div>
        <Mascot size={96} className="hidden shrink-0 md:flex" />
      </motion.div>

      {/* Learner profile */}
      <motion.section
        {...rise(0.05, true)}
        className="card-chunky mt-8 p-5 sm:p-6"
        aria-label="Your learner profile"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Fact label="Level" value={cap(profile.level)} />
          <Fact label="Goal" value={profile.goal} />
          <Fact label="Daily study" value={`${profile.dailyMinutes} min`} />
          <Fact label="Learning style" value={cap(profile.style)} />
          <Fact label="Pace" value={cap(profile.pace)} />
          <Fact label="Est. completion" value={`~${profile.estimatedWeeks} weeks`} />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <ChipList title="Strengths" icon={<TrendingUp className="h-4 w-4" strokeWidth={2.4} />} items={profile.strengths} tone="good" />
          <ChipList title="To strengthen" icon={<Target className="h-4 w-4" strokeWidth={2.4} />} items={profile.weaknesses} tone="work" />
        </div>
        {profile.certification && (
          <p className="mt-4 text-sm text-muted-foreground">
            Certification track: <span className="font-semibold text-grape">{profile.certification}</span>
          </p>
        )}
      </motion.section>

      {/* Adaptive tips */}
      {adaptive.advice && (
        <motion.div
          {...rise(0.08, true)}
          className={cn(
            "mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm text-foreground",
            adaptive.weakTopics.length > 0 ? "border-xp/30 bg-xp/10" : "border-primary/25 bg-primary/10"
          )}
          role="status"
        >
          {adaptive.weakTopics.length > 0 ? (
            <TrendingDown className="mt-0.5 h-5 w-5 shrink-0 text-xp" strokeWidth={2.2} />
          ) : (
            <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={2.2} />
          )}
          <div>
            <span className="font-semibold">Adaptive check-in: </span>
            {adaptive.advice}
          </div>
        </motion.div>
      )}

      {/* Phases */}
      <motion.h2 {...rise(0.1)} className="mt-12 font-display text-2xl text-foreground sm:text-3xl">
        Your phases
      </motion.h2>
      <div className="mt-5 space-y-4">
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
      <motion.section {...rise(0.1)} className="card-chunky border-beam mt-12" aria-label="Capstone project">
        <div className="relative flex items-center gap-4 overflow-hidden rounded-t-[1.1rem] border-b border-white/[0.06] p-5 sm:p-6">
          <span
            aria-hidden
            className="pointer-events-none absolute -left-10 -top-24 h-56 w-96 rounded-full bg-grape/20 blur-3xl"
          />
          <span
            aria-hidden
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-grape/10 text-grape ring-1 ring-grape/25 shadow-[0_0_28px_-6px_hsl(var(--grape)/0.6)]"
          >
            <Rocket className="h-6 w-6" strokeWidth={2.2} />
          </span>
          <div className="relative min-w-0">
            <p className="label-mono text-grape">Capstone project</p>
            <h2 className="mt-1 font-display text-xl leading-tight text-foreground sm:text-2xl">{plan.capstone.title}</h2>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{plan.capstone.brief}</p>

          <h3 className="mt-6 text-base font-semibold text-foreground">Step-by-step build</h3>
          <ol className="mt-3 space-y-3">
            {plan.capstone.steps.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm font-semibold leading-relaxed text-foreground">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-grape/10 font-mono text-xs font-semibold text-grape ring-1 ring-grape/30">
                  {i + 1}
                </span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}
          </ol>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="text-base font-semibold text-foreground">Deliverables</h3>
              <ul className="mt-2 space-y-2">
                {plan.capstone.deliverables.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.2} />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Show it off</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plan.capstone.showoff}</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Week 1 */}
      {plan.week1.length > 0 && (
        <>
          <motion.h2 {...rise(0.1)} className="mt-12 flex items-center gap-2.5 font-display text-2xl text-foreground sm:text-3xl">
            <Calendar className="h-6 w-6 text-secondary" strokeWidth={2.2} /> Your first week
          </motion.h2>
          <div className="mt-5 space-y-3">
            {plan.week1.map((d, i) => (
              <motion.div key={d.day} {...rise(0.03 * i)} className="card-chunky p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-0.5 font-mono text-xs font-medium text-secondary">
                    Day {d.day}
                  </span>
                  <span className="text-base font-semibold text-foreground">{d.focus}</span>
                </div>
                <div className="mt-3 grid gap-x-6 gap-y-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <DayItem icon={<Clapperboard className="h-4 w-4 text-rose-300" />} label="Watch" text={d.watch} />
                  <DayItem icon={<FileText className="h-4 w-4 text-secondary" />} label="Read" text={d.read} />
                  <DayItem icon={<Dumbbell className="h-4 w-4 text-primary" />} label="Practice" text={d.practice} />
                  <DayItem icon={<Target className="h-4 w-4 text-xp" />} label="Quiz" text={d.quiz} />
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      <div className="mt-12 flex justify-center">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href={`/domains/${slug}`}>
            <BookOpen className="h-5 w-5" /> Start learning on the trail
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
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-3">
      <p className="label-mono text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold leading-snug text-foreground">{value}</p>
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
  tone: "good" | "work";
}) {
  const chip = tone === "good" ? "border-primary/25 bg-primary/10 text-primary" : "border-secondary/25 bg-secondary/10 text-secondary";
  const head = tone === "good" ? "text-primary" : "text-secondary";
  return (
    <div>
      <p className={cn("flex items-center gap-1.5 text-sm font-semibold", head)}>
        {icon} {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((s, i) => (
          <span key={i} className={cn("rounded-full border px-3 py-1 text-xs font-medium", chip)}>
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
        <span className="font-medium text-foreground">{label}:</span> {text}
      </span>
    </p>
  );
}

const RESOURCE_META = [
  { key: "videos" as const, label: "Videos", icon: Clapperboard, color: "text-rose-300" },
  { key: "docs" as const, label: "Docs", icon: FileText, color: "text-secondary" },
  { key: "courses" as const, label: "Courses", icon: BookOpen, color: "text-grape" },
  { key: "practice" as const, label: "Practice", icon: Dumbbell, color: "text-primary" },
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
      className={cn("card-chunky overflow-hidden transition-[border-color,box-shadow]", open && "!border-secondary/40 shadow-[0_0_0_1px_hsl(var(--secondary)/0.15),0_20px_50px_-24px_hsl(var(--secondary)/0.5)]")}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="focus-ring flex w-full items-center gap-4 rounded-[1.1rem] p-4 text-left transition-colors hover:bg-white/[0.03] sm:p-5"
      >
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-mono text-base font-semibold ring-1",
            open
              ? "bg-secondary text-secondary-foreground ring-secondary shadow-[0_0_24px_-4px_hsl(var(--secondary)/0.7)]"
              : "bg-white/[0.04] text-foreground ring-white/10"
          )}
        >
          {phase.n}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold leading-snug text-foreground sm:text-lg">{phase.title}</span>
          <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">{phase.objective}</span>
        </span>
        <span className="hidden shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium tabular-nums text-foreground sm:inline">
          ~{phase.days} days
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 motion-reduce:transition-none",
            open && "rotate-180"
          )}
          strokeWidth={2.2}
        />
      </button>

      {open && (
        <div className="space-y-6 border-t border-white/[0.06] border-border p-4 sm:p-5">
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            <span className="mr-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-medium text-foreground sm:hidden">
              ~{phase.days} days
            </span>
            {phase.why}
          </p>

          <div>
            <h4 className="text-sm font-semibold text-foreground">Topics</h4>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {phase.topics.map((t, i) => (
                <span key={i} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-foreground">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {RESOURCE_META.map(({ key, label, icon: Icon, color }) => {
              const list = phase.resources?.[key] ?? [];
              if (list.length === 0) return null;
              return (
                <div key={key}>
                  <h4 className={cn("flex items-center gap-1.5 text-sm font-semibold", color)}>
                    <Icon className="h-4 w-4" strokeWidth={2.2} /> {label}
                  </h4>
                  <ul className="mt-2 space-y-1.5">
                    {list.map((r, i) => (
                      <li key={i}>
                        <a
                          href={resourceHref(r, key)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="focus-ring rounded text-sm font-bold text-secondary underline-offset-4 hover:underline"
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
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                <Dumbbell className="h-4 w-4" strokeWidth={2.2} /> Hands-on exercises
              </h4>
              <ul className="mt-2 space-y-2">
                {phase.exercises.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.2} />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {phase.miniProject && (
            <div className="rounded-xl border border-grape/25 bg-grape/[0.06] p-4">
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-grape">
                <Hammer className="h-4 w-4" strokeWidth={2.2} /> Mini project — {phase.miniProject.title}
              </h4>
              <p className="mt-1.5 text-sm text-muted-foreground">{phase.miniProject.brief}</p>
              <ol className="mt-3 space-y-2">
                {phase.miniProject.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm font-semibold text-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-grape/15 font-mono text-[11px] font-semibold text-grape">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <p className="flex items-start gap-2 text-sm font-semibold text-foreground">
            <Flag className="mt-0.5 h-4 w-4 shrink-0 text-xp" strokeWidth={2.2} fill="currentColor" />
            <span>
              <span className="font-semibold text-xp">Milestone:</span> {phase.milestone}
            </span>
          </p>
        </div>
      )}
    </motion.div>
  );
}
