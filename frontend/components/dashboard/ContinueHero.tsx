"use client";

/**
 * THE dashboard hero: the next unit to continue, with the learner's real
 * path beside it on wide screens (below it on narrower ones), and three live
 * readouts pinned to the panel floor. The one element on the page that gets
 * the border beam.
 */

import { Link } from "next-view-transitions";
import { ArrowRight, BookOpen, Compass, Gem, ListChecks, Map as MapIcon, Sparkles } from "lucide-react";
import type { ProgressOverview } from "@/lib/api";
import { PathPreview } from "@/components/playground/PathPreview";
import { Button } from "@/components/ui/button";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

export function ContinueHero({ overview }: { overview: ProgressOverview | null }) {
  const totals = overview?.totals;
  const pct =
    totals && totals.topicsAvailable > 0 ? Math.round((totals.topicsCompleted / totals.topicsAvailable) * 100) : 0;
  const rec = overview?.recommended;

  return (
    <section aria-label="Continue learning" className="card-chunky border-beam h-full">
      {/* Light pools, clipped inside the panel (the panel itself can't clip:
          the border beam lives just outside its edge). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <div className="absolute -bottom-32 -left-24 h-80 w-[30rem] rounded-full bg-[radial-gradient(closest-side,hsl(var(--aurora-4)/0.14),transparent)] blur-2xl" />
        <div className="absolute -right-20 -top-28 h-80 w-[28rem] rounded-full bg-[radial-gradient(closest-side,hsl(var(--aurora-1)/0.2),transparent)] blur-2xl" />
        <div className="grid-faint absolute inset-0 opacity-60" />
      </div>

      <div className="relative grid h-full grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col p-6 sm:p-7">
          {rec ? (
            <>
              <p className="label-mono flex items-center gap-2 text-primary">
                <MapIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{rec.domain.name} · Next up</span>
              </p>
              <h2 className="mt-3 font-display text-[2rem] leading-[1.05] text-foreground sm:text-4xl [text-wrap:balance]">
                {rec.topicTitle}
              </h2>
              <p className="mt-3 max-w-[44ch] text-[15px] leading-relaxed text-muted-foreground">
                Read the lesson, ask the tutor anything, then lock it in with a five-question quiz.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="h-[3.25rem] px-8 text-base">
                  <Link href={`/topic/${rec.topicId}`}>
                    Continue <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.5} />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href={`/domains/${rec.domain.slug}`}>View roadmap</Link>
                </Button>
              </div>
              {/* The unit loop: what "Continue" actually involves. */}
              <ol aria-label="This unit" className="mt-6 hidden flex-wrap items-center gap-2 sm:flex">
                {[
                  { icon: BookOpen, label: "Lesson" },
                  { icon: Sparkles, label: "Tutor" },
                  { icon: ListChecks, label: "Quiz" },
                ].map((step) => (
                  <li key={step.label}>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-muted-foreground">
                      <step.icon className="h-3.5 w-3.5 text-foreground/80" aria-hidden />
                      {step.label}
                    </span>
                  </li>
                ))}
                <li>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-xp/25 bg-xp/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-xp">
                    <Gem className="h-3.5 w-3.5" aria-hidden /> +35 XP
                  </span>
                </li>
              </ol>
            </>
          ) : overview ? (
            <>
              <p className="label-mono flex items-center gap-2 text-primary">
                <Compass className="h-3.5 w-3.5" aria-hidden /> Start here
              </p>
              <h2 className="mt-3 font-display text-[2rem] leading-[1.05] text-foreground sm:text-4xl [text-wrap:balance]">
                Pick a domain and start your <span className="font-serif-accent text-primary">first streak</span>.
              </h2>
              <div className="mt-6">
                <Button asChild size="lg" className="h-[3.25rem] px-8 text-base">
                  <Link href="/domains">
                    Browse domains <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.5} />
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <div aria-hidden className="space-y-3">
              <div className="h-3 w-40 animate-pulse rounded bg-white/[0.06] motion-reduce:animate-none" />
              <div className="h-10 w-4/5 animate-pulse rounded-lg bg-white/[0.06] motion-reduce:animate-none" />
              <div className="h-10 w-3/5 animate-pulse rounded-lg bg-white/[0.06] motion-reduce:animate-none" />
              <div className="!mt-6 h-[3.25rem] w-44 animate-pulse rounded-xl bg-white/[0.06] motion-reduce:animate-none" />
            </div>
          )}

          {/* Spacer: pins the stats to the panel floor when the path beside it is taller. */}
          <div aria-hidden className="min-h-7 flex-1" />
          <HeroStats pct={pct} done={totals?.topicsCompleted ?? 0} quizzes={totals?.attempts ?? 0} />
        </div>

        {rec && (
          <div className="flex items-center justify-center border-t border-white/[0.06] px-4 pb-6 pt-4 xl:border-l xl:border-t-0 xl:py-6 xl:pl-0 xl:pr-7">
            <PathPreview slug={rec.domain.slug} currentTopicId={rec.topicId} />
          </div>
        )}
      </div>
    </section>
  );
}

/** Three live readouts that count up when the data lands. */
function HeroStats({ pct, done, quizzes }: { pct: number; done: number; quizzes: number }) {
  const shownPct = useCountUp(pct, 1100);
  const shownDone = useCountUp(done, 1100);
  const shownQuiz = useCountUp(quizzes, 1100);
  const stats = [
    { label: "Complete", value: `${shownPct}%`, lit: true },
    { label: "Topics", value: shownDone.toLocaleString(), lit: false },
    { label: "Quizzes", value: shownQuiz.toLocaleString(), lit: false },
  ];
  return (
    <dl className="grid grid-cols-3 divide-x divide-white/[0.06] border-t border-white/[0.06] pt-5">
      {stats.map((s, i) => (
        <div key={s.label} className={cn("min-w-0", i > 0 && "pl-4 sm:pl-6")}>
          <dt className="label-mono truncate text-muted-foreground">{s.label}</dt>
          <dd
            className={cn(
              "mt-1.5 font-display text-3xl tabular-nums leading-none sm:text-[2.25rem]",
              s.lit ? "text-primary text-glow" : "text-foreground",
            )}
          >
            {s.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
