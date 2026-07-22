import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  Cloud,
  Code2,
  Database,
  Flame,
  ListChecks,
  ShieldCheck,
  Sparkles as SparklesIcon,
  Terminal,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SplineScene } from "@/components/3d/SplineScene";
import { BurstSection } from "@/components/landing/BurstSection";
import { StatsBanner } from "@/components/landing/StatsBanner";
import { ScrollStory } from "@/components/landing/ScrollStory";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { Spotlight } from "@/components/landing/Spotlight";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { CursorFollower } from "@/components/landing/CursorFollower";
import { Sparkles } from "@/components/landing/Sparkles";
import { Reveal } from "@/components/landing/Reveal";
import { TiltCard } from "@/components/landing/TiltCard";
import { HeroContent } from "@/components/landing/HeroContent";
import { TutorPreview } from "@/components/landing/TutorPreview";

// Marketing landing page: identical for every (logged-out) visitor and changes
// infrequently. Serve the pre-rendered HTML from cache and regenerate at most
// hourly (and on every redeploy / on-demand revalidate) rather than rendering
// per request. All interactive/animated regions are client components that
// hydrate on top of this static shell.
export const revalidate = 3600;

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
  { icon: SparklesIcon, name: "+ 3 more via AI", color: "text-violet-400" },
];

export default function LandingPage() {
  return (
    <main className="relative overflow-x-clip bg-background">
      <ScrollProgress />
      <SmoothScroll />
      <CursorFollower />
      {/* Aurora drifts behind everything */}
      <div className="aurora-bg" aria-hidden />
      {/* Cinematic film grain over the whole page */}
      <div className="noise-overlay" aria-hidden />

      {/* ── Section 1 — Hero with prominent 3D robot ─────────── */}
      <section className="relative grid min-h-screen grid-cols-1 items-center gap-8 px-4 pb-12 pt-12 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:px-12 lg:pt-20">
        {/* Signature: neon knowledge-grid horizon receding behind the hero */}
        <div className="grid-scene" aria-hidden>
          <div className="grid-floor" />
        </div>

        {/* Giant kinetic ghost word — the studio "WORK" motif */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-50"
        >
          <span className="ghost-word text-[24vw] leading-none">MASTERY</span>
        </div>

        {/* Studio chrome — vertical side-rail label (far left edge, clears the hero text) */}
        <div className="pointer-events-none absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
          <div
            className="glitch font-mono text-[10px] uppercase tracking-[0.4em] text-primary/50 [writing-mode:vertical-rl]"
            data-text="SKILLSTREAK · STUDIO // SYSTEM ONLINE"
          >
            SKILLSTREAK · STUDIO // SYSTEM ONLINE
          </div>
        </div>

        {/* Studio chrome — rotating control dial (top-right corner) */}
        <div className="pointer-events-none absolute right-6 top-6 z-10 hidden lg:block lg:right-10">
          <ControlDial />
        </div>

        <Sparkles count={14} />
        {/* Text column — animated hero */}
        <HeroContent />

        {/* Robot column — full Spline scene, no frame */}
        <div className="relative z-10 h-[420px] w-full lg:h-[600px]">
          {/* soft cyan core glow so the robot reads as lit from within */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_44%,hsl(187_92%_52%/0.16),transparent_58%)]"
          />
          {/* Spline scene with its edges feathered so the 3D podium melts into
              the page instead of ending on a hard rectangle. The mask is purely
              visual — the robot and its drag interaction are untouched. It also
              fades out the Spline watermark corner, so no cover rect is needed. */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              // Radial feather softens the canvas edges into the page. The real
              // pedestal-removal is done by the inner scale below (cropping the
              // plate off the bottom), so this mask only needs to dissolve the
              // outer rectangle. Visual only — drag interaction intact.
              WebkitMaskImage:
                "radial-gradient(48% 58% at 50% 30%, #000 60%, transparent 82%)",
              maskImage:
                "radial-gradient(48% 58% at 50% 30%, #000 60%, transparent 82%)",
            }}
          >
            {/* Scale the scene up from its TOP edge: the robot grows to fill the
                column (no more floating-small-in-empty-space) and the flat
                pedestal plate is pushed off the bottom of the frame, where
                overflow-hidden + the bottom fade erase it. The head stays in
                view. */}
            <div className="absolute inset-0 origin-top scale-[1.5]">
              <SplineScene scene={SPLINE_SCENE} className="h-full w-full" />
            </div>
          </div>
          {/* Bottom fade — soft feather that catches whatever sliver of the
              plate survives the crop and sinks it into the page with no seam. */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-background from-42% to-transparent"
            aria-hidden
          />
          {/* Hide the Spline watermark in the bottom-right corner, blended */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 right-0 h-24 w-60 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--background))_38%,transparent_78%)]"
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
      <Reveal>
        <StatsBanner />
      </Reveal>

      {/* ── Section 4 — Wordmark pops up, CTA bursts from the "a" ──── */}
      <BurstSection />

      {/* ── Section 5 — Pinned scroll-story (StringTune-style) ──── */}
      <ScrollStory />

      {/* ── Section 6 — Features bento ───────────────────────── */}
      {/* content-visibility:auto lets the browser skip layout+paint for this
          section until it's scrolled near, so it costs nothing per frame while
          the hero is on screen. The intrinsic-size hint keeps the scrollbar
          stable so there's no jump when it materialises. */}
      <section className="relative px-4 py-24 [content-visibility:auto] [contain-intrinsic-size:auto_820px] lg:px-12">
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
          <Reveal className="text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-primary">
              Everything in one place
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
              Built like a learning{" "}
              <span className="text-cyan-300 [text-shadow:0_0_28px_hsl(187_92%_52%/0.45)]">
                superpower
              </span>
              .
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              Five tightly-integrated systems that work together so you don't
              just consume content — you actually learn it.
            </p>
          </Reveal>

          <Reveal className="mt-12">
          <Spotlight className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 lg:grid-rows-2">
            <BentoCard
              span="md:col-span-2 md:row-span-2"
              icon={<Bot className="h-6 w-6 text-violet-300" />}
              title="Streaming AI tutor"
              copy="Topic-aware, level-aware. Asks intent-classified follow-ups. Persists every conversation. Code blocks render with copy buttons."
              gradient="from-cyan-500/15 via-violet-500/10 to-violet-500/15"
              accent="bg-violet-500/20"
            >
              <TutorPreview />
            </BentoCard>
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
          </Reveal>
        </div>
      </section>

      {/* ── Section 6.5 — Ethical Hacking Arsenal spotlight ────── */}
      <section className="relative px-4 py-20 [content-visibility:auto] [contain-intrinsic-size:auto_720px] lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-10 rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-card/40 to-card/40 p-8 backdrop-blur-sm lg:grid-cols-2 lg:p-12">
            {/* Copy */}
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-emerald-300">
                <Terminal className="h-3.5 w-3.5" />
                New · Hands-on hacking
              </div>
              <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
                The Ethical Hacking{" "}
                <span className="text-emerald-300 [text-shadow:0_0_28px_hsl(152_76%_45%/0.5)]">
                  Arsenal
                </span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                Every phase of a real penetration test — reconnaissance, scanning, gaining access,
                post-exploitation, reporting — with the actual tools used at each step and an
                AI-generated, command-packed field guide for every one. Nmap, Metasploit, Burp,
                sqlmap, Hydra, Hashcat and 30+ more, inside a full hacker terminal.
              </p>
              <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <Pill icon={<ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />}>
                  5 attack phases
                </Pill>
                <Pill icon={<Terminal className="h-3.5 w-3.5 text-emerald-400" />}>
                  37+ real tools
                </Pill>
                <Pill icon={<Bot className="h-3.5 w-3.5 text-emerald-400" />}>
                  AI step-by-step guides
                </Pill>
              </ul>
              <div className="mt-8">
                <Button asChild size="lg" className="bg-emerald-500 text-white hover:bg-emerald-400">
                  <Link href="/register">
                    Explore the Arsenal <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Reveal>

            {/* Faux terminal preview */}
            <Reveal delay={0.15}>
              <TiltCard
                glare
                max={7}
                className="group relative overflow-hidden rounded-xl border border-emerald-500/25 bg-black/70 font-mono text-[13px] shadow-[0_0_50px_-12px_rgba(16,185,129,0.4)]"
              >
              <div className="flex items-center gap-2 border-b border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-2.5">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs text-emerald-300/70">root💀skillstreak: ~/arsenal</span>
              </div>
              <div className="space-y-1.5 p-5 leading-relaxed">
                <p className="text-emerald-400/70">┌──(root💀skillstreak)-[~/arsenal]</p>
                <p className="text-emerald-400/70">
                  └─<span className="text-emerald-300">$</span>{" "}
                  <span className="text-emerald-100">nmap -sV -sC -A 10.10.10.5</span>
                </p>
                <p className="text-emerald-200/60">Starting Nmap scan…</p>
                <p className="text-emerald-200/80">
                  22/tcp <span className="text-emerald-400">open</span> ssh OpenSSH 8.2p1
                </p>
                <p className="text-emerald-200/80">
                  80/tcp <span className="text-emerald-400">open</span> http Apache 2.4.41
                </p>
                <p className="text-emerald-200/80">
                  443/tcp <span className="text-emerald-400">open</span> ssl/http nginx
                </p>
                <p className="text-emerald-300/90">
                  <span className="text-teal-300">→</span> AI guide: every flag, every NSE script,
                  explained.
                </p>
                <p className="text-emerald-400/70">
                  └─<span className="text-emerald-300">$</span>{" "}
                  <span className="inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-emerald-400" />
                </p>
              </div>
              </TiltCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Section 7 — Closing CTA ──────────────────────────── */}
      <FinalCTA />

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 px-4 py-8 text-center text-xs text-muted-foreground/60 lg:px-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-3.5 w-3.5 text-primary" />
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

