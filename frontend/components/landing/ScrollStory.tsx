"use client";

/**
 * "How it works", Midnight edition: the learning loop drawn as a path of light.
 *
 * Five steps hang off a hairline vertical track. As you scroll, the track
 * fills with volt light (a bright head leads the fill), each step's orb node
 * lights up in its role colour, its copy panel slides in from its side, and a
 * live mini product panel (roadmap, tutor, quiz, streak week, progress) plays
 * once it is on screen. Desktop zig-zags copy / node / panel; phones stack
 * along a left rail.
 */

import { useRef, type CSSProperties, type FC } from "react";
import { MotionConfig, motion, useInView, useScroll, useSpring, useTransform } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import {
  BookOpen,
  Bot,
  Check,
  Flame,
  Gem,
  ListChecks,
  Star,
  TrendingDown,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MaskHeading } from "./Reveal";

const EASE = [0.22, 1, 0.36, 1] as const;

type Tone = "secondary" | "grape" | "primary" | "energy" | "xp";

type Step = {
  title: string;
  copy: string;
  icon: LucideIcon;
  tone: Tone; // role colour token, used for glows via hsl(var(--tone))
  text: string; // literal text class for Tailwind
  window: string; // faux window title on the product panel
  Vignette: FC;
  vignetteLabel: string;
};

const STEPS: Step[] = [
  {
    title: "Pick your path",
    copy: "Nine tech domains, each a full roadmap. Choose a goal and get a clear trail from foundations to mastery.",
    icon: BookOpen,
    tone: "secondary",
    text: "text-secondary",
    window: "roadmap / cybersecurity",
    Vignette: TrailVignette,
    vignetteLabel: "A roadmap trail with the first topic ready to start",
  },
  {
    title: "Learn with an AI tutor",
    copy: "A streaming tutor that knows your level and current topic. Ask for analogies, deeper dives or a quick quiz. Every chat is saved, every code block copy-ready.",
    icon: Bot,
    tone: "grape",
    text: "text-grape",
    window: "tutor / cia-triad",
    Vignette: TutorVignette,
    vignetteLabel: "The AI tutor explaining the CIA Triad with an analogy",
  },
  {
    title: "Prove it",
    copy: "5 AI-written questions per topic, checked by a second AI pass. Score 3 out of 5 to complete it. Plus a hands-on Ethical Hacking Arsenal for real practice.",
    icon: ListChecks,
    tone: "primary",
    text: "text-primary",
    window: "quiz / question 3",
    Vignette: QuizVignette,
    vignetteLabel: "A quiz question answered correctly for 25 XP",
  },
  {
    title: "Build the habit",
    copy: "Daily streaks with automatic freezes, XP and levels, 8 unlockable badges and a weekly league. Momentum you can feel.",
    icon: Flame,
    tone: "energy",
    text: "text-energy",
    window: "streak / this week",
    Vignette: HabitVignette,
    vignetteLabel: "A five-day streak, level progress and a league rank",
  },
  {
    title: "Watch yourself level up",
    copy: "A 90-day activity heatmap, per-domain progress, weak-area detection and score trends. Visible proof you're actually improving.",
    icon: TrendingUp,
    tone: "xp",
    text: "text-xp",
    window: "analytics / 90 days",
    Vignette: AnalyticsVignette,
    vignetteLabel: "An activity heatmap, a rising score trend and a flagged weak area",
  },
];

