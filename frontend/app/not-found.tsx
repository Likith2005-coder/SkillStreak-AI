import Link from "next/link";
import { ArrowLeft, Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Lost? · SkillStreak AI",
  description: "Page not found",
};

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="aurora-bg" aria-hidden />

      <div className="relative z-10 mx-auto max-w-xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur">
          <Compass className="h-3.5 w-3.5 text-primary" />
          You wandered off the roadmap
        </div>

        <h1 className="text-[28vw] font-black leading-none tracking-tighter sm:text-[18vw] lg:text-[14vw]">
          <span className="gradient-text animate-gradient">404</span>
        </h1>

        <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
          This page doesn&apos;t exist.
        </h2>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Maybe a topic got renamed, or maybe the link was just typed wrong.
          Either way — back to the path:
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full">
            <Link href="/dashboard">
              <Sparkles className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
