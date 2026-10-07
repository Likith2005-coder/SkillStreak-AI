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
        <div className="rounded-2xl border-2 border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive-text">
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
          className="focus-ring -ml-2 inline-flex h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-extrabold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={3} /> {domain.name}
        </Link>
        <Button variant="outline" size="sm" onClick={() => router.push(`/domains/${slug}?assess=1`)}>
          <RefreshCcw className="h-3.5 w-3.5" strokeWidth={3} /> Retake assessment
        </Button>
      </div>

      <motion.div {...rise(0, true)} className="mt-4 flex items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl text-foreground sm:text-5xl [text-wrap:balance]">
            Your {domain.name} plan
          </h1>
          <p className="mt-3 max-w-2xl text-base font-semibold leading-relaxed text-muted-foreground">
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
          <ChipList title="Strengths" icon={<TrendingUp className="h-4 w-4" strokeWidth={3} />} items={profile.strengths} tone="good" />
          <ChipList title="To strengthen" icon={<Target className="h-4 w-4" strokeWidth={3} />} items={profile.weaknesses} tone="work" />
        </div>
        {profile.certification && (
          <p className="mt-4 text-sm font-semibold text-muted-foreground">
            Certification track: <span className="font-extrabold text-grape">{profile.certification}</span>
          </p>
        )}
      </motion.section>

      {/* Adaptive tips */}
      {adaptive.advice && (
        <motion.div
          {...rise(0.08, true)}
          className={cn(
            "mt-4 flex items-start gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-semibold text-foreground",
            adaptive.weakTopics.length > 0 ? "border-xp-bright/50 bg-xp-bright/10" : "border-primary-bright/40 bg-primary-bright/10"
          )}
          role="status"
        >
          {adaptive.weakTopics.length > 0 ? (
            <TrendingDown className="mt-0.5 h-5 w-5 shrink-0 text-xp" strokeWidth={2.6} />
          ) : (
            <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={2.6} />
          )}
          <div>
            <span className="font-black">Adaptive check-in: </span>
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
      <motion.section {...rise(0.1)} className="card-chunky mt-12 overflow-hidden" aria-label="Capstone project">
        <div className="flex items-center gap-4 bg-grape p-5 text-white sm:p-6">
          <span
            aria-hidden
            className="flex h-12 w-12 shrink-0 -rotate-6 items-center justify-center rounded-2xl bg-white"
            style={{ boxShadow: "0 4px 0 hsl(var(--grape-shade))" }}
          >
            <Rocket className="h-6 w-6 text-grape" strokeWidth={2.6} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold">Capstone project</p>
            <h2 className="font-display text-xl leading-tight sm:text-2xl">{plan.capstone.title}</h2>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <p className="max-w-2xl text-base font-semibold leading-relaxed text-muted-foreground">{plan.capstone.brief}</p>

          <h3 className="mt-6 text-base font-black text-foreground">Step-by-step build</h3>
          <ol className="mt-3 space-y-3">
            {plan.capstone.steps.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm font-semibold leading-relaxed text-foreground">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-grape-bright text-xs font-black text-white">
                  {i + 1}
                </span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}
          </ol>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="text-base font-black text-foreground">Deliverables</h3>
              <ul className="mt-2 space-y-2">
                {plan.capstone.deliverables.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm font-semibold text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.6} />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">Show it off</h3>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-muted-foreground">{plan.capstone.showoff}</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Week 1 */}
      {plan.week1.length > 0 && (
        <>
          <motion.h2 {...rise(0.1)} className="mt-12 flex items-center gap-2.5 font-display text-2xl text-foreground sm:text-3xl">
            <Calendar className="h-6 w-6 text-secondary" strokeWidth={2.6} /> Your first week
          </motion.h2>
          <div className="mt-5 space-y-3">
            {plan.week1.map((d, i) => (
              <motion.div key={d.day} {...rise(0.03 * i)} className="card-chunky p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="rounded-xl bg-secondary px-3 py-1 text-sm font-black text-secondary-foreground"
                    style={{ boxShadow: "0 3px 0 hsl(var(--secondary-shade))" }}
                  >
                    Day {d.day}
                  </span>
                  <span className="text-base font-black text-foreground">{d.focus}</span>
                </div>
                <div className="mt-3 grid gap-x-6 gap-y-2 text-sm font-semibold text-muted-foreground sm:grid-cols-2">
                  <DayItem icon={<Clapperboard className="h-4 w-4 text-rose-600" />} label="Watch" text={d.watch} />
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
        <Button asChild size="lg" className="w-full uppercase sm:w-auto">
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
    <div className="rounded-2xl bg-muted px-4 py-3">
      <p className="text-xs font-extrabold text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-black leading-snug text-foreground">{value}</p>
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
  const chip = tone === "good" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary";
  const head = tone === "good" ? "text-primary" : "text-secondary";
  return (
    <div>
      <p className={cn("flex items-center gap-1.5 text-sm font-black", head)}>
        {icon} {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((s, i) => (
          <span key={i} className={cn("rounded-full px-3 py-1 text-xs font-extrabold", chip)}>
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
        <span className="font-extrabold text-foreground">{label}:</span> {text}
      </span>
    </p>
  );
}

const RESOURCE_META = [
  { key: "videos" as const, label: "Videos", icon: Clapperboard, color: "text-rose-600" },
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
      className={cn("card-chunky overflow-hidden transition-colors", open && "border-secondary-bright")}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="focus-ring flex w-full items-center gap-4 rounded-[1.1rem] p-4 text-left hover:bg-muted/40 sm:p-5"
      >
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-lg text-white",
            open ? "bg-secondary-bright" : "bg-primary-bright"
          )}
          style={{ boxShadow: `0 4px 0 hsl(var(--${open ? "secondary" : "primary"}-shade))` }}
        >
          {phase.n}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-black leading-snug text-foreground sm:text-lg">{phase.title}</span>
          <span className="mt-0.5 line-clamp-2 block text-sm font-semibold text-muted-foreground">{phase.objective}</span>
        </span>
        <span className="hidden shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-extrabold tabular-nums text-foreground sm:inline">
          ~{phase.days} days
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 motion-reduce:transition-none",
            open && "rotate-180"
          )}
          strokeWidth={3}
        />
      </button>

      {open && (
        <div className="space-y-6 border-t-2 border-border p-4 sm:p-5">
          <p className="max-w-2xl text-sm font-semibold leading-relaxed text-muted-foreground">
            <span className="mr-2 rounded-full bg-muted px-2.5 py-0.5 text-xs font-extrabold text-foreground sm:hidden">
              ~{phase.days} days
            </span>
            {phase.why}
          </p>

          <div>
            <h4 className="text-sm font-black text-foreground">Topics</h4>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {phase.topics.map((t, i) => (
                <span key={i} className="rounded-full bg-muted px-3 py-1 text-xs font-extrabold text-foreground">
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
                  <h4 className={cn("flex items-center gap-1.5 text-sm font-black", color)}>
                    <Icon className="h-4 w-4" strokeWidth={2.6} /> {label}
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
              <h4 className="flex items-center gap-1.5 text-sm font-black text-primary">
                <Dumbbell className="h-4 w-4" strokeWidth={2.6} /> Hands-on exercises
              </h4>
              <ul className="mt-2 space-y-2">
                {phase.exercises.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm font-semibold text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-bright" strokeWidth={2.6} />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {phase.miniProject && (
            <div className="rounded-2xl border-2 border-grape-bright/40 bg-grape/5 p-4">
              <h4 className="flex items-center gap-1.5 text-sm font-black text-grape">
                <Hammer className="h-4 w-4" strokeWidth={2.6} /> Mini project — {phase.miniProject.title}
              </h4>
              <p className="mt-1.5 text-sm font-semibold text-muted-foreground">{phase.miniProject.brief}</p>
              <ol className="mt-3 space-y-2">
                {phase.miniProject.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm font-semibold text-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-grape-bright text-[11px] font-black text-white">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <p className="flex items-start gap-2 text-sm font-semibold text-foreground">
            <Flag className="mt-0.5 h-4 w-4 shrink-0 text-xp" strokeWidth={2.6} fill="currentColor" />
            <span>
              <span className="font-black text-xp">Milestone:</span> {phase.milestone}
            </span>
          </p>
        </div>
      )}
    </motion.div>
  );
}
