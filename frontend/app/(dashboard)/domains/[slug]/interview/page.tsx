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
import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
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
  Loader2,
  Play,
  RotateCcw,
  Shuffle,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";

import {
  apiErrorMessage,
  fetchInterviewPrep,
  type InterviewPrep,
  type InterviewQuestion,
} from "@/lib/api";
import { useLocalStorageMap } from "@/hooks/useLocalStorageMap";

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
  concept: <Compass className="h-3 w-3" />,
  "system-design": <Layers className="h-3 w-3" />,
  behavioral: <Users className="h-3 w-3" />,
  code: <Code2 className="h-3 w-3" />,
  trap: <CircleAlert className="h-3 w-3" />,
};

const DIFFICULTY_RING: Record<InterviewQuestion["difficulty"], string> = {
  easy: "ring-emerald-500/30 text-emerald-300 bg-emerald-500/10",
  medium: "ring-amber-500/30 text-amber-300 bg-amber-500/10",
  hard: "ring-rose-500/30 text-rose-300 bg-rose-500/10",
};

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

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetchInterviewPrep(slug)
      .then((r) => {
        if (cancelled) return;
        setData(r.prep);
        setCached(r.cached);
        setAdminOverride(!!r.gate.adminOverride);
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, "Could not load interview prep"));
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error) {
    return (
      <main className="container px-4 py-10">
        <BackLink slug={slug ?? ""} />
        <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="container flex min-h-[60vh] items-center justify-center px-4 py-10 text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm">Composing your interview prep…</p>
          <p className="text-xs text-muted-foreground">
            First load takes ~15 seconds. After that it's instant.
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
    <main className="container px-4 py-10">
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
        <Card icon={<Target className="h-4 w-4 text-violet-300" />} title="Pillars to own">
          <ul className="space-y-3 text-sm">
            {prep.pillars.map((p, i) => (
              <li key={i}>
                <div className="font-semibold text-foreground">{p.title}</div>
                <p className="text-xs text-muted-foreground">{p.oneLiner}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card icon={<CircleAlert className="h-4 w-4 text-rose-300" />} title="Common pitfalls">
          <ul className="space-y-2 text-sm text-foreground/90">
            {prep.pitfalls.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-rose-400" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card icon={<Award className="h-4 w-4 text-amber-300" />} title="Differentiators">
          <ul className="space-y-2 text-sm text-foreground/90">
            {prep.differentiators.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
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
          icon={<Layers className="h-5 w-5 text-violet-300" />}
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
          icon={<CalendarDays className="h-5 w-5 text-emerald-300" />}
          title="7-day cram plan"
          subtitle="If the interview is a week away, run this."
        />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {prep.weekPlan.map((d) => (
            <div
              key={d.day}
              className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm transition hover:border-primary/40 hover:-translate-y-0.5"
            >
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Day {d.day}
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">{d.focus}</div>
              <p className="mt-1 text-xs text-muted-foreground">{d.deliverable}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 mb-16">
        <SectionHeader
          icon={<Bookmark className="h-5 w-5 text-sky-300" />}
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
                className="flex flex-col rounded-xl border border-border bg-card/40 p-4 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-primary/40"
              >
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {r.type}
                </span>
                <span className="mt-1 text-sm font-medium text-foreground">{r.title}</span>
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
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mt-4 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-8 text-white shadow-2xl shadow-fuchsia-500/20 sm:p-10"
    >
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-amber-200">
        <Briefcase className="h-3.5 w-3.5" />
        Interview prep · {prep.domainName}
        {adminOverride && (
          <span className="ml-2 rounded-full border border-amber-300/40 bg-amber-300/10 px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal text-amber-100">
            Admin override
          </span>
        )}
      </div>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
        Walk in like you've done this 10 times.
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-white/85 sm:text-base">
        15 questions, 2 system-design scenarios, behavioral STAR templates, and a
        7-day cram plan — calibrated to your level. Mark each question as you go.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onPractice}
          className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-violet-700 shadow-lg transition hover:scale-[1.03] hover:shadow-xl"
        >
          <Play className="h-4 w-4 fill-violet-700" />
          Start practice
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs ring-1 ring-white/25">
          <Sparkles className="h-3 w-3" />
          Level: {prep.level}
        </span>
        {cached && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs ring-1 ring-white/15">
            Cached
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-6 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
        <div className="flex items-baseline justify-between gap-3 text-xs">
          <span className="font-semibold uppercase tracking-wider text-white/90">
            Your progress
          </span>
          <span className="tabular-nums text-white/90">
            {progress.reviewed} / {progress.total} reviewed · {progress.pct}%
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-amber-300 to-rose-300 transition-[width] duration-500"
            style={{ width: `${progress.pct}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/85">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Got it · {progress.gotIt}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-300" />
            Need work · {progress.needWork}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            Untouched · {progress.total - progress.reviewed}
          </span>
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
        icon={<Lightbulb className="h-5 w-5 text-amber-300" />}
        title="Real questions, real answers"
        subtitle={`${questions.length} questions — filter, shuffle, or run a focused practice session.`}
      />

      <div className="mt-5 sticky top-14 z-20 -mx-4 rounded-xl border border-border bg-background/85 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:mx-0">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={cat === "all"} onClick={() => setCat("all")}>
            All
          </FilterChip>
          {(["concept", "system-design", "behavioral", "code", "trap"] as const).map((c) => (
            <FilterChip key={c} active={cat === c} onClick={() => setCat(c)}>
              <span className="inline-flex items-center gap-1.5">
                {CATEGORY_ICON[c]}
                {CATEGORY_LABEL[c]}
              </span>
            </FilterChip>
          ))}
          <span className="mx-1 h-6 w-px self-center bg-border" />
          {(["all", "easy", "medium", "hard"] as const).map((d) => (
            <FilterChip key={d} active={dif === d} onClick={() => setDif(d)}>
              <span className="capitalize">{d}</span>
            </FilterChip>
          ))}
          <span className="mx-1 h-6 w-px self-center bg-border" />

          <FilterChip active={hideReviewed} onClick={() => setHideReviewed((v) => !v)}>
            <span className="inline-flex items-center gap-1.5">
              {hideReviewed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              Hide reviewed
            </span>
          </FilterChip>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={onShuffle}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-3 py-1 text-xs text-muted-foreground transition hover:text-foreground"
              title="Shuffle order"
            >
              <Shuffle className="h-3 w-3" />
              {shuffled ? "Original order" : "Shuffle"}
            </button>
            <button
              type="button"
              onClick={onPractice}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <Play className="h-3 w-3 fill-current" />
              Practice
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("Clear all review marks for this domain?")) onClearReviews();
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-3 py-1 text-xs text-muted-foreground transition hover:text-foreground"
              title="Clear all review marks"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {filtered.length === 0 ? (
          <li className="rounded-xl border border-dashed border-border bg-card/30 px-4 py-8 text-center text-sm text-muted-foreground">
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
      ? "border-emerald-500/40 bg-emerald-500/[0.04]"
      : review === "need-work"
        ? "border-rose-500/40 bg-rose-500/[0.04]"
        : "border-border bg-card/40";

  return (
    <li
      className={`overflow-hidden rounded-xl border backdrop-blur-sm transition hover:border-primary/30 ${tone}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ring-1 ${DIFFICULTY_RING[q.difficulty]}`}
        >
          {q.difficulty}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          {CATEGORY_ICON[q.category]}
          {CATEGORY_LABEL[q.category]}
        </span>
        <span className="flex-1 text-sm font-medium text-foreground">{q.q}</span>
        {review && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
              review === "got-it"
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-rose-500/15 text-rose-300"
            }`}
          >
            {review === "got-it" ? "Got it" : "Need work"}
          </span>
        )}
        <ChevronDown
          className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
          className="border-t border-border/60 px-4 pb-4 pt-3"
        >
          <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            What they're really probing
          </div>
          <p className="text-sm text-muted-foreground">{q.whyAsked}</p>

          <div className="mt-4 mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            Model answer
          </div>
          <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-muted/40 prose-code:bg-muted/60 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.answer}</ReactMarkdown>
          </div>

          {q.starAnswer && (
            <>
              <div className="mt-4 mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                STAR template
              </div>
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.starAnswer}</ReactMarkdown>
              </div>
            </>
          )}

          <div className="mt-5 flex flex-wrap gap-2 border-t border-border/60 pt-4">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground self-center">
              How did you do?
            </span>
            <button
              type="button"
              onClick={() => onReview("got-it")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                review === "got-it"
                  ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                  : "border border-border bg-card/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Check className="h-3 w-3" />
              Got it
            </button>
            <button
              type="button"
              onClick={() => onReview("need-work")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                review === "need-work"
                  ? "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40"
                  : "border border-border bg-card/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <CircleAlert className="h-3 w-3" />
              Need work
            </button>
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="flex h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        {/* Top bar */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Play className="h-3 w-3 fill-current" />
            Practice
          </span>
          <span className="text-xs text-muted-foreground">
            {idx + 1} of {deck.length}
          </span>
          <div className="ml-2 h-1 flex-1 overflow-hidden rounded-full bg-muted/40">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-[width]"
              style={{ width: `${((idx + 1) / deck.length) * 100}%` }}
            />
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close practice"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ring-1 ${DIFFICULTY_RING[q.difficulty]}`}
            >
              {q.difficulty}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {CATEGORY_ICON[q.category]}
              {CATEGORY_LABEL[q.category]}
            </span>
            {review && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                  review === "got-it"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-rose-500/15 text-rose-300"
                }`}
              >
                {review === "got-it" ? "Got it" : "Need work"}
              </span>
            )}
          </div>

          <h2 className="mt-4 text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
            {q.q}
          </h2>

          {!revealed ? (
            <div className="mt-8 flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/10 py-12">
              <p className="max-w-md text-center text-sm text-muted-foreground">
                Try answering this out loud first. Then reveal the model answer
                to check yourself.
              </p>
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg transition hover:scale-[1.03]"
              >
                <Eye className="h-4 w-4" />
                Reveal answer
              </button>
              <p className="text-[11px] text-muted-foreground">
                or press <kbd className="rounded border border-border bg-muted/40 px-1 text-[10px]">Space</kbd>
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-6"
            >
              <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                What they're really probing
              </div>
              <p className="text-sm text-muted-foreground">{q.whyAsked}</p>

              <div className="mt-4 mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                Model answer
              </div>
              <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-muted/40 prose-code:bg-muted/60 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.answer}</ReactMarkdown>
              </div>

              {q.starAnswer && (
                <>
                  <div className="mt-4 mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                    STAR template
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.starAnswer}</ReactMarkdown>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center gap-2 border-t border-border bg-background/50 px-5 py-3">
          <button
            type="button"
            onClick={prev}
            disabled={idx === 0}
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
            <kbd className="ml-1 hidden rounded border border-border bg-muted/40 px-1 text-[10px] sm:inline">K</kbd>
          </button>

          <div className="flex flex-1 justify-center gap-2">
            <button
              type="button"
              onClick={() => onReview(q._id, review === "got-it" ? undefined : "got-it")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                review === "got-it"
                  ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Check className="h-3.5 w-3.5" />
              Got it
              <kbd className="ml-1 hidden rounded border border-border bg-muted/40 px-1 text-[10px] sm:inline">1</kbd>
            </button>
            <button
              type="button"
              onClick={() =>
                onReview(q._id, review === "need-work" ? undefined : "need-work")
              }
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                review === "need-work"
                  ? "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <CircleAlert className="h-3.5 w-3.5" />
              Need work
              <kbd className="ml-1 hidden rounded border border-border bg-muted/40 px-1 text-[10px] sm:inline">2</kbd>
            </button>
          </div>

          {!isLast ? (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Next
              <ChevronRight className="h-4 w-4" />
              <kbd className="ml-1 hidden rounded bg-primary-foreground/15 px-1 text-[10px] sm:inline">J</kbd>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-500/90"
            >
              {allReviewed ? "All reviewed — done" : "Finish"}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
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
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Roadmap
    </Link>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
        {icon}
        {title}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-card/60 ring-1 ring-border">
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
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
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition ${
        active
          ? "border-primary/50 bg-primary/15 text-foreground"
          : "border-border bg-card/40 text-muted-foreground hover:text-foreground"
      }`}
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
    <div className="rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-sm">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        Scenario
      </div>
      <h3 className="mt-1 text-base font-semibold tracking-tight">{item.scenario}</h3>

      <div className="mt-4 text-[11px] uppercase tracking-wider text-muted-foreground">
        Solution outline
      </div>
      <div className="mt-1 prose prose-invert prose-sm max-w-none prose-p:leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.solutionOutline}</ReactMarkdown>
      </div>

      <div className="mt-4 text-[11px] uppercase tracking-wider text-muted-foreground">
        Likely follow-ups
      </div>
      <ul className="mt-1 space-y-1.5 text-sm text-foreground/90">
        {item.followUps.map((f, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