export function ScrollStory() {
  const reduce = useReducedMotion();
  const trackRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start 70%", "end 60%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });
  // The glowing head rides the fill edge by transform (a full-height mover
  // translated by its own height), never by `top`, so scrolling never relayouts.
  const headY = useTransform(fill, (v) => `${Math.min(1, Math.max(0, v)) * 100}%`);

  return (
    <MotionConfig reducedMotion={reduce ? "always" : "never"}>
      <section className="relative px-4 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <MaskHeading
            variant="focus"
            className="mx-auto max-w-3xl text-center font-display text-4xl leading-[1.05] [text-wrap:balance] md:text-6xl"
          >
            From curious to <span className="font-serif-accent text-primary text-glow">capable</span>, step by step.
          </MaskHeading>
          <p className="mx-auto mt-6 max-w-xl text-center text-base leading-relaxed text-muted-foreground [text-wrap:pretty] md:text-lg">
            Pick a path, learn it with the tutor, prove it in a quiz, and keep the streak alive.
          </p>

          <ol ref={trackRef} className="relative mt-14 space-y-12 md:mt-20 md:space-y-20">
            {/* The track: a hairline that fills with volt light as you scroll,
                led by a bright glowing head. */}
            <span
              aria-hidden
              className="absolute bottom-8 left-[28px] top-8 w-px -translate-x-1/2 bg-white/[0.08] md:left-1/2"
            >
              <motion.span
                className="absolute inset-x-0 top-0 h-full origin-top bg-[linear-gradient(180deg,hsl(var(--aurora-3)/0.0),hsl(var(--aurora-3))_12%,hsl(var(--primary)))] shadow-[0_0_12px_1px_hsl(var(--primary)/0.6)]"
                style={{ scaleY: reduce ? 1 : fill }}
              />
              {!reduce && (
                <motion.span aria-hidden className="absolute inset-0" style={{ y: headY }}>
                  <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-bright shadow-[0_0_0_4px_hsl(var(--primary)/0.18),0_0_24px_4px_hsl(var(--primary)/0.8)]" />
                </motion.span>
              )}
            </span>

            {STEPS.map((step, i) => (
              <StepRow key={step.title} step={step} index={i} />
            ))}
          </ol>
        </div>
      </section>
    </MotionConfig>
  );
}

function StepRow({ step, index }: { step: Step; index: number }) {
  const left = index % 2 === 0; // desktop: copy on the left, panel on the right
  const Icon = step.icon;
  const rowRef = useRef<HTMLLIElement>(null);
  const lit = useInView(rowRef, { once: true, amount: 0.5 });
  const mockRef = useRef<HTMLDivElement>(null);
  const mockInView = useInView(mockRef, { once: true, amount: 0.45 });
  const V = step.Vignette;
  const toneVar = { "--tone": `var(--${step.tone})` } as CSSProperties;

  return (
    <li
      ref={rowRef}
      style={toneVar}
      className="relative grid grid-cols-[56px_minmax(0,1fr)] items-center gap-x-4 gap-y-4 md:grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)] md:gap-x-10"
    >
      {/* Node: a dark glass orb whose rim and icon light up in the step's
          role colour as the path reaches it. */}
      <div className="relative z-10 col-start-1 row-start-1 self-start justify-self-center md:col-start-2 md:self-center">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={lit ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
          className={cn(
            "relative flex h-14 w-14 items-center justify-center rounded-full border bg-card transition-[box-shadow,border-color] duration-700 md:h-16 md:w-16",
            lit ? "border-[hsl(var(--tone)/0.55)]" : "border-white/10",
          )}
          style={{
            boxShadow: lit
              ? "inset 0 1px 0 rgb(255 255 255 / 0.08), 0 0 0 6px hsl(var(--background)), 0 0 36px -2px hsl(var(--tone) / 0.55)"
              : "inset 0 1px 0 rgb(255 255 255 / 0.06), 0 0 0 6px hsl(var(--background))",
          }}
        >
          <Icon className={cn("h-6 w-6 md:h-7 md:w-7", step.text)} strokeWidth={2} aria-hidden />
        </motion.span>
      </div>

      {/* Copy panel */}
      <motion.div
        initial={{ opacity: 0, x: left ? -28 : 28 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.6, ease: EASE }}
        className={cn(
          "col-start-2 row-start-1 md:row-start-1",
          left ? "md:col-start-1 md:text-right" : "md:col-start-3",
        )}
      >
        <h3 className="mt-1 font-display text-2xl leading-tight text-foreground md:mt-0 md:text-4xl">
          <span className="sr-only">Step {index + 1}: </span>
          {step.title}
        </h3>
        <p
          className={cn(
            "mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground md:text-base",
            left && "md:ml-auto",
          )}
        >
          {step.copy}
        </p>
      </motion.div>

      {/* Live product panel — mounts (and plays) once it's on screen. */}
      <div
        ref={mockRef}
        role="img"
        aria-label={step.vignetteLabel}
        className={cn(
          "card-chunky spotlight relative col-start-2 row-start-2 h-[320px] overflow-hidden md:row-start-1",
          left ? "md:col-start-3" : "md:col-start-1",
        )}
        style={{ "--spot": `var(--${step.tone})` } as CSSProperties}
      >
        {/* Window chrome */}
        <div className="flex h-9 items-center gap-1.5 border-b border-white/[0.06] bg-white/[0.02] px-3.5">
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="ml-2 truncate font-mono text-[10.5px] text-muted-foreground">{step.window}</span>
          <span
            className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: `hsl(var(--${step.tone}))`, boxShadow: `0 0 8px hsl(var(--${step.tone}))` }}
          />
        </div>
        {/* Stage (a wrapper, because .spotlight makes its direct children
            position:relative): role-tinted corner light + the vignette. */}
        <div className="h-[calc(100%-2.25rem)]">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-28 h-48 w-48 rounded-full blur-3xl"
            style={{ background: `hsl(var(--${step.tone}) / 0.12)` }}
          />
          {mockInView && <V />}
        </div>
      </div>
    </li>
  );
}

