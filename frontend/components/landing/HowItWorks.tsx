"use client";

/**
 * "How it works" — 3-step process with numbered cards that reveal on scroll.
 * Sits between the BurstSection and the bento features grid to give the
 * landing page a clear narrative: pick → learn → earn.
 */

import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Flame,
  Sparkles,
} from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: <BookOpen className="h-5 w-5 text-rose-300" />,
    title: "Pick a domain",
    body:
      "Browse 9 tech domains. Five come with deeply-curated roadmaps; the others are generated on-demand by the AI tutor.",
    accent: "from-rose-500/15 to-pink-500/10",
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
  {
    n: "02",
    icon: <Bot className="h-5 w-5 text-violet-300" />,
    title: "Learn with the AI tutor",
    body:
      "Open any topic for an instant AI-generated explanation tailored to your level. Ask follow-ups in the streaming chatbot.",
    accent: "from-cyan-500/15 via-violet-500/10 to-violet-500/15",
    badge: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  },
  {
    n: "03",
    icon: <Flame className="h-5 w-5 text-orange-300" />,
    title: "Quiz, earn XP, keep your streak",
    body:
      "5-question MCQs at the end of each topic. Pass 3/5 to mark complete, earn XP, climb levels, and unlock badges.",
    accent: "from-orange-500/15 to-amber-500/10",
    badge: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  },
];

export function HowItWorks() {
  return (
    <section className="relative px-4 py-24 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">
            How it works
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            From <span className="gradient-text">curious</span> to{" "}
            <span className="gradient-text">consistent</span> in three steps.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            One loop. Repeat daily. Watch your streak grow.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3 md:gap-6">
          {STEPS.map((step, i) => (
            <Step key={step.n} step={step} index={i} />
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>That&apos;s it. No 30-tab bookmark folder.</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </section>
  );
}

function Step({
  step,
  index,
}: {
  step: (typeof STEPS)[number];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10"
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity duration-500 group-hover:opacity-100 ${step.accent}`}
      />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${step.badge}`}
          >
            {step.icon}
            Step {step.n}
          </span>
        </div>

        <h3 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
          {step.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground transition-colors duration-300 group-hover:text-foreground/85">
          {step.body}
        </p>
      </div>

      {/* Big faded step number in the corner */}
      <div className="pointer-events-none absolute -right-2 -bottom-6 select-none text-[8rem] font-black leading-none text-foreground/[0.04] transition-colors duration-500 group-hover:text-foreground/[0.08]">
        {step.n}
      </div>
    </motion.div>
  );
}
