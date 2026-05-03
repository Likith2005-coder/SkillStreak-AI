import Link from "next/link";
import { ArrowRight, Bot, Flame, ListChecks, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HealthIndicator } from "@/components/HealthIndicator";
import { SplineScene } from "@/components/3d/SplineScene";

// Default Spline scene — Whobee robot. Swap via NEXT_PUBLIC_SPLINE_SCENE in
// frontend/.env.local; pick yours at app.spline.design → export → code → copy URL.
const DEFAULT_SPLINE_SCENE =
  "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";

const SPLINE_SCENE =
  process.env.NEXT_PUBLIC_SPLINE_SCENE ?? DEFAULT_SPLINE_SCENE;

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Animated aurora behind everything */}
      <div className="aurora-bg" aria-hidden />

      <div className="container mx-auto grid min-h-screen grid-cols-1 items-center gap-8 px-4 py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:py-24">
        {/* Text hero */}
        <div className="relative z-10 text-center lg:text-left">
          <div className="mb-5 flex items-center justify-center gap-2 lg:justify-start">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold tracking-tight">
              <span className="gradient-text">SkillStreak</span>
              <span className="text-foreground"> AI</span>
            </span>
          </div>

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-powered learning, reimagined
          </div>

          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl xl:text-7xl">
            <span className="block">Master tech</span>
            <span className="block">
              with an{" "}
              <span className="gradient-text">AI tutor</span>
            </span>
            <span className="block">that knows you.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg lg:mx-0">
            9 domains, 5 deep curated roadmaps, a streaming AI chatbot, AI-generated
            quizzes, and gamified daily streaks — all in one platform.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Button asChild size="lg">
              <Link href="/register">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">I have an account</Link>
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground lg:justify-start">
            <Pill icon={<Bot className="h-3.5 w-3.5 text-primary" />}>AI chatbot</Pill>
            <Pill icon={<ListChecks className="h-3.5 w-3.5 text-emerald-400" />}>
              MCQ quizzes
            </Pill>
            <Pill icon={<Flame className="h-3.5 w-3.5 text-orange-400" />}>
              Daily streaks
            </Pill>
            <Pill icon={<Trophy className="h-3.5 w-3.5 text-amber-400" />}>
              Leaderboard
            </Pill>
          </ul>

          <div className="mt-10 flex items-center justify-center gap-2 lg:justify-start">
            <HealthIndicator />
          </div>
        </div>

        {/* 3D Spline hero — interactive, drag/hover */}
        <div className="relative h-[420px] w-full lg:h-[600px]">
          <div className="absolute inset-0 rounded-3xl border border-border bg-card/30 backdrop-blur-sm" />
          {/* Scene canvas */}
          <div className="relative h-full w-full overflow-hidden rounded-3xl">
            <SplineScene scene={SPLINE_SCENE} className="h-full w-full" />
            {/* Bottom fade so the scene blends with the page */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent"
              aria-hidden
            />
            {/* Hint chip */}
            <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border bg-card/70 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur">
              ✨ drag to interact
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground/60">
        SkillStreak AI · v0.7.0
      </footer>
    </main>
  );
}

function Pill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-3 py-1 backdrop-blur">
      {icon}
      {children}
    </li>
  );
}
