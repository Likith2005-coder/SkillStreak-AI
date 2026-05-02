import Link from "next/link";
import { Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HealthIndicator } from "@/components/HealthIndicator";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-30 gradient-bg-animated blur-3xl"
        aria-hidden
      />

      <div className="container flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          AI-powered learning, reimagined
        </div>

        <h1 className="animate-fade-in text-5xl font-bold tracking-tight md:text-7xl">
          <span className="gradient-text">SkillStreak</span>
          <span className="text-foreground"> AI</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Master modern technology domains through structured roadmaps, an AI
          tutor that adapts to your level, and gamified daily streaks that keep
          you consistent.
        </p>

        <div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground">
          <Flame className="h-4 w-4 text-orange-400" />
          <span>9 domains</span>
          <span className="opacity-40">·</span>
          <span>AI chatbot tutor</span>
          <span className="opacity-40">·</span>
          <span>Daily streaks</span>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/register">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">I already have an account</Link>
          </Button>
        </div>

        <div className="mt-16">
          <HealthIndicator />
        </div>

        <footer className="mt-20 text-xs text-muted-foreground/60">
          Phase 1 — Auth & User System · v0.2.0
        </footer>
      </div>
    </main>
  );
}
