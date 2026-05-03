"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Loader2,
  MessageCircle,
} from "lucide-react";

import { apiErrorMessage, fetchRoadmap, type RoadmapTopic, type RoadmapView } from "@/lib/api";
import { styleFor } from "@/lib/domain-style";
import { DomainIcon } from "@/components/shared/DomainIcon";
import { WindingRoadmap } from "@/components/roadmap/WindingRoadmap";
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

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetchRoadmap(slug)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, "Could not load roadmap"));
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

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
