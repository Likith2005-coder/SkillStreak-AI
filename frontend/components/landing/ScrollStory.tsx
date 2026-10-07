"use client";

/**
 * "How it works", playground edition: the learning loop drawn as a path.
 *
 * Five steps hang off a chunky vertical track like nodes on a lesson path.
 * The track fills with green as you scroll past it, each step's sticker node
 * pops in, its card slides in from its side, and a live mini-mock of the real
 * feature (roadmap, tutor, quiz, streak week, progress) plays once it's on
 * screen. Desktop zig-zags card / node / mock; phones stack along a left rail.
 *
 * Replaces the old 500vh pinned scroll-story: same content and vignettes, but
 * it scrolls like a normal page, works on phones, and never traps the wheel.
 */

import { useRef, type FC } from "react";
import { MotionConfig, motion, useInView, useScroll, useSpring } from "framer-motion";
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

const EASE = [0.22, 1, 0.36, 1] as const;

type Step = {
  title: string;
  copy: string;
  icon: LucideIcon;
  face: string; // node face (bright)
  edge: string; // node 3D edge colour
  text: string; // AA text colour on white
  tilt: number;
  Vignette: FC;
  vignetteLabel: string;
};

const STEPS: Step[] = [
  {
    title: "Pick your path",
    copy: "9 tech domains, 5 deeply-curated roadmaps. Choose a goal and get a clear trail from foundations to mastery.",
    icon: BookOpen,
    face: "bg-secondary-bright",
    edge: "hsl(var(--secondary-shade))",
    text: "text-secondary",
    tilt: -8,
    Vignette: TrailVignette,
    vignetteLabel: "A roadmap trail with the first topic ready to start",
  },
  {
    title: "Learn with an AI tutor",
    copy: "A streaming tutor that knows your level and current topic. Ask for analogies, deeper dives or a quick quiz. Every chat is saved, every code block copy-ready.",
    icon: Bot,
    face: "bg-grape-bright",
    edge: "hsl(var(--grape-shade))",
    text: "text-grape",
    tilt: 7,
    Vignette: TutorVignette,
    vignetteLabel: "The AI tutor explaining the CIA Triad with an analogy",
  },
  {
    title: "Prove it",
    copy: "5 AI-written questions per topic, checked by a second AI pass. Score 3 out of 5 to complete it. Plus a hands-on Ethical Hacking Arsenal for real practice.",
    icon: ListChecks,
    face: "bg-primary-bright",
    edge: "hsl(var(--primary-shade))",
    text: "text-primary",
    tilt: -6,
    Vignette: QuizVignette,
    vignetteLabel: "A quiz question answered correctly for 25 XP",
  },
  {
    title: "Build the habit",
    copy: "Daily streaks with automatic freezes, XP and levels, 8 unlockable badges and a weekly league. Momentum you can feel.",
    icon: Flame,
    face: "bg-energy-bright",
    edge: "hsl(var(--energy-shade))",
    text: "text-energy",
    tilt: 9,
    Vignette: HabitVignette,
    vignetteLabel: "A five-day streak, level progress and a league rank",
  },
  {
    title: "Watch yourself level up",
    copy: "A 90-day activity heatmap, per-domain progress, weak-area detection and score trends. Visible proof you're actually improving.",
    icon: TrendingUp,
    face: "bg-xp-bright",
    edge: "hsl(var(--xp-shade))",
    text: "text-xp",
    tilt: -7,
    Vignette: AnalyticsVignette,
    vignetteLabel: "An activity heatmap, a rising score trend and a flagged weak area",
  },
];

