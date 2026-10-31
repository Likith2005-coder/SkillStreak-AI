"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "next-view-transitions";
import { MorphTextStyle } from "@/components/shared/MorphTextStyle";
import { cachedDomain } from "@/lib/domainCache";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  ChevronRight,
  Clock,
  Compass,
  Loader2,
  Lock,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import {
  apiErrorMessage,
  fetchAssessmentQuestions,
  fetchInterviewStatus,
  fetchPersonalizedPlan,
  fetchRoadmap,
  type AssessmentQuestion,
  type RoadmapTopic,
  type RoadmapView,
  type Domain,
} from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { styleFor } from "@/lib/domain-style";
import { DomainTile, domainPalette, withAlpha } from "@/components/shared/DomainIcon";
import { WindingRoadmap } from "@/components/roadmap/WindingRoadmap";
import { AssessmentIntro, AssessmentWizard } from "@/components/domains/AssessmentWizard";
import { Mascot } from "@/components/playground/Mascot";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProgressStatus = "not_started" | "in_progress" | "completed";

const PHASE_LABEL: Record<RoadmapTopic["phase"], string> = {
  foundations: "Foundations",
  core: "Core Skills",
  advanced: "Advanced",
};

// The trail is one beginner -> advanced path; each phase names its level.
const PHASE_LEVEL: Record<RoadmapTopic["phase"], string> = {
  foundations: "Level 1 · Beginner",
  core: "Level 2 · Intermediate",
  advanced: "Level 3 · Advanced",
};

const PHASE_DESCRIPTION: Record<RoadmapTopic["phase"], string> = {
  foundations: "No experience needed. The ideas and tools everything else builds on.",
  core: "The job-ready skills, in the order you'll use them.",
  advanced: "Specialist depth and the frontier of the field.",
};