/* ── Vignettes ─────────────────────────────────────────────────────────── */

const pop = (delay: number) => ({
  initial: { opacity: 0, scale: 0.5 },
  animate: { opacity: 1, scale: 1 },
  transition: { type: "spring" as const, stiffness: 380, damping: 18, delay },
});

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: EASE },
});

const CHIP = "rounded-full border px-2.5 py-1 text-xs font-medium";

/** 1 — mini roadmap: domain chips + a trail of orbs that draws itself. */
function TrailVignette() {
  const nodes = [
    { x: 84, y: 92, current: true },
    { x: 178, y: 144 },
    { x: 108, y: 196 },
    { x: 196, y: 244 },
  ];
  const d = nodes
    .slice(1)
    .reduce((acc, n, i) => {
      const p = nodes[i];
      const my = (p.y + n.y) / 2;
      return `${acc} C ${p.x} ${my}, ${n.x} ${my}, ${n.x} ${n.y}`;
    }, `M ${nodes[0].x} ${nodes[0].y}`);
  return (
    <div className="absolute inset-0 p-4">
      <div className="flex gap-1.5 overflow-hidden">
        {["Cybersecurity", "Web Dev", "AI / ML"].map((label, i) => (
          <motion.span
            key={label}
            {...rise(0.1 + i * 0.08)}
            className={cn(
              CHIP,
              "shrink-0 whitespace-nowrap",
              i === 0
                ? "border-secondary/30 bg-secondary/10 text-secondary"
                : "border-white/10 bg-white/[0.03] text-muted-foreground",
            )}
          >
            {label}
          </motion.span>
        ))}
      </div>

      <svg className="absolute inset-0 h-full w-full" fill="none" aria-hidden>
        <path d={d} stroke="rgb(255 255 255 / 0.10)" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 7" />
        <motion.path
          d={d}
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.8))" }}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 0.34 }}
          transition={{ duration: 1.1, delay: 0.5, ease: EASE }}
        />
      </svg>

      {nodes.map((n, i) => (
        <motion.div
          key={i}
          {...pop(0.35 + i * 0.18)}
          className="absolute"
          style={{ left: n.x - (n.current ? 22 : 18), top: n.y - (n.current ? 22 : 18) }}
        >
          {n.current && (
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full bg-primary/40"
              animate={{ scale: [1, 1.9], opacity: [0.55, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 1 }}
            />
          )}
          <span
            className={cn(
              "relative flex items-center justify-center rounded-full",
              n.current
                ? "h-11 w-11 bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_0_28px_2px_hsl(var(--primary)/0.6)]"
                : "h-9 w-9 border border-white/10 bg-card text-muted-foreground",
            )}
          >
            {n.current ? (
              <Star className="h-5 w-5" fill="currentColor" aria-hidden />
            ) : (
              <BookOpen className="h-4 w-4" strokeWidth={2} aria-hidden />
            )}
          </span>
        </motion.div>
      ))}

      <motion.span
        {...pop(0.8)}
        className="label-mono absolute rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-primary"
        style={{ left: nodes[0].x + 32, top: nodes[0].y - 12 }}
      >
        Start
      </motion.span>
    </div>
  );
}

