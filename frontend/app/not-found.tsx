import { Link } from "next-view-transitions";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Lost? · SkillStreak AI",
  description: "Page not found",
};

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden bg-background px-4 py-16">
      {/* Aurora light + faint grid behind the numerals */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[38%] h-[34rem] w-[52rem] max-w-[150vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--aurora-2)/0.18),hsl(var(--aurora-1)/0.10)_50%,transparent)] blur-2xl" />
        <div className="grid-faint absolute inset-0" />
      </div>

      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <h1 className="flex items-center gap-[0.12em] font-display text-[clamp(5.5rem,24vw,10rem)] leading-none text-foreground [text-shadow:0_0_60px_hsl(var(--aurora-2)/0.35)]">
          <span aria-hidden>4</span>
          <span
            aria-hidden
            className="relative flex h-[0.78em] w-[0.78em] items-center justify-center rounded-full border border-secondary/50 bg-card text-secondary shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_0_0_0.06em_hsl(var(--secondary)/0.08),0_0_60px_-6px_hsl(var(--secondary)/0.6)]"
          >
            <Compass className="h-1/2 w-1/2" strokeWidth={1.75} />
          </span>
          <span aria-hidden>4</span>
          <span className="sr-only">404: page not found</span>
        </h1>

        <h2 className="mt-8 font-display text-3xl leading-tight text-foreground [text-wrap:balance] sm:text-5xl">
          You wandered off the <span className="font-serif-accent text-primary text-glow">path</span>.
        </h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground [text-wrap:pretty]">
          This trail doesn&apos;t go anywhere. Maybe a topic got renamed, or the link was typed wrong.
          No streak lost.
        </p>

        <div className="mt-9 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/dashboard">Back to my path</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