export default function RoadmapPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<RoadmapView | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Personalized-onboarding gate: null = still checking, false = no plan yet
  // (show the AI-mentor assessment first), true = plan exists.
  const [hasPlan, setHasPlan] = useState<boolean | null>(null);
  const [skippedAssessment, setSkippedAssessment] = useState(false);
  const [assessStage, setAssessStage] = useState<"intro" | "chat">("intro");
  const [questions, setQuestions] = useState<AssessmentQuestion[] | null>(null);
  // ?assess=1 (retake from the plan page) forces the wizard even with a plan,
  // and overrides the remembered / progress-based skip below.
  const [forceAssess, setForceAssess] = useState(false);

  // An explicit "skip" is remembered per domain. Read after mount so the
  // server render and first client render agree.
  const [rememberedSkip, setRememberedSkip] = useState(false);
  useEffect(() => {
    if (!slug) return;
    let remembered = false;
    try {
      remembered = window.localStorage.getItem(skipKey(slug)) === "1";
    } catch {
      // storage blocked (private mode etc.) — just ask again
    }
    setRememberedSkip(remembered);
  }, [slug]);

  const skipAssessment = () => {
    setSkippedAssessment(true);
    if (!slug) return;
    try {
      window.localStorage.setItem(skipKey(slug), "1");
    } catch {
      // storage blocked — the skip still holds for this visit
    }
  };

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const forceAssess =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("assess") === "1";
    setForceAssess(forceAssess);

    fetchRoadmap(slug)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, "Could not load roadmap"));
      });

    fetchPersonalizedPlan(slug)
      .then((p) => {
        if (cancelled) return;
        setHasPlan(forceAssess ? false : p.exists);
      })
      .catch(() => {
        // Never let the gate block learning — fall through to the trail.
        if (!cancelled) setHasPlan(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const startAssessmentChat = () => {
    setAssessStage("chat");
    if (!questions && slug) {
      fetchAssessmentQuestions(slug)
        .then((q) => setQuestions(q.questions))
        .catch(() => setSkippedAssessment(true));
    }
  };

  const progressByTopic = useMemo(() => {
    const map = new Map<string, ProgressStatus>();
    data?.progress.forEach((p) => map.set(p.topicId, p.status));
    return map;
  }, [data]);

  if (error) {
    return (
      <main className="container px-4 py-8">
        <BackToDomains />
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive-text">
          {error}
        </div>
      </main>
    );
  }

  if (!data) {
    // Came from the domains grid: draw the real header immediately (the card
    // morphs into it) and load the trail underneath.
    const preview = cachedDomain(slug);
    return (
      <main className="container px-4 py-8">
        <BackToDomains />
        {preview ? <DomainHeader data={preview} /> : <HeaderSkeleton />}
        <TrailSkeleton />
      </main>
    );
  }

  const s = styleFor(data.color);

  // ── Personalized-onboarding gate ─────────────────────────────────────
  // First visit to a domain: no roadmap yet — a short AI-mentor chat first,
  // then a personalized plan. The learner can always skip to the trail.
  // Returning learners (any progress here) and remembered skips go straight
  // to the trail — unless the assessment was explicitly requested (?assess=1).
  const hasProgress = data.progress.some((p) => p.status !== "not_started");
  const skipGate = skippedAssessment || (!forceAssess && (rememberedSkip || hasProgress));
  if (hasPlan === null && !skipGate) {
    return (
      <main className="container px-4 py-8">
        <BackToDomains />
        <DomainHeader data={data} />
        <TrailSkeleton />
      </main>
    );
  }
  if (hasPlan === false && !skipGate) {
    return (
      <main className="container px-4 py-8">
        <BackToDomains />
        <DomainHeader data={data} />
        <div className="mt-10 sm:mt-14">
          {assessStage === "intro" ? (
            <AssessmentIntro
              domainName={data.name}
              onStart={startAssessmentChat}
              onSkip={skipAssessment}
            />
          ) : questions ? (
            <AssessmentWizard
              slug={data.slug}
              domainName={data.name}
              questions={questions}
              onDone={() => {
                window.location.href = `/domains/${data.slug}/plan`;
              }}
              onSkip={skipAssessment}
            />
          ) : (
            <div className="flex items-center justify-center gap-3 py-16 text-base font-medium text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-grape motion-reduce:animate-none" /> Preparing your questions…
            </div>
          )}
        </div>
      </main>
    );
  }

  // Non-curated domains: friendly placeholder pointing to the chatbot.
  if (!data.roadmap) {
    return (
      <main className="container px-4 py-8">
        <BackToDomains />
        <DomainHeader data={data} />

        <section className="card-chunky mx-auto mt-10 flex max-w-2xl flex-col items-center p-8 text-center">
          <Mascot size={96} />
          <h2 className="mt-4 font-display text-2xl text-foreground">Roadmap on demand</h2>
          <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-muted-foreground">
            We don&apos;t have a curated roadmap for this domain yet. Open the AI
            tutor and ask for one — it&apos;ll generate a personalized path on the fly.
          </p>
          <Button asChild variant="grape" size="lg" className="mt-6">
            <Link href={`/chatbot?domain=${data.slug}`}>
              <MessageCircle className="h-5 w-5" />
              Ask the AI tutor
            </Link>
          </Button>
        </section>
      </main>
    );
  }

  const completedCount = data.progress.filter((p) => p.status === "completed").length;
  const total = data.roadmap.totalTopics;
  const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  const grouped = groupTopics(data.roadmap.topics);
  const phases = (["foundations", "core", "advanced"] as const).filter((p) => grouped[p].length > 0);
  // One "you are here" for the whole domain: the first unfinished topic in
  // roadmap order. Every phase's trail keys off this, so only one node glows.
  const currentTopicId =
    [...data.roadmap.topics]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .find((t) => progressByTopic.get(t.id) !== "completed")?.id ?? null;

  return (
    <main className="container px-4 py-8">
      <BackToDomains />
      <DomainHeader data={data} progress={{ completed: completedCount, total, percent }} />

      <div className="mx-auto max-w-3xl">
        {/* Personal plan strip — jump back into the AI-designed plan */}
        {hasPlan && (
          <Link
            href={`/domains/${data.slug}/plan`}
            className="card-chunky card-press spotlight focus-ring group mt-6 flex items-center gap-4 px-5 py-4"
            style={{ "--spot": "var(--grape)" } as CSSProperties}
          >
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-grape/10 text-grape ring-1 ring-grape/25 shadow-[0_0_24px_-6px_hsl(var(--grape)/0.6)]"
            >
              <Sparkles className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold text-foreground">Your personalized plan</span>
              <span className="block text-sm text-muted-foreground">
                Phases, resources, projects and your capstone build.
              </span>
            </span>
            <ChevronRight
              className="h-5 w-5 shrink-0 text-grape transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              strokeWidth={2.4}
            />
          </Link>
        )}

        <InterviewUnlockCTA slug={data.slug} completed={completedCount} total={total} />
      </div>

      <div className="mt-14 space-y-20">
        {phases.map((phase, i) => (
          <section key={phase} aria-labelledby={`phase-${phase}`}>
            <PhaseHeader phase={phase} index={i} count={grouped[phase].length} colorStyle={s} />
            {/* room for the current node's floating Start tooltip */}
            <div className="mt-14">
              <WindingRoadmap
                topics={grouped[phase]}
                progressMap={progressByTopic}
                color={data.color}
                currentTopicId={currentTopicId}
              />
            </div>
          </section>
        ))}
      </div>

      {/* The trail's destination: finish every topic and the road opens
          into your personalized career map for this domain. */}
      <div className="mx-auto max-w-3xl">
        <CareerUnlockCTA slug={data.slug} completed={completedCount} total={total} />
      </div>
    </main>
  );
}

function BackToDomains() {
  return (
    <Link
      href="/domains"
      className="focus-ring group -ml-2 inline-flex h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none" strokeWidth={2.2} />
      All domains
    </Link>
  );
}

/**
 * The domain's cinematic banner: a dark panel lit from above by the domain's
 * own aurora, a big display title and a glowing progress meter. It carries
 * the same view-transition names as the domains-grid card, so the card
 * morphs straight into it.
 */
function DomainHeader({
  data,
  progress,
}: {
  // Only fields every domain has, so the header can render from the cached
  // summary before the full roadmap has loaded.
  data: Domain;
  progress?: { completed: number; total: number; percent: number };
}) {
  const p = domainPalette(data.color);
  const pill =
    "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-xs font-medium text-foreground/90";
  return (
    <header
      style={{ viewTransitionName: `domain-card-${data.slug}` }}
      className="card-chunky relative mt-2 overflow-hidden"
    >
      {/* Domain aurora: two pools of the domain colour bleeding in from the top */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-24 -top-40 h-[380px] w-[620px] rounded-full blur-[80px]"
          style={{ background: `radial-gradient(closest-side, ${withAlpha(p.bright, 0.4)}, transparent)` }}
        />
        <div
          className="absolute -top-32 right-[-10%] h-[300px] w-[420px] rounded-full blur-[90px]"
          style={{ background: `radial-gradient(closest-side, ${withAlpha(p.edge, 0.45)}, transparent)` }}
        />
        <div className="grid-faint absolute inset-0 opacity-70" />
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${withAlpha(p.bright, 0.8)}, transparent)` }}
        />
      </div>

      <div className="relative flex flex-col gap-6 p-6 sm:p-9 lg:flex-row lg:items-end lg:gap-10">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-4">
            <DomainTile
              name={data.icon}
              color={data.color}
              tone="white"
              size={60}
              style={{ viewTransitionName: `domain-icon-${data.slug}` }}
            />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={pill}>
                <BookOpen className="h-3.5 w-3.5" aria-hidden style={{ color: p.light }} />
                {data.isCurated ? "Curated roadmap" : "On-demand"}
              </span>
              <span className={cn(pill, "capitalize")}>{data.difficulty}</span>
              {data.roadmap && (
                <span className={cn(pill, "font-mono")}>
                  <Clock className="h-3.5 w-3.5" aria-hidden style={{ color: p.light }} />~{data.roadmap.estimatedDays} days
                </span>
              )}
            </div>
          </div>
          <MorphTextStyle slugs={[data.slug]} />
          <h1
            style={{ viewTransitionName: `domain-title-${data.slug}` }}
            className="mt-6 w-fit font-display text-[clamp(2.4rem,6.5vw,5rem)] leading-[0.95] text-foreground [text-wrap:balance]"
          >
            {data.name}
          </h1>
          <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-muted-foreground">{data.description}</p>
        </div>

        {progress && (
          <div className="w-full shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 lg:w-[260px]">
            <div className="flex items-baseline justify-between gap-3">
              <span className="label-mono text-muted-foreground">Progress</span>
              <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                {progress.completed}
                <span className="text-muted-foreground">/{progress.total}</span>
              </span>
            </div>
            <div className="mt-2 font-display text-5xl tabular-nums leading-none" style={{ color: p.light, textShadow: `0 0 28px ${withAlpha(p.bright, 0.55)}` }}>
              {progress.percent}
              <span className="ml-0.5 text-2xl text-muted-foreground">%</span>
            </div>
            <div
              className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
              role="progressbar"
              aria-valuenow={progress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${progress.completed} of ${progress.total} topics complete`}
            >
              <div
                className="h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none"
                style={{
                  width: `${progress.percent === 0 ? 0 : Math.max(progress.percent, 4)}%`,
                  background: p.bright,
                  boxShadow: `0 0 12px ${withAlpha(p.bright, 0.8)}`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function HeaderSkeleton() {
  return <div className="card-chunky mt-2 h-[260px] animate-pulse motion-reduce:animate-none" aria-hidden />;
}

function TrailSkeleton() {
  const offsets = [0, 70, 100, 70, 0];
  return (
    <div className="mt-14 flex flex-col items-center gap-12" aria-label="Loading the trail" role="status">
      {offsets.map((x, i) => (
        <div
          key={i}
          className="relative h-16 w-16 animate-pulse rounded-full border border-white/10 bg-white/[0.04] motion-reduce:animate-none"
          style={{ left: x }}
        />
      ))}
    </div>
  );
}

function PhaseHeader({
  phase,
  index,
  count,
  colorStyle,
}: {
  phase: RoadmapTopic["phase"];
  index: number;
  count: number;
  colorStyle: ReturnType<typeof styleFor>;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="flex items-center gap-4">
        <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-transparent to-white/15" />
        <span className={cn("whitespace-nowrap rounded-full border px-3 py-0.5 font-mono text-[11px] font-medium", colorStyle.badgeBg)}>
          {PHASE_LEVEL[phase]}
        </span>
        <span aria-hidden className="h-px flex-1 bg-gradient-to-l from-transparent to-white/15" />
      </div>
      <h2 id={`phase-${phase}`} className="mt-4 font-display text-3xl text-foreground sm:text-4xl">
        {PHASE_LABEL[phase]}
      </h2>
      <p className="mt-2 text-[15px] text-muted-foreground">
        {PHASE_DESCRIPTION[phase]}
        <span className="mt-1 block font-mono text-xs tabular-nums text-muted-foreground">{count} topics</span>
      </p>
    </div>
  );
}

function skipKey(slug: string) {
  return `ss-skip-assessment:${slug}`;
}

function groupTopics(topics: RoadmapTopic[]): Record<RoadmapTopic["phase"], RoadmapTopic[]> {
  const out: Record<RoadmapTopic["phase"], RoadmapTopic[]> = {
    foundations: [],
    core: [],
    advanced: [],
  };
  for (const t of topics) out[t.phase].push(t);
  return out;
}

/* ── Unlockables: interview prep and the career map ─────────────────── */

const UNLOCK_TONES = {
  grape: {
    text: "text-grape",
    well: "bg-grape/10 text-grape ring-1 ring-grape/25 shadow-[0_0_28px_-6px_hsl(var(--grape)/0.6)]",
    pill: "border-grape/25 bg-grape/10 text-grape",
    fill: "bg-grape shadow-[0_0_12px_hsl(var(--grape)/0.6)]",
    light: "hsl(var(--grape) / 0.22)",
    variant: "grape",
  },
  primary: {
    text: "text-primary",
    well: "bg-primary/10 text-primary ring-1 ring-primary/25 shadow-[0_0_28px_-6px_hsl(var(--primary)/0.6)]",
    pill: "border-primary/25 bg-primary/10 text-primary",
    fill: "bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.6)]",
    light: "hsl(var(--primary) / 0.16)",
    variant: "default",
  },
} as const;

/**
 * Shared look for both unlockables. Unlocked: a lit panel washed in the role
 * colour with a border beam and a lit button. Locked: a quiet panel with a
 * lock well and a thin glowing bar showing how close the learner is.
 */
function UnlockCard({
  unlocked,
  href,
  tone,
  icon: Icon,
  pillText,
  title,
  body,
  cta,
  lockedTitle,
  lockedBody,
  completed,
  total,
  className,
}: {
  unlocked: boolean;
  href: string;
  tone: keyof typeof UNLOCK_TONES;
  icon: typeof Briefcase;
  pillText: string;
  title: string;
  body: string;
  cta: string;
  lockedTitle: string;
  lockedBody: string;
  completed: number;
  total: number;
  className?: string;
}) {
  const t = UNLOCK_TONES[tone];
  const left = Math.max(0, total - completed);
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  if (unlocked) {
    return (
      <Link
        href={href}
        className={cn("card-chunky card-press border-beam focus-ring group block p-6 sm:p-7", className)}
      >
        <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <span
            className="absolute -left-10 -top-24 h-64 w-[28rem] rounded-full blur-3xl"
            style={{ background: `radial-gradient(closest-side, ${t.light}, transparent)` }}
          />
        </span>
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <span aria-hidden className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-xl", t.well)}>
            <Icon className="h-6 w-6" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", t.pill)}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {pillText}
            </span>
            <h3 className="mt-3 font-display text-2xl leading-tight text-foreground sm:text-[1.75rem] [text-wrap:balance]">{title}</h3>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{body}</p>
          </div>
          <span
            className={cn(
              buttonVariants({ variant: t.variant, size: "lg" }),
              "shrink-0 self-start sm:self-center"
            )}
          >
            {cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" strokeWidth={2.4} />
          </span>
        </div>
      </Link>
    );
  }

  return (
    <div className={cn("card-chunky flex items-start gap-4 p-5", className)}>
      <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
        <Lock className="h-5 w-5 text-muted-foreground" strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">{lockedTitle}</h3>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Locked</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{lockedBody}</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden>
            <div className={cn("h-full rounded-full", t.fill)} style={{ width: `${pct === 0 ? 0 : Math.max(pct, 3)}%` }} />
          </div>
          <span className={cn("shrink-0 font-mono text-xs font-medium tabular-nums", t.text)}>
            {left === 0 ? "Finish your last topic!" : `${left} ${left === 1 ? "topic" : "topics"} to go`}
          </span>
        </div>
      </div>
    </div>
  );
}

function InterviewUnlockCTA({
  slug,
  completed,
  total,
}: {
  slug: string;
  completed: number;
  total: number;
}) {
  const user = useUserStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  // Server-authoritative eligibility: hits /interview/status which respects
  // admin override. Falls back to local progress count if the call fails.
  const [serverEligible, setServerEligible] = useState<boolean | null>(null);
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetchInterviewStatus(slug)
      .then((g) => !cancelled && setServerEligible(g.eligible))
      .catch(() => !cancelled && setServerEligible(null));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const completionUnlocked = total > 0 && completed >= total;
  const unlocked = serverEligible ?? (completionUnlocked || isAdmin);
  const adminView = isAdmin && !completionUnlocked;

  return (
    <UnlockCard
      className="mt-6"
      unlocked={unlocked}
      href={`/domains/${slug}/interview`}
      tone="grape"
      icon={Briefcase}
      pillText={adminView ? "Admin override · Interview prep" : "Unlocked · Interview prep"}
      title={
        adminView
          ? "Admin access — full interview prep available."
          : "You finished the roadmap. Now nail the interview."
      }
      body="15 senior-level questions, 2 system-design scenarios, behavioral STAR templates, common traps, and a 7-day cram plan — calibrated to your level."
      cta="Open prep"
      lockedTitle="Interview prep"
      lockedBody="Complete every topic in this roadmap to unlock a hand-tuned interview prep brief — questions, system design, behavioral, the lot."
      completed={completed}
      total={total}
    />
  );
}

/**
 * The trail's destination, rendered where the winding road ends. Same
 * completion gate as interview prep (server-authoritative via
 * /interview/status, which includes the admin override). Unlocked, it opens
 * the personalized career map: stages, certifications, roles, salaries.
 */
function CareerUnlockCTA({
  slug,
  completed,
  total,
}: {
  slug: string;
  completed: number;
  total: number;
}) {
  const user = useUserStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const [serverEligible, setServerEligible] = useState<boolean | null>(null);
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetchInterviewStatus(slug)
      .then((g) => !cancelled && setServerEligible(g.eligible))
      .catch(() => !cancelled && setServerEligible(null));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const completionUnlocked = total > 0 && completed >= total;
  const unlocked = serverEligible ?? (completionUnlocked || isAdmin);

  return (
    <UnlockCard
      className="mt-14"
      unlocked={unlocked}
      href={`/domains/${slug}/career`}
      tone="primary"
      icon={Compass}
      pillText={isAdmin && !completionUnlocked ? "Admin override · Career path" : "Unlocked · Career path"}
      title="The road ends here. Your career starts now."
      body="Your personalized career map for this domain — stages with timeframes at your pace, real certifications worth taking, role and salary progression, and portfolio projects to build."
      cta="See my career path"
      lockedTitle="Career path"
      lockedBody="Finish the trail above to unlock your career map — stages, certifications, roles and salaries, personalized to your profile."
      completed={completed}
      total={total}
    />
  );
}