/** 2 — mini tutor chat: a question, a streaming reply, follow-up chips. */
function TutorVignette() {
  return (
    <div className="absolute inset-0 flex flex-col p-4">
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] pb-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-grape/10 text-grape ring-1 ring-grape/25">
          <Bot className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
        <span className="text-sm font-semibold text-foreground">AI tutor</span>
        <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] text-primary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary))] motion-reduce:animate-none" />
          streaming
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-end gap-2.5 pt-3">
        <motion.div
          {...rise(0.2)}
          className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-secondary px-3.5 py-2 text-sm font-medium text-secondary-foreground"
        >
          Explain the CIA Triad like I&apos;m new to this
        </motion.div>

        <motion.div
          {...rise(0.5)}
          className="max-w-[92%] rounded-2xl rounded-bl-md border border-white/[0.06] bg-white/[0.04] px-3.5 py-2.5 text-sm leading-snug text-foreground"
        >
          Think of a bank vault: only tellers get in <span className="font-semibold text-grape">(confidentiality)</span>, the
          ledger can&apos;t be forged <span className="font-semibold text-grape">(integrity)</span>, and it opens when you need it…
          <motion.span
            className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 rounded-full bg-grape shadow-[0_0_6px_hsl(var(--grape))]"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.9, repeat: Infinity }}
          />
        </motion.div>

        <motion.div {...rise(0.8)} className="flex gap-1.5">
          {["Give me an analogy", "Quiz me"].map((chip) => (
            <span key={chip} className={cn(CHIP, "border-white/10 bg-white/[0.03] text-grape")}>
              {chip}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/** 3 — mini quiz: the right answer locks in, XP drops. */
function QuizVignette() {
  const options = [
    { label: "Only availability", correct: false },
    { label: "Confidentiality, integrity, availability", correct: true },
    { label: "Speed and uptime", correct: false },
  ];
  return (
    <div className="absolute inset-0 flex flex-col p-4">
      <motion.div {...rise(0.1)} className="flex items-center gap-3">
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
            initial={{ scaleX: 0.4 }}
            animate={{ scaleX: 0.6 }}
            transition={{ delay: 1.1, duration: 0.6, ease: EASE }}
          />
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">3 / 5</span>
      </motion.div>

      <motion.p {...rise(0.25)} className="mt-3.5 text-[15px] font-semibold text-foreground">
        What does the CIA Triad protect?
      </motion.p>

      <div className="mt-3 flex flex-col gap-2">
        {options.map((o, i) => (
          <motion.div
            key={o.label}
            {...rise(0.4 + i * 0.1)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
              o.correct
                ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_24px_-8px_hsl(var(--primary)/0.7)]"
                : "border-white/[0.08] bg-white/[0.02] text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border font-mono text-[10px]",
                o.correct ? "border-primary bg-primary text-primary-foreground" : "border-white/15 text-muted-foreground",
              )}
            >
              {o.correct ? (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.0, type: "spring", stiffness: 500, damping: 16 }}>
                  <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden />
                </motion.span>
              ) : (
                String.fromCharCode(65 + i)
              )}
            </span>
            {o.label}
          </motion.div>
        ))}
      </div>

      <motion.div {...pop(1.3)} className="mt-auto flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-xp/10 px-3 py-1 font-mono text-xs font-semibold text-xp ring-1 ring-xp/25 shadow-[0_0_20px_-6px_hsl(var(--xp)/0.7)]">
          <Gem className="h-3.5 w-3.5" fill="currentColor" aria-hidden />
          +25 XP
        </span>
        <span className="text-sm font-semibold text-primary">Correct!</span>
      </motion.div>
    </div>
  );
}

