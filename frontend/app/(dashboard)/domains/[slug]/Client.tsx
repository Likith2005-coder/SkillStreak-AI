"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
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
} from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { styleFor } from "@/lib/domain-style";
import { DomainIcon } from "@/components/shared/DomainIcon";
import { WindingRoadmap } from "@/components/roadmap/WindingRoadmap";
import { AssessmentIntro, AssessmentWizard } from "@/components/domains/AssessmentWizard";
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
      <main className="container px-4 py-10">
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
        <BackToDomains />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="container px-4 py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </main>
    );
  }

  const s = styleFor(data.color);

  // ── Personalized-onboarding gate ─────────────────────────────────────
  // First visit to a domain: no roadmap yet — a short AI-mentor chat first,
  // then a personalized plan. The learner can always skip to the trail.
  if (hasPlan === null && !skippedAssessment) {
    return (
      <main className="container flex min-h-[60vh] items-center justify-center px-4 py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </main>
    );
  }
  if (hasPlan === false && !skippedAssessment) {
    return (
      <main className="container px-4 py-10">
        <BackToDomains />
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
            <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Preparing your questions…
            </div>
          )}
        </div>
      </main>
    );
  }

  // Non-curated domains: friendly placeholder pointing to the chatbot.
  if (!data.roadmap) {
    return (
      <main className="container px-4 py-10">
        <BackToDomains />
        <DomainHeader data={data} colorStyle={s} />

        <section className="mt-10 rounded-2xl border border-border bg-card/50 p-8 text-center backdrop-blur">
          <MessageCircle className={cn("mx-auto h-10 w-10", s.text)} />
          <h2 className="mt-4 text-lg font-semibold">Roadmap on demand</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            We don&apos;t have a curated roadmap for this domain yet. Open the AI
            tutor and ask for one — it&apos;ll generate a personalized path on the fly.
          </p>
          <Link
            href={`/chatbot?domain=${data.slug}`}
            className={cn(
              "mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90",
              s.gradientFrom,
              s.gradientTo
            )}
          >
            Ask the AI tutor
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    );
  }

  const completedCount = data.progress.filter((p) => p.status === "completed").length;
  const total = data.roadmap.totalTopics;
  const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  const grouped = groupTopics(data.roadmap.topics);

  return (
    <main className="container px-4 py-10">
      <BackToDomains />
      <DomainHeader
        data={data}
        colorStyle={s}
        progress={{ completed: completedCount, total, percent }}
      />

      {/* Personal plan strip — jump back into the AI-designed plan */}
      {hasPlan && (
        <Link
          href={`/domains/${data.slug}/plan`}
          className="mt-6 flex items-center gap-3 rounded-2xl border border-violet-500/25 bg-violet-500/[0.07] px-5 py-3.5 transition-colors hover:border-violet-400/45 hover:bg-violet-500/[0.12]"
        >
          <Sparkles className="h-4 w-4 shrink-0 text-violet-300" />
          <span className="flex-1 text-sm text-foreground/90">
            <span className="font-semibold">Your personalized plan</span>
            <span className="text-muted-foreground">
              {" "}
              — phases, resources, projects and your capstone build.
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-violet-300" />
        </Link>
      )}

      <InterviewUnlockCTA
        slug={data.slug}
        completed={completedCount}
        total={total}
      />

      <div className="mt-10 space-y-12">
        {(["foundations", "core", "advanced"] as const).map((phase) => {
          const topics = grouped[phase];
          if (topics.length === 0) return null;
          return (
            <section key={phase}>
              <PhaseHeader phase={phase} count={topics.length} />
              <div className="mt-8">
                <WindingRoadmap
                  topics={topics}
                  progressMap={progressByTopic}
                  color={data.color}
                />
              </div>
            </section>
          );
        })}
      </div>

      {/* The trail's destination: finish every topic and the road opens
          into your personalized career map for this domain. */}
      <CareerUnlockCTA
        slug={data.slug}
        completed={completedCount}
        total={total}
      />
    </main>
  );
}

function BackToDomains() {
  return (
    <Link
      href="/domains"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      All domains
    </Link>
  );
}

