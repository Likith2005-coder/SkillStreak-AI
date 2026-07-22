"use client";

/**
 * Pinned scroll-telling section (StringTune / awwwards-style).
 *
 * A tall section whose inner panel sticks to the viewport while the user
 * scrolls; the active step advances with scroll progress, crossfading its
 * copy AND a live product vignette — a miniature animated mock of the real
 * feature (roadmap trail, streaming tutor, quiz, streak week). Motion drives
 * everything; honours prefers-reduced-motion (falls back to a static list).
 */

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  BookOpen,
  Bot,
  Check,
  Flame,
  ListChecks,
  Lock,
  Play,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

type Step = {
  k: string;
  title: string;
  copy: string;
  icon: LucideIcon;
  from: string;
  to: string;
  text: string;
  glowHex: string;
};

const STEPS: Step[] = [
  {
    k: "01",
    title: "Pick your path",
    copy: "9 tech domains, 5 deeply-curated roadmaps. Choose a goal and get a clear, visualised trail from foundations to mastery.",
    icon: BookOpen,
    from: "from-rose-500",
    to: "to-pink-500",
    text: "text-rose-300",
    glowHex: "#f43f5e",
  },
  {
    k: "02",
    title: "Learn with an AI tutor",
    copy: "A streaming tutor that knows your level and current topic. Ask for analogies, deeper dives, or a quick quiz — it adapts to you.",
    icon: Bot,
    from: "from-violet-500",
    to: "to-violet-500",
    text: "text-violet-300",
    glowHex: "#8b5cf6",
  },
  {
    k: "03",
    title: "Prove it",
    copy: "AI-generated quizzes and a hands-on Ethical Hacking Arsenal turn passive reading into real, tested understanding.",
    icon: ListChecks,
    from: "from-emerald-500",
    to: "to-teal-500",
    text: "text-emerald-300",
    glowHex: "#10b981",
  },
  {
    k: "04",
    title: "Build the habit",
    copy: "Daily streaks, XP, levels, badges and a weekly leaderboard keep you coming back — momentum you can feel.",
    icon: Trophy,
    from: "from-amber-500",
    to: "to-orange-500",
    text: "text-amber-300",
    glowHex: "#f59e0b",
  },
];

