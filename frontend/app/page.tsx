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
import { HeroMidnight } from "@/components/landing/HeroMidnight";

// Marketing landing page: identical for every (logged-out) visitor and changes
// infrequently. Serve the pre-rendered HTML from cache and regenerate at most
// hourly (and on every redeploy / on-demand revalidate) rather than rendering
// per request. All interactive/animated regions are client components that
// hydrate on top of this static shell.
export const revalidate = 3600;

// Each domain keeps its own hue (matching lib/domain-style) in a tinted well.
const DOMAIN_TICKER = [
  { icon: ShieldCheck, name: "Cybersecurity", well: "bg-rose-500/15 text-rose-300 ring-rose-500/25" },
  { icon: Code2, name: "Web Development", well: "bg-blue-500/15 text-blue-300 ring-blue-500/25" },
  { icon: Brain, name: "Artificial Intelligence", well: "bg-violet-500/15 text-violet-300 ring-violet-500/25" },
  { icon: TrendingUp, name: "Machine Learning", well: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25" },
  { icon: Database, name: "Data Science", well: "bg-cyan-500/15 text-cyan-300 ring-cyan-500/25" },
  { icon: Cloud, name: "Cloud Computing", well: "bg-sky-500/15 text-sky-300 ring-sky-500/25" },
  { icon: SparklesIcon, name: "+ 3 more via AI", well: "bg-primary/10 text-primary ring-primary/25" },
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

      {/* ── Section 1 — Hero: WebGL aurora + tilted product preview ── */}
      <HeroMidnight />

      {/* ── Section 2 — Domains: a quiet, endless rail of hairline chips.
          Transparent with no borders so it flows straight on from the hero. */}
      <section className="relative py-12 sm:py-16" aria-label="Domains">
        <p className="mb-6 px-4 text-center text-[15px] font-medium text-muted-foreground">
          Nine domains to master. <span className="text-foreground">Pick one, or all of them.</span>
        </p>
        <DomainMarquee />
      </section>

      {/* ── Section 3 — Stats: glowing count-up numerals in one bento ── */}
      <div className="[content-visibility:auto] [contain-intrinsic-size:auto_640px]">
        <StatsBanner />
      </div>

      {/* ── Section 4 — The light moment: aurora band + giant wordmark ── */}
      <BurstSection />

      {/* ── Section 5 — How it works: a luminous path with live demos ── */}
      <div id="how-it-works" className="scroll-mt-16">
        <ScrollStory />
      </div>

      {/* ── Section 6 — Ethical Hacking Arsenal spotlight ────── */}
      <section
        id="arsenal"
        className="relative scroll-mt-16 px-4 py-20 [content-visibility:auto] [contain-intrinsic-size:auto_720px] lg:px-12 lg:py-28"
      >
        <div className="mx-auto max-w-6xl">
          {/* The Arsenal keeps its own identity: a phosphor-green terminal
              world, set into the Midnight page as one deep, lit panel. */}
          <div className="spotlight relative rounded-[1.4rem] border border-emerald-400/20 bg-[#030806] text-foreground shadow-[inset_0_1px_0_rgb(110_231_183/0.08),0_30px_80px_-30px_rgb(16_185_129/0.35)] [--spot:152_76%_50%]">
          <div className="isolate grid items-center gap-10 overflow-hidden rounded-[inherit] p-6 sm:p-8 lg:grid-cols-2 lg:p-12">
            {/* Phosphor light + grid, faded toward the far corner */}
            <div
              aria-hidden
              className="pointer-events-none absolute -left-32 -top-40 -z-10 h-[28rem] w-[28rem] rounded-full bg-emerald-500/20 blur-[100px]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 opacity-70 [background-image:linear-gradient(hsl(152_76%_50%/0.06)_1px,transparent_1px),linear-gradient(90deg,hsl(152_76%_50%/0.06)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_80%_70%_at_20%_20%,#000_20%,transparent_75%)]"
            />

            {/* Copy */}
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-1 font-mono text-[11px] text-emerald-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                new · hands-on hacking
              </div>
              <h2 className="mt-5 font-display text-4xl leading-[1.02] [text-wrap:balance] md:text-6xl">
                The Ethical Hacking{" "}
                <span className="font-serif-accent text-emerald-300 [text-shadow:0_0_32px_hsl(152_76%_50%/0.55)]">
                  Arsenal
                </span>
              </h2>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground md:text-base">
                Every phase of a real penetration test — reconnaissance, scanning, gaining access,
                post-exploitation, reporting — with the actual tools used at each step and an
                AI-generated, command-packed field guide for every one. Nmap, Metasploit, Burp,
                sqlmap, Hydra, Hashcat and 30+ more, inside a full hacker terminal.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2 text-sm text-emerald-100/90">
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
                <Button
                  asChild
                  size="lg"
                  className="group bg-emerald-400 text-[#02140b] shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_0_0_1px_rgb(52_211_153/0.6),0_8px_28px_-10px_rgb(52_211_153/0.8)] hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_0_0_1px_rgb(52_211_153/0.8),0_10px_40px_-8px_rgb(52_211_153/0.9)]"
                >
                  <Link href="/register">
                    Explore the Arsenal
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            </Reveal>

            {/* Faux terminal preview */}
            <Reveal delay={0.15}>
              <TiltCard
                glare
                max={6}
                className="group relative overflow-hidden rounded-xl border border-emerald-400/20 bg-black/80 font-mono text-[11px] shadow-[inset_0_1px_0_rgb(110_231_183/0.08),0_0_60px_-14px_rgb(16_185_129/0.5)] sm:text-[13px]"
              >
                <div className="flex items-center gap-2 border-b border-emerald-400/15 bg-emerald-400/[0.04] px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgb(52_211_153/0.8)]" />
                  <span className="ml-2 truncate text-[11px] text-emerald-300/80">root@skillstreak: ~/arsenal</span>
                </div>
                <div className="space-y-1.5 p-4 leading-relaxed sm:p-5">
                  <p className="text-emerald-400/80">┌──(root㉿skillstreak)-[~/arsenal]</p>
                  <p className="text-emerald-400/80">
                    └─<span className="text-emerald-300">$</span>{" "}
                    <span className="term-glow text-emerald-50">nmap -sV -sC -A 10.10.10.5</span>
                  </p>
                  <p className="text-emerald-200/70">Starting Nmap scan…</p>
                  <p className="whitespace-pre text-emerald-100/85">
                    {"22/tcp  "}<span className="text-emerald-400">open</span>{"  ssh    OpenSSH 8.2p1"}
                  </p>
                  <p className="whitespace-pre text-emerald-100/85">
                    {"80/tcp  "}<span className="text-emerald-400">open</span>{"  http   Apache 2.4.41"}
                  </p>
                  <p className="whitespace-pre text-emerald-100/85">
                    {"443/tcp "}<span className="text-emerald-400">open</span>{"  https  nginx"}
                  </p>
                  <p className="pt-1 text-emerald-300">
                    <span className="text-teal-300">→</span> AI guide: every flag, every NSE script,
                    explained.
                  </p>
                  <p className="text-emerald-400/80">
                    └─<span className="text-emerald-300">$</span>{" "}
                    <span className="inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-emerald-400 shadow-[0_0_10px_rgb(52_211_153/0.9)] motion-reduce:animate-none" />
                  </p>
                </div>
              </TiltCard>
            </Reveal>
          </div>
          </div>
        </div>
      </section>

      {/* ── Section 7 — Closing CTA ──────────────────────────── */}
      <div className="[content-visibility:auto] [contain-intrinsic-size:auto_700px]">
        <FinalCTA />
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="relative border-t border-white/[0.06] px-4 py-8 text-sm text-muted-foreground lg:px-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
              <SparklesIcon className="h-3.5 w-3.5 text-primary" />
            </span>
            <span>
              <span className="font-semibold text-foreground">SkillStreak</span> AI
              <span className="ml-2 font-mono text-xs">v0.7.0</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/login"
              className="focus-ring inline-flex min-h-[44px] items-center rounded-lg px-3 transition-colors hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="focus-ring inline-flex min-h-[44px] items-center rounded-lg px-3 transition-colors hover:text-foreground"
            >
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
    <li className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-1">
      {icon}
      {children}
    </li>
  );
}

function DomainMarquee() {
  // Duplicate the list so the loop is seamless.
  const items = [...DOMAIN_TICKER, ...DOMAIN_TICKER];
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
      <div className="flex w-max animate-marquee gap-3 px-1.5 motion-reduce:animate-none">
        {items.map((d, i) => {
          const Icon = d.icon;
          return (
            <div
              key={`${d.name}-${i}`}
              aria-hidden={i >= DOMAIN_TICKER.length || undefined}
              className="flex shrink-0 items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-5 text-[15px] font-medium text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]"
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-full ring-1 ${d.well}`}>
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              {d.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}
