import { Link } from "next-view-transitions";
import { ArrowRight, Bot, ShieldCheck, Terminal, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingIntro } from "@/components/landing/LandingIntro";
import { LandingNav } from "@/components/landing/LandingNav";
import { BurstSection } from "@/components/landing/BurstSection";
import { StatsBanner } from "@/components/landing/StatsBanner";
import { ScrollStory } from "@/components/landing/ScrollStory";
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

// All nine domains, set as type. Each name takes its domain hue on hover.
const DOMAIN_TICKER = [
  { name: "Cybersecurity", hover: "hover:text-rose-300" },
  { name: "Web Development", hover: "hover:text-blue-300" },
  { name: "Artificial Intelligence", hover: "hover:text-violet-300" },
  { name: "Machine Learning", hover: "hover:text-emerald-300" },
  { name: "Data Science", hover: "hover:text-cyan-300" },
  { name: "Cloud Computing", hover: "hover:text-sky-300" },
  { name: "DevOps", hover: "hover:text-orange-300" },
  { name: "Blockchain", hover: "hover:text-amber-300" },
  { name: "Internet of Things", hover: "hover:text-teal-300" },
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
      <section className="relative pb-16 pt-4 sm:pb-20" aria-labelledby="domains-h">
        <h2 id="domains-h" className="mb-8 px-4 text-center font-display text-2xl text-foreground md:text-3xl">
          Nine domains. <span className="font-serif-accent text-primary">Pick one, or all of them.</span>
        </h2>
        <DomainMarquee />
      </section>

      {/* ── Section 3 — Stats: glowing count-up numerals in one bento ── */}
      <div className="[content-visibility:auto] [contain-intrinsic-size:auto_640px]">
        <StatsBanner />
      </div>

      {/* ── Section 5 — How it works: a luminous path with live demos ── */}
      <div id="how-it-works" className="scroll-mt-16">
        <ScrollStory />
      </div>

      {/* ── Section 6 — Ethical Hacking Arsenal spotlight ────── */}
      <section
        id="arsenal"
        className="relative scroll-mt-16 px-4 py-16 [content-visibility:auto] [contain-intrinsic-size:auto_720px] lg:px-12 lg:py-24"
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
              <h2 className="font-display text-4xl leading-[1.02] [text-wrap:balance] md:text-6xl">
                The Ethical Hacking{" "}
                <span className="font-serif-accent text-emerald-300 [text-shadow:0_0_32px_hsl(152_76%_50%/0.55)]">
                  Arsenal
                </span>
              </h2>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground md:text-base">
                Every phase of a real pentest, from recon to reporting, with the actual tools and an
                AI field guide for each. Nmap, Metasploit, Burp, sqlmap and 30+ more, in a real
                terminal.
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

      {/* ── Finale — aurora band, the giant wordmark, one call to action ── */}
      <BurstSection />

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="relative border-t border-white/[0.06] px-4 py-10 text-sm text-muted-foreground lg:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_0_18px_-2px_hsl(var(--primary)/0.7)]"
            >
              <Zap className="h-4 w-4" fill="currentColor" strokeWidth={1.5} />
            </span>
            <span className="font-display text-base text-foreground">
              SkillStreak<span className="ml-1 text-muted-foreground">AI</span>
            </span>
            <span className="ml-2 text-xs">© {new Date().getFullYear()}</span>
          </div>
          <nav aria-label="Footer" className="-mx-3 flex flex-wrap items-center">
            {[
              { href: "#how-it-works", label: "How it works", a: true },
              { href: "#arsenal", label: "Arsenal", a: true },
              { href: "/login", label: "Log in" },
              { href: "/register", label: "Start free" },
            ].map((l) =>
              l.a ? (
                <a key={l.href} href={l.href} className="focus-ring inline-flex min-h-[44px] items-center rounded-lg px-3 transition-colors hover:text-foreground">
                  {l.label}
                </a>
              ) : (
                <Link key={l.href} href={l.href} className="focus-ring inline-flex min-h-[44px] items-center rounded-lg px-3 transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              ),
            )}
          </nav>
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
    <div className="group/marquee relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
      <ul className="flex w-max animate-marquee items-center group-hover/marquee:[animation-play-state:paused] motion-reduce:animate-none">
        {items.map((d, i) => (
          <li
            key={`${d.name}-${i}`}
            aria-hidden={i >= DOMAIN_TICKER.length || undefined}
            className="flex shrink-0 items-center"
          >
            <span className={`whitespace-nowrap px-6 font-display text-4xl text-foreground/85 transition-colors duration-300 md:px-8 md:text-6xl ${d.hover}`}>
              {d.name}
            </span>
            <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.8)]" />
          </li>
        ))}
      </ul>
    </div>
  );
}