export function ScrollStory() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const i = Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length)));
    setActive(i);
  });
  const railScaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  if (reduce) return <StaticFallback />;

  const step = STEPS[active];
  const Icon = step.icon;

  return (
    <section ref={ref} className="relative" style={{ height: `${STEPS.length * 100}vh` }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        {/* soft moving glow tinted to the active step */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className={`absolute left-1/2 top-1/2 h-[60vmax] w-[60vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br ${step.from} ${step.to} opacity-[0.08] blur-[120px] transition-all duration-700`}
          />
        </div>

        <div className="container relative z-10 px-4 lg:px-12">
          <p className="text-center text-xs uppercase tracking-[0.3em] text-primary">
            How it works
          </p>
          <h2 className="mx-auto mt-3 max-w-3xl text-center font-display text-3xl font-bold tracking-tight md:text-5xl">
            From curious to{" "}
            <span className="gradient-text">capable</span>, step by step.
          </h2>

          <div className="mx-auto mt-12 grid max-w-6xl grid-cols-[auto_1fr] items-center gap-6 sm:gap-12">
            {/* Progress rail + step dots */}
            <div className="flex items-stretch gap-4">
              <div className="relative w-[3px] overflow-hidden rounded-full bg-border/60">
                <motion.div
                  style={{ scaleY: railScaleY }}
                  className="absolute inset-0 origin-top rounded-full bg-gradient-to-b from-cyan-400 via-violet-400 to-violet-400"
                />
              </div>
              <ol className="flex flex-col justify-between py-1">
                {STEPS.map((s, i) => (
                  <li
                    key={s.k}
                    className={`font-mono text-sm transition-colors duration-300 ${
                      i === active ? s.text : "text-muted-foreground/40"
                    }`}
                  >
                    {s.k}
                  </li>
                ))}
              </ol>
            </div>

            {/* Active step card — crossfades on change */}
            <div className="relative min-h-[280px] lg:min-h-[340px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.k}
                  initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="grid items-center gap-8 rounded-3xl border border-border/70 bg-card/50 p-8 backdrop-blur-sm sm:p-10 lg:grid-cols-[1fr_minmax(0,400px)]"
                >
                  <div>
                    <div
                      className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${step.from} ${step.to} shadow-lg`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="mt-6 flex items-baseline gap-3">
                      <span className={`font-mono text-sm ${step.text}`}>STEP {step.k}</span>
                    </div>
                    <h3 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">
                      {step.copy}
                    </p>

                    {/* step pips */}
                    <div className="mt-8 flex gap-2">
                      {STEPS.map((s, i) => (
                        <span
                          key={s.k}
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            i === active
                              ? `w-8 bg-gradient-to-r ${s.from} ${s.to}`
                              : "w-2 bg-border"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Live product vignette — a miniature of the real feature.
                      Keyed remount per step so the choreography replays. */}
                  <div className="relative hidden h-[300px] overflow-hidden rounded-2xl border border-border/70 bg-background/70 lg:block">
                    {/* faint dot grid + step-tinted bloom */}
                    <div
                      aria-hidden
                      className="absolute inset-0 opacity-[0.35]"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
                        backgroundSize: "22px 22px",
                      }}
                    />
                    <div
                      aria-hidden
                      className="absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
                      style={{ background: `${step.glowHex}2b` }}
                    />
                    {active === 0 && <TrailVignette />}
                    {active === 1 && <TutorVignette />}
                    {active === 2 && <QuizVignette />}
                    {active === 3 && <HabitVignette />}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <p className="mt-10 text-center text-xs text-muted-foreground/60">
            ↓ keep scrolling
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── Vignettes ─────────────────────────────────────────────────────────── */

const pop = (delay: number) => ({
  initial: { opacity: 0, scale: 0.7 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.4, delay, ease: EASE },
});

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: EASE },
});

/** 01 — mini roadmap: domain chips + a trail that draws itself. */
function TrailVignette() {
  const nodes = [
    { x: 84, y: 64, unlocked: true },
    { x: 190, y: 122, unlocked: false },
    { x: 116, y: 192, unlocked: false },
    { x: 230, y: 248, unlocked: false },
  ];
  return (
    <div className="absolute inset-0 p-5">
      <div className="flex gap-2">
        {["Cybersecurity", "Web Dev", "AI/ML"].map((d, i) => (
          <motion.span
            key={d}
            {...rise(0.15 + i * 0.1)}
            className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${
              i === 0
                ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                : "border-border bg-card/60 text-muted-foreground"
            }`}
          >
            {d}
          </motion.span>
        ))}
      </div>

      <svg className="absolute inset-0 h-full w-full" fill="none" aria-hidden>
        <motion.path
          d={`M ${nodes[0].x} ${nodes[0].y} C 150 80, 200 90, ${nodes[1].x} ${nodes[1].y} S 90 160, ${nodes[2].x} ${nodes[2].y} S 240 210, ${nodes[3].x} ${nodes[3].y}`}
          stroke="#f43f5e55"
          strokeWidth="2"
          strokeDasharray="6 7"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, delay: 0.5, ease: "easeInOut" }}
        />
      </svg>

      {nodes.map((n, i) => (
        <motion.div
          key={i}
          {...pop(0.45 + i * 0.3)}
          className={`absolute flex items-center justify-center rounded-full ${
            n.unlocked
              ? "h-12 w-12 bg-gradient-to-br from-rose-500 to-pink-500 shadow-[0_0_24px_rgba(244,63,94,0.5)]"
              : "h-10 w-10 border border-dashed border-border bg-card/70"
          }`}
          style={{ left: n.x - (n.unlocked ? 24 : 20), top: n.y - (n.unlocked ? 24 : 20) }}
        >
          {n.unlocked ? (
            <Play className="h-5 w-5 fill-white text-white" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
        </motion.div>
      ))}

      <motion.span
        {...pop(0.7)}
        className="absolute rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
        style={{ left: nodes[0].x + 26, top: nodes[0].y + 8 }}
      >
        Start
      </motion.span>
    </div>
  );
}