/** 4 — the week lights up: flames, level bar, league rank. */
function HabitVignette() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const lit = 5;
  return (
    <div className="absolute inset-0 flex flex-col p-4">
      <motion.div {...rise(0.1)} className="flex items-center gap-3">
        <motion.span
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-energy/10 text-energy ring-1 ring-energy/30 shadow-[0_0_24px_-4px_hsl(var(--energy)/0.7)]"
        >
          <Flame className="h-5 w-5" fill="currentColor" aria-hidden />
        </motion.span>
        <div>
          <div className="font-display text-xl tabular-nums text-energy">5 day streak</div>
          <div className="text-xs text-muted-foreground">Longest: 12 days</div>
        </div>
      </motion.div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="font-mono text-[10px] text-muted-foreground">{d}</span>
            <motion.span
              {...pop(0.3 + i * 0.1)}
              className={cn(
                "flex aspect-square w-full max-w-[2rem] items-center justify-center rounded-full",
                i < lit
                  ? "bg-energy/15 text-energy ring-1 ring-energy/40 shadow-[0_0_14px_-3px_hsl(var(--energy)/0.8)]"
                  : "border border-white/10 bg-white/[0.03]",
              )}
            >
              {i < lit && <Flame className="h-3.5 w-3.5" fill="currentColor" aria-hidden />}
            </motion.span>
          </div>
        ))}
      </div>

      <motion.div {...rise(1.0)} className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 font-semibold text-grape">
            <Star className="h-3.5 w-3.5" fill="currentColor" aria-hidden />
            Level 4
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">380 / 520 XP</span>
        </div>
        <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-grape shadow-[0_0_12px_hsl(var(--grape)/0.6)]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 0.73 }}
            transition={{ delay: 1.15, duration: 0.9, ease: EASE }}
          />
        </div>
      </motion.div>

      <motion.div
        {...rise(1.5)}
        className="mt-auto flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2"
      >
        <span className="flex items-center gap-2 text-xs font-medium text-foreground">
          <Trophy className="h-4 w-4 text-xp" aria-hidden />
          Weekly league
        </span>
        <span className="rounded-full bg-grape/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-grape ring-1 ring-grape/25">
          #2 ↑
        </span>
      </motion.div>
    </div>
  );
}

/** 5 — progress: heatmap cells cascade in, the trend line draws, a weak area is flagged. */
function AnalyticsVignette() {
  const COLS = 13;
  const ROWS = 6;
  // Deterministic pseudo-random intensity 0–4 per cell (stable across remounts).
  const level = (i: number) => {
    const h = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    return h < 0.3 ? 0 : h < 0.5 ? 1 : h < 0.7 ? 2 : h < 0.88 ? 3 : 4;
  };
  const CELL_BG = [
    "bg-white/[0.05]",
    "bg-primary/20",
    "bg-primary/40",
    "bg-primary/70",
    "bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.7)]",
  ];
  return (
    <div className="absolute inset-0 flex flex-col p-4">
      <motion.div {...rise(0.1)} className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Last 90 days</span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-muted-foreground">
          All domains
        </span>
      </motion.div>

      <div className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          return (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.25 + col * 0.045 + row * 0.012, ease: EASE }}
              className={cn("h-[15px] w-full rounded-[3px]", CELL_BG[level(col * ROWS + row)])}
            />
          );
        })}
      </div>

      <motion.div {...rise(0.9)} className="relative mt-2 h-10">
        <svg viewBox="0 0 320 40" preserveAspectRatio="none" className="h-full w-full" fill="none" aria-hidden>
          <motion.path
            d="M 4 34 C 40 32, 60 26, 92 27 S 150 16, 184 18 S 250 8, 316 5"
            stroke="hsl(var(--secondary))"
            strokeWidth="2.5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ filter: "drop-shadow(0 0 5px hsl(var(--secondary) / 0.8))" }}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.0, delay: 1.0, ease: "easeInOut" }}
          />
        </svg>
        <motion.span
          {...pop(1.8)}
          className="absolute right-0 top-0 inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-0.5 text-[11px] font-semibold text-secondary ring-1 ring-secondary/25"
        >
          <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          Scores up 12%
        </motion.span>
      </motion.div>

      <motion.div
        {...rise(2.0)}
        className="mt-auto flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2"
      >
        <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-destructive-text">
          <TrendingDown className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
          <span className="truncate">Weak area: SQL injection</span>
        </span>
        <span className="shrink-0 text-xs font-semibold text-destructive-text">Review</span>
      </motion.div>
    </div>
  );
}