export function ScrollStory() {
  const reduce = useReducedMotion();
  const trackRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start 70%", "end 60%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });

  return (
    <MotionConfig reducedMotion={reduce ? "always" : "never"}>
      <section className="relative px-4 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="mx-auto max-w-3xl text-center font-display text-3xl md:text-5xl [text-wrap:balance]">
            From curious to <span className="text-primary">capable</span>, step by step.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg font-semibold text-muted-foreground [text-wrap:pretty]">
            Five systems working as one loop, so you don&apos;t just read it. You actually learn it.
          </p>

          <ol ref={trackRef} className="relative mt-14 space-y-10 md:mt-20 md:space-y-16">
            {/* The track: a fat grey rail that fills green as you scroll. */}
            <span
              aria-hidden
              className="absolute bottom-8 left-[27px] top-8 w-2.5 -translate-x-1/2 overflow-hidden rounded-full bg-muted md:left-1/2"
            >
              <motion.span
                className="absolute inset-0 origin-top rounded-full bg-primary-bright"
                style={{ scaleY: reduce ? 1 : fill }}
              />
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
  const left = index % 2 === 0; // desktop: card on the left, mock on the right
  const Icon = step.icon;
  const mockRef = useRef<HTMLDivElement>(null);
  const mockInView = useInView(mockRef, { once: true, amount: 0.45 });
  const V = step.Vignette;

  return (
    <li className="relative grid grid-cols-[56px_minmax(0,1fr)] items-center gap-x-4 gap-y-4 md:grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)] md:gap-x-8">
      {/* Node: a tilted 3D sticker with the step number on a badge. */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ type: "spring", stiffness: 380, damping: 14 }}
        className="relative z-10 col-start-1 row-start-1 self-start justify-self-center md:col-start-2 md:self-center"
      >
        <span
          className={cn("flex h-14 w-14 items-center justify-center rounded-2xl md:h-20 md:w-20 md:rounded-[1.6rem]", step.face)}
          style={{ boxShadow: `0 6px 0 ${step.edge}`, transform: `rotate(${step.tilt}deg)` }}
        >
          <Icon className="h-7 w-7 text-white md:h-10 md:w-10" strokeWidth={2.6} aria-hidden />
        </span>
        <span
          className={cn(
            "absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-border bg-card text-sm font-black tabular-nums md:h-8 md:w-8 md:text-base",
            step.text,
          )}
          aria-hidden
        >
          {index + 1}
        </span>
      </motion.div>

      {/* Copy card */}
      <motion.div
        initial={{ opacity: 0, x: left ? -28 : 28 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.55, ease: EASE }}
        className={cn(
          "card-chunky col-start-2 row-start-1 p-6 md:row-start-1 md:p-8",
          left ? "md:col-start-1" : "md:col-start-3",
        )}
      >
        <h3 className="font-display text-2xl text-foreground md:text-3xl">
          <span className="sr-only">Step {index + 1}: </span>
          {step.title}
        </h3>
        <p className="mt-2 text-base font-semibold leading-relaxed text-muted-foreground">{step.copy}</p>
      </motion.div>

      {/* Live mini-mock — mounts (and plays) once it's on screen. */}
      <div
        ref={mockRef}
        role="img"
        aria-label={step.vignetteLabel}
        className={cn(
          "relative col-start-2 row-start-2 h-[300px] overflow-hidden rounded-[1.25rem] border-2 border-b-[5px] border-border bg-card md:row-start-1",
          left ? "md:col-start-3" : "md:col-start-1",
        )}
      >
        {mockInView && <V />}
      </div>
    </li>
  );
}

/* ── Vignettes ─────────────────────────────────────────────────────────── */

const pop = (delay: number) => ({
  initial: { opacity: 0, scale: 0.5 },
  animate: { opacity: 1, scale: 1 },
  transition: { type: "spring" as const, stiffness: 380, damping: 16, delay },
});

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: EASE },
});

