import { Link } from "next-view-transitions";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/playground/Mascot";

export const metadata = {
  title: "Lost? · SkillStreak AI",
  description: "Page not found",
};

export default function NotFound() {
  return (
    <main className="relative flex min-h-[100svh] items-center justify-center bg-background px-4 py-16">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <Mascot size={110} message="Hmm, this trail doesn't go anywhere." className="mb-6" />

        <h1 className="flex items-center gap-3 font-display text-[clamp(5rem,22vw,9rem)] leading-none text-secondary">
          <span aria-hidden>4</span>
          <span
            aria-hidden
            className="flex h-[0.8em] w-[0.8em] -rotate-6 items-center justify-center rounded-[0.22em] bg-energy-bright"
            style={{ boxShadow: "0 0.06em 0 hsl(var(--energy-shade))" }}
          >
            <Compass className="h-1/2 w-1/2 text-white" strokeWidth={2.6} />
          </span>
          <span aria-hidden>4</span>
          <span className="sr-only">404: page not found</span>
        </h1>

        <h2 className="mt-6 font-display text-3xl text-foreground sm:text-4xl">You wandered off the path.</h2>
        <p className="mt-3 max-w-md text-lg font-semibold text-muted-foreground [text-wrap:pretty]">
          Maybe a topic got renamed, or the link was typed wrong. No streak lost. Let&apos;s get you back.
        </p>

        <div className="mt-9 flex w-full max-w-sm flex-col gap-3">
          <Button asChild size="lg" className="w-full uppercase tracking-wider">
            <Link href="/dashboard">Back to my path</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full uppercase tracking-wider text-secondary">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
