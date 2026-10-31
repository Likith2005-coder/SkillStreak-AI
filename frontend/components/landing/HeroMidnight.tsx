"use client";

/**
 * The landing hero, Midnight edition.
 *
 * Three layers of light and one object:
 *   1. a live WebGL aurora across the top of the page (AuroraShader)
 *   2. a faint engineering grid and film grain over it
 *   3. a big, tight headline whose one serif word glows volt
 *   and the object: a floating preview of the real product that lies tilted
 *   back in space and swings upright as you scroll into it.
 *
 * The entrance waits for the boot intro to lift (introBus); reduced motion
 * gets everything in place, still.
 */

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform, type Variants } from "framer-motion";
import { Link } from "next-view-transitions";
import { ArrowRight, Check, Flame, Gem, Sparkles, Star, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { AuroraShader } from "./AuroraShader";
import { SignalBotLive } from "@/components/3d/SignalBotLive";
import { RotatingWord } from "./RotatingWord";
import { useIntroDone } from "./introBus";

const EASE = [0.22, 1, 0.36, 1] as const;

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };
const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

export function HeroMidnight() {
  const reduce = useReducedMotionSafe();
  const introDone = useIntroDone();
  const show = introDone || reduce;

  // The preview swings from lying back (rotateX) to upright as it scrolls in.
  const stage = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: stage, offset: ["start end", "start 0.25"] });
  const eased = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });
  const rotateX = useTransform(eased, [0, 1], [28, 0]);
  const scale = useTransform(eased, [0, 1], [0.9, 1]);
  const lift = useTransform(eased, [0, 1], [40, 0]);

  return (
    <section className="relative overflow-hidden">
      {/* ── Light ─────────────────────────────────────────── */}
      <AuroraShader className="absolute inset-x-0 top-0 h-[115svh]" />
      <div aria-hidden className="grid-faint pointer-events-none absolute inset-x-0 top-0 h-[110svh]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[70svh] h-[45svh] bg-gradient-to-b from-transparent to-background" />
      {/* a soft dark pool behind the copy keeps body text legible over the light */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[34svh] h-[46svh] w-[min(56rem,100vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--background)/0.78),transparent)]" />

      {/* ── Copy ──────────────────────────────────────────── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate={show ? "show" : "hidden"}
        className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 pt-40 text-center sm:pt-48"
      >
        <motion.h1
          variants={rise}
          className="font-display text-[clamp(2.5rem,8vw,6rem)] leading-[0.95] text-foreground [text-wrap:balance]"
        >
          Master{" "}
          <RotatingWord
            className="text-foreground"
            words={["tech", "Cyber", "Web Dev", "AI", "ML", "Data", "Cloud", "DevOps", "Web3", "IoT"]}
          />
          <br />
          {/* Phones break after "streak" so the line never ends on a lone "time." */}
          one <span className="font-serif-accent text-glow pr-1 text-primary">streak</span>{" "}
          <br className="sm:hidden" />
          at a time.
        </motion.h1>

        <motion.p
          variants={rise}
          className="mt-7 max-w-[34rem] text-[17px] leading-relaxed text-foreground/80 [text-wrap:pretty]"
        >
          Roadmaps for nine tech domains, an AI tutor that teaches at your level, and quizzes that
          prove it. The streak makes tomorrow easy.
        </motion.p>

        <motion.div variants={rise} className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/register">
              Start learning free <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link href="/login">I have an account</Link>
          </Button>
        </motion.div>

        <motion.p variants={rise} className="mt-8 text-sm text-muted-foreground [text-wrap:balance]">
          9 domains · 580+ topics · AI-checked quizzes · free forever
        </motion.p>
      </motion.div>

      {/* ── The object: a live-looking product preview ───── */}
      <div ref={stage} className="relative z-10 mx-auto mt-16 max-w-6xl px-4 pb-24 sm:mt-20 [perspective:1800px]">
        {/* light pool the preview floats in */}
        <div aria-hidden className="pointer-events-none absolute inset-x-[10%] -top-10 h-56 rounded-full bg-[radial-gradient(closest-side,hsl(var(--aurora-2)/0.35),transparent)] blur-2xl" />
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
          transition={{ duration: reduce ? 0 : 1.1, delay: reduce ? 0 : 0.45, ease: EASE }}
          className="relative"
        >
          {/* SignalBot hovers at the window's corner and watches the visitor:
              follows the cursor, glances at the buttons, boings when clicked. */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24, scale: 0.6 }}
            animate={show ? { opacity: 1, y: 0, scale: 1 } : undefined}
            transition={{ type: "spring", duration: 0.7, bounce: 0.35, delay: reduce ? 0 : 1.1 }}
            className="absolute -top-[5.5rem] right-4 z-20 h-28 w-28 sm:-top-[7.5rem] sm:right-12 sm:h-36 sm:w-36"
          >
            <div className="anim-bob-6 h-full w-full">
              <SignalBotLive className="h-full w-full" label="SignalBot, your AI tutor. Click me!" />
            </div>
          </motion.div>
          <motion.div
            style={reduce ? undefined : { rotateX, scale, y: lift, transformOrigin: "50% 0%" }}
            className="will-change-transform"
          >
            <ProductPreview />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* A faithful, decorative miniature of the dashboard. aria-hidden: it is an
   illustration of the product, the real thing is one click away. */
