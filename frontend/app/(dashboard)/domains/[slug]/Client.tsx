"use client";

import { useEffect, useMemo, useState } from "react";
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
import { DomainTile, domainPalette } from "@/components/shared/DomainIcon";
import { WindingRoadmap } from "@/components/roadmap/WindingRoadmap";
import { AssessmentIntro, AssessmentWizard } from "@/components/domains/AssessmentWizard";
import { Mascot } from "@/components/playground/Mascot";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProgressStatus = "not_started" | "in_progress" | "completed";

const PHASE_LABEL: Record<RoadmapTopic["phase"], string> = {
  foundations: "Foundations",
  core: "Core Concepts",
  advanced: "Advanced",
};

const PHASE_DESCRIPTION: Record<RoadmapTopic["phase"], string> = {
  foundations: "Vocabulary and mental models. Start here.",
  core: "The main subject matter. Where most of the work happens.",
  advanced: "Deeper theory and current trends. Polishes everything before.",
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

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    // ?assess=1 (retake from the plan page) forces the wizard even with a plan.
    const forceAssess =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("assess") === "1";

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
        <div className="mt-4 rounded-2xl border-2 border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive-text">
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
  if (hasPlan === null && !skippedAssessment) {
    return (
      <main className="container px-4 py-8">
        <BackToDomains />
        <DomainHeader data={data} />
        <TrailSkeleton />
      </main>
    );
  }
  if (hasPlan === false && !skippedAssessment) {
    return (
      <main className="container px-4 py-8">
        <BackToDomains />
        <DomainHeader data={data} />
        <div className="mt-10 sm:mt-14">
          {assessStage === "intro" ? (
            <AssessmentIntro
              domainName={data.name}
              onStart={startAssessmentChat}
              onSkip={() => setSkippedAssessment(true)}
            />
          ) : questions ? (
            <AssessmentWizard
              slug={data.slug}
              domainName={data.name}
              questions={questions}
              onDone={() => {
                window.location.href = `/domains/${data.slug}/plan`;
              }}
              onSkip={() => setSkippedAssessment(true)}
            />
          ) : (
            <div className="flex items-center justify-center gap-3 py-16 text-base font-bold text-muted-foreground">
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
          <p className="mx-auto mt-2 max-w-md text-base font-semibold text-muted-foreground">
            We don&apos;t have a curated roadmap for this domain yet. Open the AI
            tutor and ask for one — it&apos;ll generate a personalized path on the fly.
          </p>
          <Button asChild variant="grape" size="lg" className="mt-6 uppercase">
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

  return (
    <main className="container px-4 py-8">
      <BackToDomains />
      <DomainHeader data={data} progress={{ completed: completedCount, total, percent }} />

      <div className="mx-auto max-w-3xl">
        {/* Personal plan strip — jump back into the AI-designed plan */}
        {hasPlan && (
          <Link
            href={`/domains/${data.slug}/plan`}
            className="card-chunky card-press focus-ring group mt-6 flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
          >
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 -rotate-6 items-center justify-center rounded-xl bg-grape-bright"
              style={{ boxShadow: "0 4px 0 hsl(var(--grape-shade))" }}
            >
              <Sparkles className="h-5 w-5 text-white" strokeWidth={2.6} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-black text-foreground">Your personalized plan</span>
              <span className="block text-sm font-semibold text-muted-foreground">
                Phases, resources, projects and your capstone build.
              </span>
            </span>
            <ChevronRight
              className="h-5 w-5 shrink-0 text-grape transition-transform group-hover:translate-x-0.5"
              strokeWidth={3}
            />
          </Link>
        )}

        <InterviewUnlockCTA slug={data.slug} completed={completedCount} total={total} />
      </div>

      <div className="mt-12 space-y-14">
        {phases.map((phase, i) => (
          <section key={phase} aria-labelledby={`phase-${phase}`}>
            <PhaseHeader phase={phase} index={i} count={grouped[phase].length} colorStyle={s} />
            {/* room for the current node's floating START bubble */}
            <div className="mt-12">
              <WindingRoadmap topics={grouped[phase]} progressMap={progressByTopic} color={data.color} />
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
      className="focus-ring -ml-2 inline-flex h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-extrabold text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={3} />
      All domains
    </Link>
  );
}

/**
 * The domain's unit banner: a solid slab in the domain's face colour with a
 * 3D bottom edge, like the dashboard's "next up" banner. It carries the
 * same view-transition names as the domains-grid card, so the card morphs
 * straight into it.
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
  const pill = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold text-white";
  return (
    <header
      style={{
        viewTransitionName: `domain-card-${data.slug}`,
        background: p.face,
        boxShadow: `0 6px 0 ${p.shade}`,
      }}
      className="mt-2 flex flex-col gap-5 rounded-[1.5rem] p-6 text-white sm:flex-row sm:items-center sm:gap-6 sm:p-7"
    >
      <DomainTile
        name={data.icon}
        color={data.color}
        tone="white"
        size={72}
        tilt={-6}
        style={{ viewTransitionName: `domain-icon-${data.slug}` }}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={pill} style={{ background: p.shade }}>
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            {data.isCurated ? "Curated roadmap" : "On-demand"}
          </span>
          <span className={cn(pill, "capitalize")} style={{ background: p.shade }}>
            {data.difficulty}
          </span>
          {data.roadmap && (
            <span className={pill} style={{ background: p.shade }}>
              <Clock className="h-3.5 w-3.5" aria-hidden />~{data.roadmap.estimatedDays} days
            </span>
          )}
        </div>
        <MorphTextStyle slugs={[data.slug]} />
        <h1
          style={{ viewTransitionName: `domain-title-${data.slug}` }}
          className="mt-3 w-fit font-display text-3xl leading-tight sm:text-4xl"
        >
          {data.name}
        </h1>
        <p className="mt-2 max-w-2xl text-base font-semibold text-white">{data.description}</p>
      </div>

      {progress && (
        <div className="w-full sm:w-auto sm:min-w-[200px]">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-extrabold">Progress</span>
            <span className="font-display text-xl tabular-nums">
              {progress.completed}/{progress.total}
            </span>
          </div>
          <div
            className="mt-2 h-4 overflow-hidden rounded-full"
            style={{ background: p.shade }}
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${progress.completed} of ${progress.total} topics complete`}
          >
            <div
              className="h-full rounded-full bg-white transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${progress.percent === 0 ? 0 : Math.max(progress.percent, 6)}%` }}
            />
          </div>
          <div className="mt-1.5 text-right text-sm font-extrabold tabular-nums">{progress.percent}% complete</div>
        </div>
      )}
    </header>
  );
}

function HeaderSkeleton() {
  return <div className="mt-2 h-[180px] animate-pulse rounded-[1.5rem] bg-muted motion-reduce:animate-none" aria-hidden />;
}

function TrailSkeleton() {
  const offsets = [0, 70, 100, 70, 0];
  return (
    <div className="mt-12 flex flex-col items-center gap-10" aria-label="Loading the trail" role="status">
      {offsets.map((x, i) => (
        <div
          key={i}
          className="relative h-20 w-20 animate-pulse rounded-full bg-muted motion-reduce:animate-none"
          style={{ left: x, boxShadow: "0 7px 0 hsl(var(--border))" }}
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
        <span aria-hidden className="h-[3px] flex-1 rounded-full bg-border" />
        <h2 id={`phase-${phase}`} className="font-display text-2xl text-foreground sm:text-3xl">
          {PHASE_LABEL[phase]}
        </h2>
        <span aria-hidden className="h-[3px] flex-1 rounded-full bg-border" />
      </div>
      <p className="mt-1.5 text-sm font-semibold text-muted-foreground">{PHASE_DESCRIPTION[phase]}</p>
      <div className="mt-3 flex justify-center gap-1.5">
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-extrabold", colorStyle.iconBg, colorStyle.text)}>
          Section {index + 1}
        </span>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-extrabold tabular-nums text-foreground">
          {count} topics
        </span>
      </div>
    </div>
  );
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
  grape: { face: "bg-grape", shade: "hsl(var(--grape-shade))", text: "text-grape", fill: "bg-grape-bright" },
  primary: { face: "bg-primary", shade: "hsl(var(--primary-shade))", text: "text-primary", fill: "bg-primary-bright" },
} as const;

/**
 * Shared look for both unlockables. Unlocked: a solid role-coloured slab with
 * a white pressable "button". Locked: a plain chunky card with a lock tile and
 * a juicy bar showing how close the learner is.
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
        className={cn(
          "focus-ring group block rounded-[1.5rem] p-6 text-white transition-transform duration-100 active:translate-y-[3px] motion-reduce:transition-none",
          t.face,
          className
        )}
        style={{ boxShadow: `0 6px 0 ${t.shade}` }}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <span
            aria-hidden
            className="flex h-14 w-14 shrink-0 -rotate-6 items-center justify-center rounded-2xl bg-white"
            style={{ boxShadow: "0 5px 0 rgba(0,0,0,0.22)" }}
          >
            <Icon className={cn("h-7 w-7", t.text)} strokeWidth={2.6} />
          </span>
          <div className="min-w-0 flex-1">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold text-white"
              style={{ background: t.shade }}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {pillText}
            </span>
            <h3 className="mt-2 font-display text-2xl leading-tight [text-wrap:balance]">{title}</h3>
            <p className="mt-1.5 max-w-2xl text-sm font-semibold text-white">{body}</p>
          </div>
          <span
            className={cn(
              "inline-flex h-12 shrink-0 items-center justify-center gap-2 self-start rounded-2xl bg-white px-6 text-sm font-black uppercase tracking-wide sm:self-center",
              t.text
            )}
            style={{ boxShadow: `0 4px 0 ${t.shade}` }}
          >
            {cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={3} />
          </span>
        </div>
      </Link>
    );
  }

  return (
    <div className={cn("card-chunky flex items-start gap-4 p-5", className)}>
      <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted">
        <Lock className="h-6 w-6 text-muted-foreground" strokeWidth={2.6} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-black text-foreground">{lockedTitle}</h3>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-extrabold text-muted-foreground">Locked</span>
        </div>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">{lockedBody}</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div className={cn("h-full rounded-full", t.fill)} style={{ width: `${pct === 0 ? 0 : Math.max(pct, 4)}%` }} />
          </div>
          <span className={cn("shrink-0 text-xs font-extrabold", t.text)}>
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