/** 1 — mini roadmap: domain chips + a trail that draws itself. */
function TrailVignette() {
  const nodes = [
    { x: 84, y: 98, current: true },
    { x: 178, y: 150 },
    { x: 108, y: 202 },
    { x: 196, y: 250 },
  ];
  return (
    <div className="absolute inset-0 p-4">
      <div className="flex gap-1.5 overflow-hidden">
        {["Cybersecurity", "Web Dev", "AI / ML"].map((d, i) => (
          <motion.span
            key={d}
            {...rise(0.1 + i * 0.08)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border-2 px-2.5 py-1 text-xs font-extrabold",
              i === 0 ? "border-secondary-bright bg-secondary/10 text-secondary" : "border-border bg-card text-muted-foreground",
            )}
          >
            {d}
          </motion.span>
        ))}
      </div>

      <svg className="absolute inset-0 h-full w-full" fill="none" aria-hidden>
        <motion.path
          d={nodes.slice(1).reduce((d, n, i) => { const p = nodes[i]; const my = (p.y + n.y) / 2; return `${d} C ${p.x} ${my}, ${n.x} ${my}, ${n.x} ${n.y}`; }, `M ${nodes[0].x} ${nodes[0].y}`)}
          stroke="hsl(var(--border))"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="1 16"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, delay: 0.35, ease: "easeInOut" }}
        />
      </svg>

      {nodes.map((n, i) => (
        <motion.div
          key={i}
          {...pop(0.4 + i * 0.22)}
          className="absolute"
          style={{ left: n.x - (n.current ? 28 : 24), top: n.y - (n.current ? 28 : 24) }}
        >
          <span
            className={cn(
              "flex items-center justify-center rounded-full",
              n.current ? "h-14 w-14 bg-primary-bright" : "h-12 w-12 bg-muted",
            )}
            style={{ boxShadow: `0 5px 0 ${n.current ? "hsl(var(--primary-shade))" : "hsl(var(--border))"}` }}
          >
            {n.current ? (
              <Star className="h-6 w-6 text-white" fill="currentColor" aria-hidden />
            ) : (
              <BookOpen className="h-5 w-5 text-muted-foreground" strokeWidth={2.5} aria-hidden />
            )}
          </span>
        </motion.div>
      ))}

      <motion.span
        {...pop(0.75)}
        className="absolute rounded-xl border-2 border-border bg-card px-2.5 py-1 text-xs font-black uppercase tracking-wide text-primary"
        style={{ left: nodes[0].x + 36, top: nodes[0].y - 14 }}
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
      <div className="flex items-center gap-2.5 border-b-2 border-border pb-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-grape-bright" style={{ boxShadow: "0 3px 0 hsl(var(--grape-shade))" }}>
          <Bot className="h-5 w-5 text-white" strokeWidth={2.5} aria-hidden />
        </span>
        <span className="text-sm font-black text-foreground">AI tutor</span>
        <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-extrabold text-primary">typing…</span>
      </div>

      <div className="flex flex-1 flex-col justify-end gap-2.5 pt-3">
        <motion.div
          {...rise(0.2)}
          className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-secondary px-3.5 py-2 text-sm font-bold text-white"
        >
          Explain the CIA Triad like I&apos;m new to this
        </motion.div>

        <motion.div
          {...rise(0.5)}
          className="max-w-[92%] rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5 text-sm font-semibold leading-snug text-foreground"
        >
          Think of a bank vault: only tellers get in <span className="font-extrabold text-grape">(confidentiality)</span>, the
          ledger can&apos;t be forged <span className="font-extrabold text-grape">(integrity)</span>, and it opens when you need it…
          <motion.span
            className="ml-0.5 inline-block h-3.5 w-[3px] translate-y-0.5 rounded-full bg-grape-bright"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.9, repeat: Infinity }}
          />
        </motion.div>

        <motion.div {...rise(0.8)} className="flex gap-1.5">
          {["Give me an analogy", "Quiz me"].map((chip) => (
            <span key={chip} className="rounded-full border-2 border-border bg-card px-3 py-1 text-xs font-extrabold text-grape">
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
        <div className="relative h-3.5 flex-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-primary-bright"
            initial={{ scaleX: 0.4 }}
            animate={{ scaleX: 0.6 }}
            transition={{ delay: 1.1, duration: 0.6, ease: EASE }}
          >
            <span className="absolute inset-x-2 top-[3px] h-1 rounded-full bg-white/35" />
          </motion.div>
        </div>
        <span className="text-xs font-black tabular-nums text-muted-foreground">3 / 5</span>
      </motion.div>

      <motion.p {...rise(0.25)} className="mt-3 text-base font-black text-foreground">
        What does the CIA Triad protect?
      </motion.p>

      <div className="mt-2.5 flex flex-col gap-2">
        {options.map((o, i) => (
          <motion.div
            key={o.label}
            {...rise(0.4 + i * 0.1)}
            className={cn(
              "flex items-center gap-2.5 rounded-xl border-2 border-b-4 px-3 py-2 text-xs font-bold",
              o.correct ? "border-primary-bright bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-[11px] font-black",
                o.correct ? "border-primary-bright bg-primary-bright text-white" : "border-border text-muted-foreground",
              )}
            >
              {o.correct ? (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.0, type: "spring", stiffness: 500, damping: 14 }}>
                  <Check className="h-3 w-3" strokeWidth={4} aria-hidden />
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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-xp/10 px-3 py-1 text-sm font-black text-xp">
          <Gem className="h-4 w-4 text-xp-bright" fill="currentColor" aria-hidden />
          +25 XP
        </span>
        <span className="text-sm font-black text-primary">Nice! 5 / 5</span>
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
          animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-energy-bright"
          style={{ boxShadow: "0 4px 0 hsl(var(--energy-shade))" }}
        >
          <Flame className="h-6 w-6 text-white" fill="currentColor" aria-hidden />
        </motion.span>
        <div>
          <div className="text-xl font-black tabular-nums text-energy">5 day streak</div>
          <div className="text-xs font-bold text-muted-foreground">Longest: 12 days</div>
        </div>
      </motion.div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[11px] font-extrabold text-muted-foreground">{d}</span>
            <motion.span
              {...pop(0.3 + i * 0.1)}
              className={cn(
                "flex aspect-square w-full max-w-[2.1rem] items-center justify-center rounded-full",
                i < lit ? "bg-energy-bright" : "border-2 border-border bg-muted",
              )}
            >
              {i < lit && <Flame className="h-3.5 w-3.5 text-white" fill="currentColor" aria-hidden />}
            </motion.span>
          </div>
        ))}
      </div>

      <motion.div {...rise(1.0)} className="mt-4">
        <div className="flex items-center justify-between text-xs font-extrabold">
          <span className="flex items-center gap-1 text-grape">
            <Star className="h-3.5 w-3.5 text-grape-bright" fill="currentColor" aria-hidden />
            Level 4
          </span>
          <span className="tabular-nums text-muted-foreground">380 / 520 XP</span>
        </div>
        <div className="relative mt-1.5 h-3.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-grape-bright"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 0.73 }}
            transition={{ delay: 1.15, duration: 0.9, ease: EASE }}
          >
            <span className="absolute inset-x-2 top-[3px] h-1 rounded-full bg-white/35" />
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        {...rise(1.5)}
        className="mt-auto flex items-center justify-between rounded-xl border-2 border-border px-3 py-2"
      >
        <span className="flex items-center gap-2 text-xs font-extrabold text-foreground">
          <Trophy className="h-4 w-4 text-xp-bright" fill="currentColor" aria-hidden />
          Weekly league
        </span>
        <span className="rounded-full bg-grape/10 px-2.5 py-0.5 text-xs font-black text-grape">#2 ↑</span>
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
  const CELL_BG = ["bg-muted", "bg-primary-bright/25", "bg-primary-bright/50", "bg-primary-bright/75", "bg-primary-bright"];
  return (
    <div className="absolute inset-0 flex flex-col p-4">
      <motion.div {...rise(0.1)} className="flex items-center justify-between">
        <span className="text-sm font-black text-foreground">Last 90 days</span>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-extrabold text-muted-foreground">All domains</span>
      </motion.div>

      <div className="mt-2.5 grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          return (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.25 + col * 0.045 + row * 0.012, ease: EASE }}
              className={cn("h-[18px] w-full rounded-[4px]", CELL_BG[level(col * ROWS + row)])}
            />
          );
        })}
      </div>

      <motion.div {...rise(0.9)} className="relative mt-2 h-10">
        <svg viewBox="0 0 320 40" preserveAspectRatio="none" className="h-full w-full" fill="none" aria-hidden>
          <motion.path
            d="M 4 34 C 40 32, 60 26, 92 27 S 150 16, 184 18 S 250 8, 316 5"
            stroke="hsl(var(--secondary-bright))"
            strokeWidth="4"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.0, delay: 1.0, ease: "easeInOut" }}
          />
        </svg>
        <motion.span
          {...pop(1.8)}
          className="absolute right-0 top-0 inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-extrabold text-secondary"
        >
          <TrendingUp className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
          Scores up 12%
        </motion.span>
      </motion.div>

      <motion.div
        {...rise(2.0)}
        className="mt-auto flex items-center justify-between gap-2 rounded-xl border-2 border-destructive-bright/40 bg-destructive/5 px-3 py-2"
      >
        <span className="flex min-w-0 items-center gap-2 text-xs font-extrabold text-destructive-text">
          <TrendingDown className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden />
          <span className="truncate">Weak area: SQL injection</span>
        </span>
        <span className="shrink-0 text-xs font-black text-destructive-text">Review</span>
      </motion.div>
    </div>
  );
}
