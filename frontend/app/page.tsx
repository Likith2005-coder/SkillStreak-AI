import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  ChevronDown,
  Cloud,
  Code2,
  Database,
  Flame,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SplineScene } from "@/components/3d/SplineScene";
import { BurstSection } from "@/components/landing/BurstSection";
import { StatsBanner } from "@/components/landing/StatsBanner";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { Spotlight } from "@/components/landing/Spotlight";
import { ScrollProgress } from "@/components/landing/ScrollProgress";

// Whobee Spline scene — swap via NEXT_PUBLIC_SPLINE_SCENE in frontend/.env.local.
const DEFAULT_SPLINE_SCENE =
  "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";
const SPLINE_SCENE =
  process.env.NEXT_PUBLIC_SPLINE_SCENE ?? DEFAULT_SPLINE_SCENE;

const DOMAIN_TICKER = [
  { icon: ShieldCheck, name: "Cybersecurity", color: "text-rose-400" },
  { icon: Code2, name: "Web Development", color: "text-blue-400" },
  { icon: Brain, name: "Artificial Intelligence", color: "text-violet-400" },
  { icon: TrendingUp, name: "Machine Learning", color: "text-emerald-400" },
  { icon: Database, name: "Data Science", color: "text-cyan-400" },
  { icon: Cloud, name: "Cloud Computing", color: "text-sky-400" },
  { icon: Sparkles, name: "+ 3 more via AI", color: "text-fuchsia-400" },
];