function DomainHeader({
  data,
  colorStyle,
  progress,
}: {
  data: RoadmapView;
  colorStyle: ReturnType<typeof styleFor>;
  progress?: { completed: number; total: number; percent: number };
}) {
  return (
    <header className="mt-4 flex flex-col gap-6 rounded-2xl border border-border bg-card/50 p-6 backdrop-blur sm:flex-row sm:items-center">
      <div
        className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
          colorStyle.iconBg
        )}
      >
        <DomainIcon name={data.icon} className={cn("h-7 w-7", colorStyle.text)} />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5" />
          {data.isCurated ? "Curated roadmap" : "On-demand"}
          <span className="opacity-40">·</span>
          <span className="capitalize">{data.difficulty}</span>
          {data.roadmap && (
            <>
              <span className="opacity-40">·</span>
              <span>~{data.roadmap.estimatedDays} days</span>
            </>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{data.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{data.description}</p>
      </div>

      {progress && (
        <div className="w-full sm:w-auto sm:min-w-[180px]">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="tabular-nums">
              {progress.completed} / {progress.total}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted/40">
            <div
              className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", colorStyle.gradientFrom, colorStyle.gradientTo)}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="mt-1 text-right text-xs text-muted-foreground tabular-nums">
            {progress.percent}%
          </div>
        </div>
      )}
    </header>
  );
}

function PhaseHeader({
  phase,
  count,
}: {
  phase: RoadmapTopic["phase"];
  count: number;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{PHASE_LABEL[phase]}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{PHASE_DESCRIPTION[phase]}</p>
      </div>
      <span className="text-xs uppercase tracking-wider text-muted-foreground tabular-nums">
        {count} topics
      </span>
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
  const left = Math.max(0, total - completed);

  if (unlocked) {
    return (
      <Link
        href={`/domains/${slug}/interview`}
        className="group relative mt-8 block overflow-hidden rounded-2xl border border-fuchsia-400/30 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 shadow-2xl shadow-fuchsia-500/20 transition-all hover:-translate-y-0.5 hover:shadow-fuchsia-500/40"
      >
        {/* shimmer sweep on hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
        />
        {/* gold star pulse */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-amber-300/30 blur-3xl animate-cta-breathe"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/30">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 text-white">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-amber-200">
              <Sparkles className="h-3 w-3" />
              {isAdmin && !completionUnlocked
                ? "Admin override · Interview prep"
                : "Unlocked · Interview prep"}
            </div>
            <h3 className="mt-1 text-xl font-bold tracking-tight">
              {isAdmin && !completionUnlocked
                ? "Admin access — full interview prep available."
                : "You finished the roadmap. Now nail the interview."}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-white/85">
              15 senior-level questions, 2 system-design scenarios, behavioral STAR
              templates, common traps, and a 7-day cram plan — calibrated to your level.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-white px-5 py-2.5 text-sm font-bold text-violet-700 shadow-lg transition-transform group-hover:translate-x-1 sm:self-center">
            Open prep
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-card/30 p-5 backdrop-blur-sm sm:flex-row sm:items-center">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/40">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <Briefcase className="h-3 w-3" />
          Interview prep · Locked
        </div>
        <p className="mt-1 text-sm text-foreground/85">
          Complete every topic in this roadmap to unlock a hand-tuned interview
          prep brief — questions, system design, behavioral, the lot.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {left === 0
            ? "Almost there — finish your last topic to unlock."
            : `${left} ${left === 1 ? "topic" : "topics"} to go.`}
        </p>
      </div>
    </div>
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
  const left = Math.max(0, total - completed);

  if (unlocked) {
    return (
      <Link
        href={`/domains/${slug}/career`}
        className="group relative mt-14 block overflow-hidden rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-600 p-6 shadow-2xl shadow-cyan-500/20 transition-all hover:-translate-y-0.5 hover:shadow-cyan-500/40"
      >
        {/* shimmer sweep on hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-emerald-300/30 blur-3xl animate-cta-breathe"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/30">
            <Compass className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 text-white">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-emerald-100">
              <Sparkles className="h-3 w-3" />
              {isAdmin && !completionUnlocked
                ? "Admin override · Career path"
                : "Unlocked · Career path"}
            </div>
            <h3 className="mt-1 text-xl font-bold tracking-tight">
              The road ends here. Your career starts now.
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-white/85">
              Your personalized career map for this domain — stages with
              timeframes at your pace, real certifications worth taking, role
              and salary progression, and portfolio projects to build.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-white px-5 py-2.5 text-sm font-bold text-teal-700 shadow-lg transition-transform group-hover:translate-x-1 sm:self-center">
            See my career path
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    );
  }

  return (
    <div className="mt-14 flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-card/30 p-5 backdrop-blur-sm sm:flex-row sm:items-center">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/40">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <Compass className="h-3 w-3" />
          Career path · Locked
        </div>
        <p className="mt-1 text-sm text-foreground/85">
          Finish the trail above to unlock your career map — stages,
          certifications, roles and salaries, personalized to your profile.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {left === 0
            ? "Almost there — finish your last topic to unlock."
            : `${left} ${left === 1 ? "topic" : "topics"} to go.`}
        </p>
      </div>
    </div>
  );
}
