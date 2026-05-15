"use client";

/**
 * Interview Prep page for a completed curated domain.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ Hero — congrats + domain name + level chip                   │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │ Pillars (5)         Pitfalls (5)        Differentiators (8)  │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │ Questions (filterable by category + difficulty)              │
 *   │   accordion items — click to expand model answer + why-asked │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │ System Design (2 scenarios) — solution + follow-ups          │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │ 7-day cram plan                                              │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │ Resources (books / talks / repos / blogs / docs)             │
 *   └──────────────────────────────────────────────────────────────┘
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  Bookmark,
  Briefcase,
  CalendarDays,
  ChevronDown,
  CircleAlert,
  Code2,
  Compass,
  Layers,
  Lightbulb,
  Loader2,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import {
  apiErrorMessage,
  fetchInterviewPrep,
  type InterviewPrep,
  type InterviewQuestion,
} from "@/lib/api";

type CategoryFilter = "all" | InterviewQuestion["category"];
type DifficultyFilter = "all" | InterviewQuestion["difficulty"];

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

  return (
    <main className="container px-4 py-10">
      <BackLink slug={slug ?? ""} />
      <Hero prep={data} cached={cached} adminOverride={adminOverride} />

      {/* Pillars · Pitfalls · Differentiators */}
      <section className="mt-10 grid gap-4 lg:grid-cols-3">
        <Card icon={<Target className="h-4 w-4 text-violet-300" />} title="Pillars to own">
          <ul className="space-y-3 text-sm">
            {data.pillars.map((p, i) => (
              <li key={i}>
                <div className="font-semibold text-foreground">{p.title}</div>
                <p className="text-xs text-muted-foreground">{p.oneLiner}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card icon={<CircleAlert className="h-4 w-4 text-rose-300" />} title="Common pitfalls">
          <ul className="space-y-2 text-sm text-foreground/90">
            {data.pitfalls.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-rose-400" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card icon={<Award className="h-4 w-4 text-amber-300" />} title="Differentiators">
          <ul className="space-y-2 text-sm text-foreground/90">
            {data.differentiators.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Questions */}
      <QuestionsSection questions={data.questions} />

      {/* System Design */}
      <section className="mt-12">
        <SectionHeader
          icon={<Layers className="h-5 w-5 text-violet-300" />}
          title="System Design Scenarios"
          subtitle="Treat each as a 35-minute round — explore tradeoffs out loud."
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {data.systemDesign.map((s, i) => (
            <SystemDesignCard key={i} item={s} />
          ))}
        </div>
      </section>

      {/* Week plan */}
      <section className="mt-12">
        <SectionHeader
          icon={<CalendarDays className="h-5 w-5 text-emerald-300" />}
          title="7-day cram plan"
          subtitle="If the interview is a week away, run this."
        />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {data.weekPlan.map((d) => (
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

      {/* Resources */}
      <section className="mt-12 mb-16">
        <SectionHeader
          icon={<Bookmark className="h-5 w-5 text-sky-300" />}
          title="Worth bookmarking"
          subtitle="The classics + the surprises."
        />
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.resources.map((r, i) => (
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
    </main>
  );
}

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

function Hero({
  prep,
  cached,
  adminOverride,
}: {
  prep: InterviewPrep;
  cached: boolean;
  adminOverride?: boolean;
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
        You finished every topic. This is the brief that turns that knowledge into
        an interview-room edge: 15 questions, 2 system-design rounds, behavioral
        STAR templates, and a 7-day cram plan — calibrated to your level.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 ring-1 ring-white/25">
          <Sparkles className="h-3 w-3" />
          Level: {prep.level}
        </span>
        {cached && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
            Cached
          </span>
        )}
      </div>
    </motion.header>
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

function QuestionsSection({ questions }: { questions: InterviewQuestion[] }) {
  const [cat, setCat] = useState<CategoryFilter>("all");
  const [dif, setDif] = useState<DifficultyFilter>("all");

  const filtered = useMemo(
    () =>
      questions.filter(
        (q) =>
          (cat === "all" || q.category === cat) &&
          (dif === "all" || q.difficulty === dif)
      ),
    [questions, cat, dif]
  );

  return (
    <section className="mt-12">
      <SectionHeader
        icon={<Lightbulb className="h-5 w-5 text-amber-300" />}
        title="Real questions, real answers"
        subtitle={`${questions.length} questions — pick a category to focus.`}
      />

      <div className="mt-5 flex flex-wrap gap-2">
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
      </div>

      <ul className="mt-5 space-y-3">
        {filtered.map((q, i) => (
          <QuestionItem key={i} q={q} />
        ))}
      </ul>
    </section>
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

function QuestionItem({ q }: { q: InterviewQuestion }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="overflow-hidden rounded-xl border border-border bg-card/40 backdrop-blur-sm transition hover:border-primary/30">
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
        </motion.div>
      )}
    </li>
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