export default function LandingPage() {
  return (
    <main className="relative overflow-x-hidden bg-background">
      <ScrollProgress />
      <SmoothScroll />
      {/* Aurora drifts behind everything */}
      <div className="aurora-bg" aria-hidden />

      {/* ── Section 1 — Hero with prominent 3D robot ─────────── */}
      <section className="relative grid min-h-screen grid-cols-1 items-center gap-8 px-4 pb-12 pt-12 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:px-12 lg:pt-20">
        {/* Text column */}
        <div className="relative z-10 text-center lg:text-left">
          <div className="mb-5 inline-flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold tracking-tight">
              <span className="gradient-text">SkillStreak</span>
              <span className="text-foreground"> AI</span>
            </span>
          </div>

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-powered learning, reimagined
          </div>

          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl xl:text-7xl">
            <span className="block">Master tech</span>
            <span className="block">
              with an{" "}
              <span className="gradient-text animate-gradient">AI tutor</span>
            </span>
            <span className="block">that knows you.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg lg:mx-0">
            9 domains, 5 deep curated roadmaps, a streaming AI chatbot,
            AI-generated quizzes, and gamified daily streaks — all in one
            platform.
          </p>

          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground lg:justify-start">
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

          <div className="mt-10 flex items-center justify-center gap-3 text-sm text-muted-foreground lg:justify-start">
            <ChevronDown className="h-4 w-4 animate-bounce" />
            <span>Scroll to begin</span>
          </div>
        </div>

        {/* Robot column — full Spline scene, no frame */}
        <div className="relative h-[420px] w-full lg:h-[600px]">
          <SplineScene scene={SPLINE_SCENE} className="h-full w-full" />
          {/* Watermark cover */}
          <div
            className="pointer-events-none absolute bottom-3 right-3 h-10 w-44 rounded-lg bg-background"
            aria-hidden
          />
          {/* Bottom fade-into-page */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent"
            aria-hidden
          />
          {/* Drag hint */}
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border bg-card/70 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur-sm">
            ✨ drag to interact
          </div>
        </div>
      </section>

      {/* ── Section 2 — Domains marquee ──────────────────────── */}
      <section className="relative border-y border-border/40 bg-card/20 py-6 backdrop-blur-sm">
        <p className="mb-4 text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Pick from
        </p>
        <DomainMarquee />
      </section>

      {/* ── Section 3 — Stats banner with animated counters ────── */}
      <StatsBanner />

      {/* ── Section 4 — Wordmark pops up, CTA bursts from the "a" ──── */}
      <BurstSection />

      {/* ── Section 5 — How it works (3 steps) ─────────────────── */}
      <HowItWorks />

      {/* ── Section 6 — Features bento ───────────────────────── */}
      <section className="relative px-4 py-24 lg:px-12">
        {/* Subtle dotted grid under the section — pure CSS, very cheap. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.4) 1px, transparent 0)",
            backgroundSize: "28px 28px",
            maskImage:
              "radial-gradient(ellipse 60% 60% at 50% 50%, black 35%, transparent 80%)",
          }}
        />

        <div className="relative mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-primary">
              Everything in one place
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              Built like a learning <span className="gradient-text">superpower</span>.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              Five tightly-integrated systems that work together so you don't
              just consume content — you actually learn it.
            </p>
          </div>

          <Spotlight className="mt-12 grid gap-4 md:grid-cols-3 lg:grid-cols-4 lg:grid-rows-2">
            <BentoCard
              span="md:col-span-2 md:row-span-2"
              icon={<Bot className="h-6 w-6 text-violet-300" />}
              title="Streaming AI tutor"
              copy="Topic-aware, level-aware. Asks intent-classified follow-ups. Persists every conversation. Code blocks render with copy buttons."
              gradient="from-indigo-500/15 via-violet-500/10 to-fuchsia-500/15"
              accent="bg-violet-500/20"
            />
            <BentoCard
              icon={<BookOpen className="h-6 w-6 text-rose-300" />}
              title="Curated roadmaps"
              copy="9 domains. 5 deeply-curated paths visualized as a Duolingo-style winding trail."
              gradient="from-rose-500/15 to-pink-500/10"
              accent="bg-rose-500/20"
            />
            <BentoCard
              icon={<ListChecks className="h-6 w-6 text-emerald-300" />}
              title="AI quizzes"
              copy="5 MCQs per topic, validated by a second LLM pass. Pass 3/5 to mark complete."
              gradient="from-emerald-500/15 to-teal-500/10"
              accent="bg-emerald-500/20"
            />
            <BentoCard
              icon={<Flame className="h-6 w-6 text-orange-300" />}
              title="Streaks + XP + badges"
              copy="Daily streaks with auto-spent freezes. Level math via 100·N·log₂(N+1). 8 unlockable badges."
              gradient="from-orange-500/15 to-amber-500/10"
              accent="bg-orange-500/20"
            />
            <BentoCard
              icon={<TrendingUp className="h-6 w-6 text-cyan-300" />}
              title="Progress analytics"
              copy="GitHub-style 90-day heatmap. Per-domain rings. Weak-areas detection. Score-trend charts."
              gradient="from-cyan-500/15 to-sky-500/10"
              accent="bg-cyan-500/20"
            />
          </Spotlight>
        </div>
      </section>

      {/* ── Section 7 — Closing CTA ──────────────────────────── */}
      <FinalCTA />

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 px-4 py-8 text-center text-xs text-muted-foreground/60 lg:px-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>
              <span className="gradient-text font-semibold">SkillStreak</span>{" "}
              AI · v0.7.0
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/login" className="transition hover:text-foreground">
              Log in
            </Link>
            <Link href="/register" className="transition hover:text-foreground">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Pill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-3 py-1 backdrop-blur-sm">
      {icon}
      {children}
    </li>
  );
}

function BentoCard({
  span = "",
  icon,
  title,
  copy,
  gradient,
  accent,
}: {
  span?: string;
  icon: React.ReactNode;
  title: string;
  copy: string;
  gradient: string;
  accent: string;
}) {
  return (
    <div
      className={`bento-card group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 ${span}`}
    >
      {/* Decorative diagonal gradient — visible always, brighter on hover */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity duration-500 group-hover:opacity-100 ${gradient}`}
      />

      {/* Cursor-following soft spotlight — picks up `--mx` / `--my` from the
          parent <Spotlight> wrapper. Pure CSS, no per-frame React work. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.10), transparent 60%)",
        }}
      />

      <div className="relative">
        <div
          className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-white/5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${accent}`}
        >
          {icon}
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground transition-colors duration-300 group-hover:text-foreground/90">
          {copy}
        </p>
      </div>
    </div>
  );
}

function DomainMarquee() {
  // Duplicate the list so the loop is seamless.
  const items = [...DOMAIN_TICKER, ...DOMAIN_TICKER];
  return (
    <div className="relative overflow-hidden">
      {/* Edge fades */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent"
        aria-hidden
      />

      <div className="flex w-max animate-marquee gap-8 px-8">
        {items.map((d, i) => {
          const Icon = d.icon;
          return (
            <div
              key={i}
              className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm text-muted-foreground"
            >
              <Icon className={`h-4 w-4 ${d.color}`} />
              {d.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}