function ProductPreview() {
  return (
    <div
      aria-hidden
      className="border-beam overflow-hidden rounded-2xl border border-white/10 bg-[hsl(228_18%_5%)] shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9),0_0_0_1px_rgb(255_255_255/0.04)]"
    >
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="label-mono ml-3 hidden text-muted-foreground sm:inline">skillstreak.ai/dashboard</span>
        <div className="ml-auto flex items-center gap-3 font-mono text-xs tabular-nums">
          <span className="flex items-center gap-1 text-energy"><Flame className="h-3.5 w-3.5" fill="currentColor" />12</span>
          <span className="flex items-center gap-1 text-xp"><Gem className="h-3.5 w-3.5" />2,340</span>
          <span className="hidden items-center gap-1 text-grape sm:flex"><Star className="h-3.5 w-3.5" fill="currentColor" />Lv 7</span>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1.6fr_1fr]">
        {/* continue panel */}
        <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.22),transparent)]" />
          <p className="label-mono text-muted-foreground">Cybersecurity · next up</p>
          <p className="font-display mt-2 text-2xl text-foreground sm:text-3xl">Threat Modeling with STRIDE</p>
          <div className="mt-4 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full w-[62%] rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.7)]" />
          </div>
          <p className="mt-2 font-mono text-xs tabular-nums text-muted-foreground">37 / 60 topics</p>

          {/* the path */}
          <div className="relative mt-6 flex items-center gap-0">
            {["done", "done", "done", "current", "next", "next"].map((s, i) => (
              <div key={i} className="flex flex-1 items-center last:flex-none">
                <span
                  className={
                    s === "done"
                      ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_14px_hsl(var(--primary)/0.6)]"
                      : s === "current"
                        ? "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary/15 text-primary shadow-[0_0_28px_hsl(var(--primary)/0.7)]"
                        : "h-8 w-8 shrink-0 rounded-full border border-white/10 bg-white/[0.03]"
                  }
                >
                  {s === "done" && <Check className="h-4 w-4" strokeWidth={3} />}
                  {s === "current" && <Sparkles className="h-4 w-4" />}
                </span>
                {i < 5 && (
                  <span className={`h-[2px] flex-1 ${i < 3 ? "bg-primary/70 shadow-[0_0_8px_hsl(var(--primary)/0.6)]" : "bg-white/[0.08]"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* rail */}
        <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">12-day streak</p>
              <Flame className="h-4 w-4 text-energy drop-shadow-[0_0_8px_hsl(var(--energy))]" fill="currentColor" />
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1.5">
              {[1, 1, 1, 1, 1, 1, 1].map((on, i) => (
                <span
                  key={i}
                  className={
                    on
                      ? "h-2 rounded-full bg-energy shadow-[0_0_10px_hsl(var(--energy)/0.7)]"
                      : "h-2 rounded-full bg-white/[0.08]"
                  }
                />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Level 7</p>
              <p className="font-mono text-xs tabular-nums text-grape">2,340 / 2,800 XP</p>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-[84%] rounded-full bg-grape shadow-[0_0_12px_hsl(var(--grape)/0.7)]" />
            </div>
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-[#04070a] px-3 py-2 font-mono text-[11px] text-emerald-300">
              <Terminal className="h-3.5 w-3.5" /> $ arsenal --unlock
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