/** 02 — mini tutor chat: streaming reply + typing indicator. */
function TutorVignette() {
  return (
    <div className="absolute inset-0 flex flex-col p-5">
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 ring-1 ring-violet-400/40">
          <Bot className="h-4 w-4 text-violet-300" />
        </span>
        <span className="text-xs font-medium text-foreground">AI tutor</span>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          streaming
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-end gap-3 pb-1 pt-4">
        <motion.div
          {...rise(0.25)}
          className="self-end rounded-2xl rounded-br-sm bg-cyan-500/15 px-3.5 py-2 text-xs text-cyan-100 ring-1 ring-cyan-400/30"
        >
          Explain the CIA Triad like I&apos;m new to this
        </motion.div>

        <motion.div
          {...rise(0.55)}
          className="max-w-[85%] rounded-2xl rounded-bl-sm bg-card/80 px-3.5 py-2.5 text-xs leading-relaxed text-foreground/90 ring-1 ring-border"
        >
          Think of a bank vault: only tellers get in{" "}
          <span className="text-violet-300">(confidentiality)</span>, the ledger
          can&apos;t be forged <span className="text-violet-300">(integrity)</span>,
          and it opens when you need it…
          <motion.span
            className="ml-0.5 inline-block h-3 w-[2px] translate-y-0.5 bg-violet-300"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.9, repeat: Infinity }}
          />
        </motion.div>

        <motion.div {...rise(0.8)} className="flex gap-1.5 pl-1">
          {["Give me an analogy", "Quiz me"].map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-1 text-[10px] text-violet-200"
            >
              {chip}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/** 03 — mini quiz: the right answer locks in, XP drops. */
function QuizVignette() {
  const options = [
    { label: "Only availability", state: "idle" },
    { label: "Confidentiality, integrity, availability", state: "correct" },
    { label: "Speed and uptime", state: "dim" },
  ];
  return (
    <div className="absolute inset-0 flex flex-col p-5">
      <motion.div {...rise(0.15)} className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300">
          Quiz · Q3/5
        </span>
        <span className="rounded-full border border-border bg-card/70 px-2 py-0.5 text-[10px] text-muted-foreground">
          The CIA Triad
        </span>
      </motion.div>

      <motion.p {...rise(0.3)} className="mt-3 text-sm font-medium text-foreground">
        What does the CIA Triad protect?
      </motion.p>

      <div className="mt-3 flex flex-col gap-2">
        {options.map((o, i) => (
          <motion.div
            key={o.label}
            {...rise(0.45 + i * 0.12)}
            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs ${
              o.state === "correct"
                ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-100"
                : "border-border bg-card/60 text-muted-foreground"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                o.state === "correct"
                  ? "bg-emerald-400 text-emerald-950"
                  : "bg-muted/60 text-muted-foreground"
              }`}
            >
              {o.state === "correct" ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.1, type: "tween", duration: 0.3, ease: EASE }}
                >
                  <Check className="h-3 w-3" />
                </motion.span>
              ) : (
                String.fromCharCode(65 + i)
              )}
            </span>
            {o.label}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.35, duration: 0.4, ease: EASE }}
        className="mt-auto flex items-center justify-between"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
          <Zap className="h-3.5 w-3.5" />
          +25 XP · perfect
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          score 5/5
        </span>
      </motion.div>
    </div>
  );
}

/** 04 — the week lights up: flames, XP bar, rank. */
function HabitVignette() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const litCount = 5;
  return (
    <div className="absolute inset-0 flex flex-col p-5">
      <motion.div {...rise(0.15)} className="flex items-center gap-3">
        <motion.span
          animate={{ scale: [1, 1.12, 1], rotate: [0, -4, 4, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/20 ring-1 ring-orange-400/40 [filter:drop-shadow(0_0_12px_rgba(251,146,60,0.5))]"
        >
          <Flame className="h-6 w-6 text-orange-300" />
        </motion.span>
        <div>
          <div className="text-xl font-bold tabular-nums text-orange-300">
            5-day streak
          </div>
          <div className="text-[10px] text-muted-foreground">
            longest: 12 days
          </div>
        </div>
      </motion.div>

      <div className="mt-4 flex justify-between gap-1.5">
        {days.map((d, i) => (
          <motion.div
            key={i}
            {...pop(0.35 + i * 0.12)}
            className={`flex h-10 w-9 flex-col items-center justify-center gap-0.5 rounded-lg border text-[9px] ${
              i < litCount
                ? "border-orange-400/40 bg-orange-500/15 text-orange-200"
                : "border-dashed border-border bg-card/50 text-muted-foreground/60"
            }`}
          >
            <Flame
              className={`h-3.5 w-3.5 ${i < litCount ? "text-orange-300" : "text-muted-foreground/30"}`}
            />
            {d}
          </motion.div>
        ))}
      </div>

      <motion.div {...rise(1.0)} className="mt-4">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Level 4</span>
          <span className="tabular-nums">380 / 520 XP</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted/50">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "73%" }}
            transition={{ delay: 1.15, duration: 0.9, ease: EASE }}
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.4, ease: EASE }}
        className="mt-auto flex items-center justify-between rounded-xl border border-border bg-card/70 px-3 py-2"
      >
        <span className="flex items-center gap-2 text-[11px] text-foreground">
          <Trophy className="h-3.5 w-3.5 text-amber-300" />
          Weekly leaderboard
        </span>
        <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
          #2 ↑
        </span>
      </motion.div>
    </div>
  );
}

/* ── Reduced-motion fallback ───────────────────────────────────────────── */

function StaticFallback() {
  return (
    <section className="relative px-4 py-24 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-xs uppercase tracking-[0.3em] text-primary">How it works</p>
        <h2 className="mx-auto mt-3 max-w-3xl text-center font-display text-3xl font-bold tracking-tight md:text-5xl">
          From curious to <span className="gradient-text">capable</span>, step by step.
        </h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.k} className="rounded-2xl border border-border/70 bg-card/50 p-6">
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${s.from} ${s.to}`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.copy}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
