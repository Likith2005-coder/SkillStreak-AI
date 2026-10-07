import { Link } from "next-view-transitions";
import {
  ArrowRight,
  Bot,
  Brain,
  Cloud,
  Code2,
  Database,
  ShieldCheck,
  Sparkles as SparklesIcon,
  Terminal,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingIntro } from "@/components/landing/LandingIntro";
import { LandingNav } from "@/components/landing/LandingNav";
import { BurstSection } from "@/components/landing/BurstSection";
import { StatsBanner } from "@/components/landing/StatsBanner";
import { ScrollStory } from "@/components/landing/ScrollStory";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { CursorFollower } from "@/components/landing/CursorFollower";
import { Reveal } from "@/components/landing/Reveal";
import { TiltCard } from "@/components/landing/TiltCard";
import { HeroPlayground } from "@/components/landing/HeroPlayground";

// Marketing landing page: identical for every (logged-out) visitor and changes
// infrequently. Serve the pre-rendered HTML from cache and regenerate at most
// hourly (and on every redeploy / on-demand revalidate) rather than rendering
// per request. All interactive/animated regions are client components that
// hydrate on top of this static shell.
export const revalidate = 3600;

const DOMAIN_TICKER = [
  { icon: ShieldCheck, name: "Cybersecurity" },
  { icon: Code2, name: "Web Development" },
  { icon: Brain, name: "Artificial Intelligence" },
  { icon: TrendingUp, name: "Machine Learning" },
  { icon: Database, name: "Data Science" },
  { icon: Cloud, name: "Cloud Computing" },
  { icon: SparklesIcon, name: "+ 3 more via AI" },
];

export default function LandingPage() {
  return (
    <main className="relative overflow-x-clip bg-background">
      {/* "Signal Boot" cinematic intro — once per session, click to skip */}
      <LandingIntro />
      <LandingNav />
      <ScrollProgress />
      <SmoothScroll />
      <CursorFollower />

      {/* ── Section 1 — Playground hero: headline, chunky CTAs, bot + stickers */}
      <HeroPlayground />

      {/* ── Section 2 — Domains as a scrolling row of chunky stickers ── */}
      <section className="relative py-10">
        <p className="mb-5 text-center text-base font-extrabold text-muted-foreground">
          Nine domains to master. Pick one, or all of them.
        </p>
        <DomainMarquee />
      </section>

      {/* ── Section 3 — Stats banner with animated counters ────── */}
      <div className="[content-visibility:auto] [contain-intrinsic-size:auto_640px]">
        <Reveal>
          <StatsBanner />
        </Reveal>
      </div>

      {/* ── Section 4 — Wordmark pops up, CTA bursts from the "a" ──── */}
      <BurstSection />

      {/* ── Section 5 — Pinned scroll-story (StringTune-style) ──── */}
      <div id="how-it-works" className="scroll-mt-16">
        <ScrollStory />
      </div>

      {/* ── Section 6 — Ethical Hacking Arsenal spotlight ────── */}
      <section
        id="arsenal"
        className="relative scroll-mt-16 px-4 py-20 [content-visibility:auto] [contain-intrinsic-size:auto_720px] lg:px-12"
      >
        <div className="mx-auto max-w-6xl">
          <div className="dark grid items-center gap-10 rounded-3xl border-2 border-b-[6px] border-emerald-500/40 bg-[#04070a] bg-gradient-to-br from-emerald-500/15 via-transparent to-transparent p-8 text-foreground lg:grid-cols-2 lg:p-12">
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
                  <span className="inline-block h-4 w-2 translate-y-0.5 animate-pulse motion-reduce:animate-none bg-emerald-400" />
                </p>
              </div>
              </TiltCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Section 7 — Closing CTA ──────────────────────────── */}
      <div className="[content-visibility:auto] [contain-intrinsic-size:auto_700px]">
        <FinalCTA />
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 px-4 py-8 text-center text-xs text-muted-foreground lg:px-12">
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

function Pill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1">
      {icon}
      {children}
    </li>
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

      <div className="flex w-max animate-marquee motion-reduce:animate-none gap-8 px-8">
        {items.map((d, i) => {
          const Icon = d.icon;
          return (
            <div
              key={`${d.name}-${i}`}
              className="flex shrink-0 items-center gap-2.5 rounded-2xl border-2 border-b-4 border-border bg-card px-5 py-3 text-base font-extrabold text-foreground"
            >
              <Icon className="h-5 w-5 text-primary" strokeWidth={2.6} />
              {d.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}

