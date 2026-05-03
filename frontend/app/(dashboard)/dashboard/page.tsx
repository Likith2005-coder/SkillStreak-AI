"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Flame, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/userStore";

const PRIOR_LEVEL_LABEL: Record<string, string> = {
  none: "Brand new",
  some: "Some experience",
  experienced: "Experienced",
};

const GOAL_LABEL: Record<string, string> = {
  interview: "Crack interviews",
  awareness: "Build awareness",
  curiosity: "Pure curiosity",
};

const PACE_LABEL: Record<string, string> = {
  relaxed: "Relaxed",
  standard: "Standard",
  intense: "Intense",
};

export default function DashboardPage() {
  const user = useUserStore((s) => s.user);
  if (!user || !user.profile) return null;

  return (
    <main className="container px-4 py-10">
      <section className="rounded-2xl border border-border bg-card/50 p-8 backdrop-blur">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Phase 3 · AI tutor live
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Welcome, {user.name.split(" ")[0]}.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          9 domains, 5 deep roadmaps, and a streaming AI chatbot. Pick a topic
          to learn — or open the chat anytime for explanations, roadmaps, and
          practice quizzes tailored to your level.
        </p>
        <Button asChild size="lg" className="mt-5">
          <Link href="/domains">
            <BookOpen className="h-4 w-4" />
            Browse domains
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Flame className="h-4 w-4 text-orange-400" />}
          label="Streak"
          value="0 days"
          hint="Coming in Phase 6"
        />
        <StatCard
          icon={<Target className="h-4 w-4 text-primary" />}
          label="Level"
          value={`Lvl ${user.level}`}
          hint={`${user.xp} XP earned`}
        />
        <StatCard
          icon={<Sparkles className="h-4 w-4 text-violet-400" />}
          label="Pace"
          value={PACE_LABEL[user.profile.pace] ?? user.profile.pace}
          hint={`Goal: ${GOAL_LABEL[user.profile.goal] ?? user.profile.goal}`}
        />
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
        <h2 className="text-sm font-medium text-foreground">Your onboarding</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Prior level
            </dt>
            <dd className="mt-1 text-foreground">
              {PRIOR_LEVEL_LABEL[user.profile.priorLevel] ?? user.profile.priorLevel}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Goal</dt>
            <dd className="mt-1 text-foreground">
              {GOAL_LABEL[user.profile.goal] ?? user.profile.goal}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Pace</dt>
            <dd className="mt-1 text-foreground">
              {PACE_LABEL[user.profile.pace] ?? user.profile.pace}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5 backdrop-blur">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