function ControlDial() {
  // Decorative studio widget — concentric rings, ticks, and orbiting nodes.
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" fill="none" className="studio-dial opacity-70">
      <circle cx="38" cy="38" r="35" stroke="hsl(187 92% 55% / 0.35)" strokeWidth="1" />
      <circle cx="38" cy="38" r="26" stroke="hsl(265 85% 68% / 0.3)" strokeWidth="1" strokeDasharray="3 5" />
      <circle cx="38" cy="38" r="4" fill="hsl(187 92% 55% / 0.9)" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={38 + Math.cos(a) * 31}
            y1={38 + Math.sin(a) * 31}
            x2={38 + Math.cos(a) * 35}
            y2={38 + Math.sin(a) * 35}
            stroke="hsl(195 40% 90% / 0.4)"
            strokeWidth="1"
          />
        );
      })}
      <circle cx="38" cy="3" r="2.5" fill="hsl(84 85% 62%)" />
      <circle cx="73" cy="38" r="2.5" fill="hsl(265 85% 70%)" />
    </svg>
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
  children,
}: {
  span?: string;
  icon: React.ReactNode;
  title: string;
  copy: string;
  gradient: string;
  accent: string;
  children?: React.ReactNode;
}) {
  return (
    <TiltCard
      glare={false}
      className={`bento-card chromatic group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm transition-[border-color,box-shadow] duration-300 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 ${span}`}
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

      <div className="relative [transform:translateZ(40px)]">
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
        {children}
      </div>
    </TiltCard>
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
              key={`${d.name}-${i}`}
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
