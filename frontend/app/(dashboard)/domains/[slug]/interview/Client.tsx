"use client";

/**
 * Interview Prep — interactive edition.
 *
 *   Hero with progress bar (X of N reviewed)
 *   Pillars · Pitfalls · Differentiators
 *   Sticky toolbar: filters, shuffle, Practice mode, Reset progress
 *   Questions list with per-card self-review buttons (Got it / Need work)
 *   System Design scenarios
 *   7-day cram plan
 *   Resources
 *
 *   Practice mode (modal) walks one shuffled question at a time, reveals on demand,
 *   marks Got it / Need work, advances. Keyboard: Space reveals, J/K navigate, Esc closes.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "next-view-transitions";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { isAxiosError } from "axios";
import remarkGfm from "remark-gfm";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Bookmark,
  Briefcase,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Code2,
  Compass,
  Eye,
  EyeOff,
  Layers,
  Lightbulb,
  Lock,
  Play,
  RotateCcw,
  Shuffle,
  Sparkles,
  Target,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  apiErrorMessage,
  fetchInterviewPrep,
  type InterviewPrep,
  type InterviewQuestion,
} from "@/lib/api";
import { useLocalStorageMap } from "@/hooks/useLocalStorageMap";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { Mascot } from "@/components/playground/Mascot";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | InterviewQuestion["category"];
type DifficultyFilter = "all" | InterviewQuestion["difficulty"];
type ReviewState = "got-it" | "need-work";

const CATEGORY_LABEL: Record<InterviewQuestion["category"], string> = {
  concept: "Concept",
  "system-design": "System Design",
  behavioral: "Behavioral",
  code: "Code",
  trap: "Trap",
};

const CATEGORY_ICON: Record<InterviewQuestion["category"], React.ReactNode> = {
  concept: <Compass className="h-3.5 w-3.5" />,
  "system-design": <Layers className="h-3.5 w-3.5" />,
  behavioral: <Users className="h-3.5 w-3.5" />,
  code: <Code2 className="h-3.5 w-3.5" />,
  trap: <CircleAlert className="h-3.5 w-3.5" />,
};

const DIFFICULTY_PILL: Record<InterviewQuestion["difficulty"], string> = {
  easy: "bg-primary/10 text-primary",
  medium: "bg-xp/10 text-xp",
  hard: "bg-destructive/10 text-destructive-text",
};

// Light-theme reading styles for the AI's markdown answers. Code blocks stay
// dark (like ShikiCodeBlock) inside a chunky rounded frame.
const PROSE =
  "prose prose-slate prose-sm max-w-none prose-headings:font-black prose-headings:text-foreground prose-p:font-medium prose-p:leading-relaxed prose-p:text-foreground prose-li:font-medium prose-li:text-foreground prose-li:marker:text-primary-bright prose-strong:font-extrabold prose-strong:text-foreground prose-a:font-bold prose-a:text-secondary prose-pre:rounded-2xl prose-pre:border-2 prose-pre:border-b-[5px] prose-pre:border-[#1c2128] prose-pre:bg-[#22272e] prose-pre:text-slate-200 prose-code:rounded-md prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:font-semibold prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-slate-200";

const LABEL = "text-sm font-black text-foreground";

// Stable id for a question — used both as React key and as the localStorage
// review key. Same q + same category should produce the same id.
function qid(q: InterviewQuestion, idx: number): string {
  // Hash via a quick FNV-like fold on the question text; fall back to index
  // so we never lose ordering on identical strings.
  let h = 2166136261;
  for (let i = 0; i < q.q.length; i++) {
    h = (h ^ q.q.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return `q${idx}-${h.toString(36)}`;
}

export default function InterviewPrepPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<InterviewPrep | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [adminOverride, setAdminOverride] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // 403 = roadmap not finished yet: an honest "locked" state, not an error.
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setError(null);
    setLocked(false);
    setData(null);
    fetchInterviewPrep(slug)
      .then((r) => {
        if (cancelled) return;
        setData(r.prep);
        setCached(r.cached);
        setAdminOverride(!!r.gate.adminOverride);
      })
      .catch((err) => {
        if (cancelled) return;
        if (isAxiosError(err) && err.response?.status === 403) setLocked(true);
        else setError(apiErrorMessage(err, "Could not load interview prep"));
      });
    return () => {
      cancelled = true;
    };
  }, [slug, reloadKey]);

  if (locked) {
    return (
      <main className="container px-4 py-8">
        <BackLink slug={slug ?? ""} />
        <div className="card-chunky mx-auto mt-6 flex max-w-xl flex-col items-center p-8 text-center">
          <span
            aria-hidden
            className="flex h-16 w-16 -rotate-6 items-center justify-center rounded-2xl bg-muted"
            style={{ boxShadow: "0 5px 0 hsl(var(--border))" }}
          >
            <Lock className="h-8 w-8 text-muted-foreground" strokeWidth={2.6} />
          </span>
          <h1 className="mt-5 font-display text-2xl text-foreground">Interview prep unlocks at the end of the trail.</h1>
          <p className="mt-2 max-w-sm text-base font-semibold text-muted-foreground">
            Complete every topic in this domain to unlock questions, system design, behavioral templates and a 7-day cram plan.
          </p>
          <Button asChild size="lg" className="mt-6 uppercase">
            <Link href={`/domains/${slug ?? ""}`}>Back to the roadmap</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (error) {
    const isTimeout = /timeout|timed out|15000ms/i.test(error);
    return (
      <main className="container px-4 py-8">
        <BackLink slug={slug ?? ""} />
        <div className="mt-4 rounded-2xl border-2 border-destructive/30 bg-destructive/10 p-5">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive-text" />
            <div className="flex-1">
              <p className="font-extrabold text-destructive-text">
                {isTimeout
                  ? "The AI took longer than expected on the first generation."
                  : "Couldn't load interview prep."}
              </p>
              <p className="mt-1 text-sm font-semibold text-destructive-text">
                {isTimeout
                  ? "Cold-cache generation can spike to 30-60s on a busy day. Try again — most retries return a cached copy in under a second."
                  : error}
              </p>
              <Button variant="outline" className="mt-3" onClick={() => setReloadKey((k) => k + 1)}>
                <RotateCcw className="h-4 w-4" strokeWidth={3} />
                Try again
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="container flex min-h-[60vh] items-center justify-center px-4 py-10" role="status">
        <div className="flex flex-col items-center gap-4 text-center">
          <Mascot message="Composing your interview prep…" size={104} />
          <p className="text-sm font-semibold text-muted-foreground">
            First load takes ~15 seconds. After that it’s instant.
          </p>
        </div>
      </main>
    );
  }

  return <InterviewBody prep={data} cached={cached} adminOverride={adminOverride} slug={slug ?? ""} />;
}

// ──────────────────────────────────────────────────────────────
// Main interactive body
// ──────────────────────────────────────────────────────────────

function InterviewBody({
  prep,
  cached,
  adminOverride,
  slug,
}: {
  prep: InterviewPrep;
  cached: boolean;
  adminOverride: boolean;
  slug: string;
}) {
  // Per-question review state, scoped per domain so progress doesn't leak.
  const [reviews, setReview, clearReviews] = useLocalStorageMap<ReviewState>(
    `interview-review:${slug}`
  );

  // Cached `id` per question so children get stable keys.
  const questionsWithId = useMemo(
    () => prep.questions.map((q, i) => ({ ...q, _id: qid(q, i) })),
    [prep.questions]
  );

  // Shuffle order for the on-page list (independent from Practice mode order).
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const orderedQuestions = useMemo(() => {
    if (shuffleSeed === 0) return questionsWithId;
    const out = [...questionsWithId];
    // deterministic shuffle off seed so re-renders keep the same order until reshuffle
    let s = shuffleSeed;
    for (let i = out.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }, [questionsWithId, shuffleSeed]);

  const reviewed = Object.keys(reviews).length;
  const gotIt = Object.values(reviews).filter((v) => v === "got-it").length;
  const needWork = Object.values(reviews).filter((v) => v === "need-work").length;
  const progressPct = questionsWithId.length === 0 ? 0 : Math.round((reviewed / questionsWithId.length) * 100);

  const [practice, setPractice] = useState(false);

  return (
    <main className="container px-4 py-8">
      <BackLink slug={slug} />
      <Hero
        prep={prep}
        cached={cached}
        adminOverride={adminOverride}
        progress={{ reviewed, total: questionsWithId.length, pct: progressPct, gotIt, needWork }}
        onPractice={() => setPractice(true)}
      />

      {/* Pillars / Pitfalls / Differentiators */}
      <section className="mt-10 grid gap-4 lg:grid-cols-3">
        <Card icon={Target} tone="bg-grape-bright" edge="hsl(var(--grape-shade))" title="Pillars to own">
          <ul className="space-y-3 text-sm">
            {prep.pillars.map((p, i) => (
              <li key={i}>
                <div className="font-black text-foreground">{p.title}</div>
                <p className="mt-0.5 text-sm font-semibold text-muted-foreground">{p.oneLiner}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card icon={CircleAlert} tone="bg-destructive-bright" edge="hsl(var(--destructive-shade))" title="Common pitfalls">
          <ul className="space-y-2.5 text-sm font-semibold text-foreground">
            {prep.pitfalls.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-destructive-bright" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card icon={Award} tone="bg-xp-bright" edge="hsl(var(--xp-shade))" title="Differentiators">
          <ul className="space-y-2.5 text-sm font-semibold text-foreground">
            {prep.differentiators.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-xp-bright" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <QuestionsSection
        questions={orderedQuestions}
        reviews={reviews}
        onReview={(id, state) => setReview(id, state)}
        onShuffle={() => setShuffleSeed((s) => (s === 0 ? Date.now() % 233280 : 0))}
        onPractice={() => setPractice(true)}
        onClearReviews={clearReviews}
        shuffled={shuffleSeed !== 0}
      />

      <section className="mt-12">
        <SectionHeader
          icon={Layers}
          tone="bg-grape-bright"
          edge="hsl(var(--grape-shade))"
          title="System Design Scenarios"
          subtitle="Treat each as a 35-minute round — explore tradeoffs out loud."
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {prep.systemDesign.map((s, i) => (
            <SystemDesignCard key={i} item={s} />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <SectionHeader
          icon={CalendarDays}
          tone="bg-primary-bright"
          edge="hsl(var(--primary-shade))"
          title="7-day cram plan"
          subtitle="If the interview is a week away, run this."
        />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {prep.weekPlan.map((d) => (
            <div key={d.day} className="card-chunky p-4">
              <span
                className="inline-block rounded-lg bg-secondary px-2.5 py-0.5 text-xs font-black text-secondary-foreground"
                style={{ boxShadow: "0 2px 0 hsl(var(--secondary-shade))" }}
              >
                Day {d.day}
              </span>
              <div className="mt-2 text-sm font-black leading-snug text-foreground">{d.focus}</div>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">{d.deliverable}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 mb-16">
        <SectionHeader
          icon={Bookmark}
          tone="bg-secondary-bright"
          edge="hsl(var(--secondary-shade))"
          title="Worth bookmarking"
          subtitle="The classics + the surprises."
        />
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {prep.resources.map((r, i) => (
            <li key={i}>
              <a
                href={r.url ?? "#"}
                target={r.url ? "_blank" : undefined}
                rel="noreferrer"
                className="card-chunky card-press focus-ring flex h-full flex-col items-start p-4 transition-colors hover:bg-muted/40"
              >
                <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-extrabold capitalize text-secondary">
                  {r.type}
                </span>
                <span className="mt-2 text-sm font-bold text-foreground">{r.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <AnimatePresence>
        {practice && (
          <PracticeMode
            questions={questionsWithId}
            reviews={reviews}
            onReview={setReview}
            onClose={() => setPractice(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

// ──────────────────────────────────────────────────────────────
// Hero with progress bar
// ──────────────────────────────────────────────────────────────

function Hero({
  prep,
  cached,
  adminOverride,
  progress,
  onPractice,
}: {
  prep: InterviewPrep;
  cached: boolean;
  adminOverride: boolean;
  progress: { reviewed: number; total: number; pct: number; gotIt: number; needWork: number };
  onPractice: () => void;
}) {
  const reduce = useReducedMotionSafe();
  const shade = "hsl(var(--grape-shade))";
  return (
    <motion.header
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mt-2 rounded-[1.5rem] bg-grape p-6 text-white sm:p-8"
      style={{ boxShadow: `0 6px 0 ${shade}` }}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold text-white"
              style={{ background: shade }}
            >
              <Briefcase className="h-3.5 w-3.5" aria-hidden />
              Interview prep · {prep.domainName}
            </span>
            {adminOverride && (
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-extrabold text-grape">Admin override</span>
            )}
          </div>
          <h1 className="mt-3 font-display text-3xl leading-tight sm:text-4xl md:text-5xl [text-wrap:balance]">
            Walk in like you’ve done this 10 times.
          </h1>
          <p className="mt-3 max-w-2xl text-base font-semibold text-white">
            15 questions, 2 system-design scenarios, behavioral STAR templates, and a
            7-day cram plan — calibrated to your level. Mark each question as you go.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onPractice}
              className="focus-ring inline-flex h-14 items-center gap-2 rounded-2xl bg-white px-7 text-base font-black uppercase tracking-wide text-grape transition-[transform,box-shadow] duration-100 active:translate-y-[5px] active:[box-shadow:none] motion-reduce:transition-none"
              style={{ boxShadow: `0 5px 0 ${shade}` }}
            >
              <Play className="h-5 w-5 fill-current" />
              Start practice
            </button>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold capitalize"
              style={{ background: shade }}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Level: {prep.level}
            </span>
            {cached && (
              <span className="rounded-full px-3 py-1 text-xs font-extrabold" style={{ background: shade }}>
                Saved copy
              </span>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="w-full rounded-2xl bg-white p-4 text-foreground md:w-72" style={{ boxShadow: `0 4px 0 ${shade}` }}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-black">Your progress</span>
            <span className="font-display text-lg tabular-nums text-grape">{progress.pct}%</span>
          </div>
          <div
            className="mt-2 h-4 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={progress.pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${progress.reviewed} of ${progress.total} questions reviewed`}
          >
            <div
              className="relative h-full rounded-full bg-primary-bright transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${progress.pct === 0 ? 0 : Math.max(progress.pct, 6)}%` }}
            >
              <span className="absolute inset-x-2 top-[3px] h-1.5 rounded-full bg-white/35" />
            </div>
          </div>
          <p className="mt-2 text-sm font-bold text-muted-foreground">
            {progress.reviewed} / {progress.total} reviewed
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-extrabold">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary">Got it · {progress.gotIt}</span>
            <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-destructive-text">Need work · {progress.needWork}</span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">
              Untouched · {progress.total - progress.reviewed}
            </span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

// ──────────────────────────────────────────────────────────────
// Questions section with sticky toolbar
// ──────────────────────────────────────────────────────────────

type QWithId = InterviewQuestion & { _id: string };

function QuestionsSection({
  questions,
  reviews,
  onReview,
  onShuffle,
  onPractice,
  onClearReviews,
  shuffled,
}: {
  questions: QWithId[];
  reviews: Record<string, ReviewState>;
  onReview: (id: string, state: ReviewState | undefined) => void;
  onShuffle: () => void;
  onPractice: () => void;
  onClearReviews: () => void;
  shuffled: boolean;
}) {
  const [cat, setCat] = useState<CategoryFilter>("all");
  const [dif, setDif] = useState<DifficultyFilter>("all");
  const [hideReviewed, setHideReviewed] = useState(false);

  const filtered = useMemo(
    () =>
      questions.filter((q) => {
        if (cat !== "all" && q.category !== cat) return false;
        if (dif !== "all" && q.difficulty !== dif) return false;
        if (hideReviewed && reviews[q._id]) return false;
        return true;
      }),
    [questions, cat, dif, hideReviewed, reviews]
  );

  return (
    <section className="mt-12">
      <SectionHeader
        icon={Lightbulb}
        tone="bg-xp-bright"
        edge="hsl(var(--xp-shade))"
        title="Real questions, real answers"
        subtitle={`${questions.length} questions — filter, shuffle, or run a focused practice session.`}
      />

      {/* Sticky from sm up only: on a phone the wrapped chips would eat the screen. */}
      <div className="mt-5 rounded-2xl border-2 border-border bg-background px-3 py-3 sm:sticky sm:top-14 sm:z-20">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={cat === "all"} onClick={() => setCat("all")}>
            All
          </FilterChip>
          {(["concept", "system-design", "behavioral", "code", "trap"] as const).map((c) => (
            <FilterChip key={c} active={cat === c} onClick={() => setCat(c)}>
              {CATEGORY_ICON[c]}
              {CATEGORY_LABEL[c]}
            </FilterChip>
          ))}
          <span aria-hidden className="mx-1 hidden h-6 w-0.5 self-center rounded bg-border sm:block" />
          {(["all", "easy", "medium", "hard"] as const).map((d) => (
            <FilterChip key={d} active={dif === d} onClick={() => setDif(d)}>
              <span className="capitalize">{d === "all" ? "Any level" : d}</span>
            </FilterChip>
          ))}
          <span aria-hidden className="mx-1 hidden h-6 w-0.5 self-center rounded bg-border sm:block" />

          <FilterChip active={hideReviewed} onClick={() => setHideReviewed((v) => !v)}>
            {hideReviewed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            Hide reviewed
          </FilterChip>

          <div className="flex w-full flex-wrap items-center gap-2 lg:ml-auto lg:w-auto">
            <Button variant="outline" size="sm" onClick={onShuffle} title="Shuffle order">
              <Shuffle className="h-3.5 w-3.5" strokeWidth={3} />
              {shuffled ? "Original order" : "Shuffle"}
            </Button>
            <Button size="sm" onClick={onPractice}>
              <Play className="h-3.5 w-3.5 fill-current" />
              Practice
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                if (confirm("Clear all review marks for this domain?")) onClearReviews();
              }}
              title="Clear all review marks"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={3} />
              Reset
            </Button>
          </div>
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {filtered.length === 0 ? (
          <li className="rounded-2xl border-2 border-dashed border-border px-4 py-8 text-center text-sm font-semibold text-muted-foreground">
            Nothing matches those filters.
          </li>
        ) : (
          filtered.map((q) => (
            <QuestionItem
              key={q._id}
              q={q}
              review={reviews[q._id]}
              onReview={(state) =>
                onReview(q._id, reviews[q._id] === state ? undefined : state)
              }
            />
          ))
        )}
      </ul>
    </section>
  );
}

function QuestionPills({ q, review }: { q: InterviewQuestion; review?: ReviewState }) {
  return (
    <>
      <span className={cn("inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-extrabold capitalize", DIFFICULTY_PILL[q.difficulty])}>
        {q.difficulty}
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-extrabold text-muted-foreground">
        {CATEGORY_ICON[q.category]}
        {CATEGORY_LABEL[q.category]}
      </span>
      {review && (
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold text-white",
            review === "got-it" ? "bg-primary" : "bg-destructive"
          )}
        >
          {review === "got-it" ? <Check className="h-3 w-3" strokeWidth={4} /> : <CircleAlert className="h-3 w-3" />}
          {review === "got-it" ? "Got it" : "Need work"}
        </span>
      )}
    </>
  );
}

function AnswerBody({ q }: { q: InterviewQuestion }) {
  return (
    <>
      <div className={LABEL}>What they’re really probing</div>
      <p className="mt-1 text-sm font-semibold text-muted-foreground">{q.whyAsked}</p>

      <div className={cn(LABEL, "mt-5")}>Model answer</div>
      <div className={cn(PROSE, "mt-1")}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.answer}</ReactMarkdown>
      </div>

      {q.starAnswer && (
        <>
          <div className={cn(LABEL, "mt-5")}>STAR template</div>
          <div className={cn(PROSE, "mt-1")}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.starAnswer}</ReactMarkdown>
          </div>
        </>
      )}
    </>
  );
}

/** Got it / Need work: chunky toggles, green and red by fixed meaning. */
function ReviewButtons({
  review,
  onGot,
  onNeed,
  showKeys = false,
}: {
  review?: ReviewState;
  onGot: () => void;
  onNeed: () => void;
  showKeys?: boolean;
}) {
  const base =
    "focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-2xl border-2 border-b-4 px-4 text-sm font-extrabold transition-[transform,border-width] duration-100 active:translate-y-[2px] active:border-b-2 motion-reduce:transition-none";
  const kbd = "ml-1 hidden rounded-md border-2 border-current px-1 text-[10px] opacity-70 sm:inline";
  return (
    <>
      <button
        type="button"
        aria-pressed={review === "got-it"}
        onClick={onGot}
        className={cn(
          base,
          review === "got-it"
            ? "border-primary-shade bg-primary text-primary-foreground"
            : "border-border bg-card text-primary hover:bg-muted"
        )}
      >
        <Check className="h-4 w-4" strokeWidth={3.5} />
        Got it
        {showKeys && <kbd className={kbd}>1</kbd>}
      </button>
      <button
        type="button"
        aria-pressed={review === "need-work"}
        onClick={onNeed}
        className={cn(
          base,
          review === "need-work"
            ? "border-destructive-shade bg-destructive text-destructive-foreground"
            : "border-border bg-card text-destructive-text hover:bg-muted"
        )}
      >
        <CircleAlert className="h-4 w-4" strokeWidth={3} />
        Need work
        {showKeys && <kbd className={kbd}>2</kbd>}
      </button>
    </>
  );
}

function QuestionItem({
  q,
  review,
  onReview,
}: {
  q: QWithId;
  review?: ReviewState;
  onReview: (state: ReviewState) => void;
}) {
  const [open, setOpen] = useState(false);
  const tone =
    review === "got-it"
      ? "border-primary-bright/60"
      : review === "need-work"
        ? "border-destructive-bright/60"
        : "";

  return (
    <li className={cn("card-chunky overflow-hidden", tone)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="focus-ring flex w-full items-start gap-3 rounded-[1.1rem] px-4 py-4 text-left hover:bg-muted/40"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap gap-1.5">
            <QuestionPills q={q} review={review} />
          </span>
          <span className="mt-2 block text-base font-bold leading-snug text-foreground">{q.q}</span>
        </span>
        <ChevronDown
          className={cn(
            "mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none",
            open && "rotate-180"
          )}
          strokeWidth={3}
        />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
          className="border-t-2 border-border px-4 pb-4 pt-4"
        >
          <AnswerBody q={q} />

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t-2 border-border pt-4">
            <span className="mr-1 text-sm font-black text-foreground">How did you do?</span>
            <ReviewButtons review={review} onGot={() => onReview("got-it")} onNeed={() => onReview("need-work")} />
          </div>
        </motion.div>
      )}
    </li>
  );
}

// ──────────────────────────────────────────────────────────────
// Practice mode — full-screen single-question flow
// ──────────────────────────────────────────────────────────────

function PracticeMode({
  questions,
  reviews,
  onReview,
  onClose,
}: {
  questions: QWithId[];
  reviews: Record<string, ReviewState>;
  onReview: (id: string, state: ReviewState | undefined) => void;
  onClose: () => void;
}) {
  // Shuffle for the session only.
  const deck = useMemo(() => {
    const out = [...questions];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }, [questions]);

  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const q = deck[idx];
  const review = q ? reviews[q._id] : undefined;

  const next = useCallback(() => {
    setRevealed(false);
    setIdx((i) => Math.min(deck.length - 1, i + 1));
  }, [deck.length]);

  const prev = useCallback(() => {
    setRevealed(false);
    setIdx((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setRevealed(true);
      } else if (e.key === "j" || e.key === "ArrowRight") next();
      else if (e.key === "k" || e.key === "ArrowLeft") prev();
      else if (e.key === "1" && q) {
        onReview(q._id, reviews[q._id] === "got-it" ? undefined : "got-it");
      } else if (e.key === "2" && q) {
        onReview(q._id, reviews[q._id] === "need-work" ? undefined : "need-work");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose, onReview, q, reviews]);

  if (!q) return null;

  const isLast = idx === deck.length - 1;
  const allReviewed = deck.every((d) => reviews[d._id]);
  const pct = ((idx + 1) / deck.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/60 p-3 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Practice mode"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[1.5rem] border-2 border-b-[6px] border-border bg-card"
      >
        {/* Top bar: close + juicy lesson-style progress */}
        <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
          <button
            onClick={onClose}
            className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close practice"
          >
            <X className="h-6 w-6" strokeWidth={3} />
          </button>
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="relative h-full rounded-full bg-primary-bright transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${pct}%` }}
            >
              <span className="absolute inset-x-2 top-[3px] h-1.5 rounded-full bg-white/35" />
            </div>
          </div>
          <span className="shrink-0 text-sm font-extrabold tabular-nums text-muted-foreground">
            {idx + 1}/{deck.length}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-8">
          <div className="flex flex-wrap items-center gap-1.5">
            <QuestionPills q={q} review={review} />
          </div>

          <h2 className="mt-4 font-display text-2xl leading-snug text-foreground sm:text-3xl">{q.q}</h2>

          {!revealed ? (
            <div className="mt-8 flex flex-col items-center justify-center gap-5 rounded-2xl bg-muted px-4 py-10">
              <Mascot message="Say your answer out loud first. Then check it!" size={84} />
              <Button size="lg" onClick={() => setRevealed(true)} className="uppercase">
                <Eye className="h-5 w-5" />
                Reveal answer
              </Button>
              <p className="hidden text-xs font-bold text-muted-foreground sm:block">
                or press <kbd className="rounded-md border-2 border-border bg-card px-1.5 text-[11px]">Space</kbd>
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-6"
            >
              <AnswerBody q={q} />
            </motion.div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex flex-wrap items-center gap-2 border-t-2 border-border px-4 py-3 sm:px-5">
          <Button variant="outline" size="sm" onClick={prev} disabled={idx === 0} className="h-11">
            <ChevronLeft className="h-4 w-4" strokeWidth={3} />
            Prev
            <kbd className="ml-1 hidden rounded-md border-2 border-border px-1 text-[10px] sm:inline">K</kbd>
          </Button>

          <div className="order-last flex w-full justify-center gap-2 sm:order-none sm:w-auto sm:flex-1">
            <ReviewButtons
              review={review}
              showKeys
              onGot={() => onReview(q._id, review === "got-it" ? undefined : "got-it")}
              onNeed={() => onReview(q._id, review === "need-work" ? undefined : "need-work")}
            />
          </div>

          <div className="ml-auto sm:ml-0">
            {!isLast ? (
              <Button size="sm" onClick={next} className="h-11 uppercase">
                Next
                <ChevronRight className="h-4 w-4" strokeWidth={3} />
                <kbd className="ml-1 hidden rounded-md bg-white/20 px-1 text-[10px] sm:inline">J</kbd>
              </Button>
            ) : (
              <Button size="sm" onClick={onClose} className="h-11 uppercase">
                {allReviewed ? "All reviewed — done" : "Finish"}
                <ArrowRight className="h-4 w-4" strokeWidth={3} />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────
// Small shared bits
// ──────────────────────────────────────────────────────────────

function BackLink({ slug }: { slug: string }) {
  return (
    <Link
      href={`/domains/${slug}`}
      className="focus-ring -ml-2 inline-flex h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-extrabold text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={3} />
      Roadmap
    </Link>
  );
}

function IconTile({ icon: Icon, tone, edge, size = "md" }: { icon: LucideIcon; tone: string; edge: string; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 -rotate-6 items-center justify-center text-white",
        size === "sm" ? "h-9 w-9 rounded-lg" : "h-11 w-11 rounded-xl",
        tone
      )}
      style={{ boxShadow: `0 ${size === "sm" ? 3 : 4}px 0 ${edge}` }}
    >
      <Icon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} strokeWidth={2.6} />
    </span>
  );
}

function Card({
  icon,
  tone,
  edge,
  title,
  children,
}: {
  icon: LucideIcon;
  tone: string;
  edge: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-chunky p-5">
      <div className="flex items-center gap-3">
        <IconTile icon={icon} tone={tone} edge={edge} size="sm" />
        <h2 className="text-lg font-black text-foreground">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SectionHeader({
  icon,
  tone,
  edge,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  tone: string;
  edge: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <IconTile icon={icon} tone={tone} edge={edge} />
      <div>
        <h2 className="font-display text-2xl leading-tight text-foreground">{title}</h2>
        {subtitle && <p className="text-sm font-semibold text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "focus-ring inline-flex h-10 items-center gap-1.5 rounded-xl border-2 border-b-4 px-3 text-xs font-extrabold transition-[transform,border-width,background-color] duration-100 active:translate-y-[2px] active:border-b-2 motion-reduce:transition-none",
        active
          ? "border-secondary-shade bg-secondary text-secondary-foreground"
          : "border-border bg-card text-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

function SystemDesignCard({
  item,
}: {
  item: { scenario: string; solutionOutline: string; followUps: string[] };
}) {
  return (
    <div className="card-chunky p-5">
      <span className="rounded-full bg-grape/10 px-2.5 py-0.5 text-xs font-extrabold text-grape">Scenario</span>
      <h3 className="mt-2 text-lg font-black leading-snug text-foreground">{item.scenario}</h3>

      <div className={cn(LABEL, "mt-5")}>Solution outline</div>
      <div className={cn(PROSE, "mt-1")}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.solutionOutline}</ReactMarkdown>
      </div>

      <div className={cn(LABEL, "mt-5")}>Likely follow-ups</div>
      <ul className="mt-2 space-y-2 text-sm font-semibold text-foreground">
        {item.followUps.map((f, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-grape-bright" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
