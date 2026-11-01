"use client";

/**
 * The landing hero, Midnight edition: one full screen of light and type.
 *
 *   1. a live WebGL aurora across the page (AuroraShader; CSS light on phones)
 *   2. a faint engineering grid and a dark pool that keeps the copy legible
 *   3. a big, tight headline whose one serif word glows volt
 *
 * Opening (once the boot intro lifts, via introBus): the aurora brightens in,
 * the headline words rise out of a blur one after another (~70ms apart), the
 * serif "streak" glows on last, then the subhead, CTAs and facts follow.
 *
 * Exit: as the visitor scrolls past, the copy scales back (1 → 0.94), lifts
 * and fades while the aurora dims — the camera pulling away. Scroll-linked
 * motion values only (transform/opacity), no per-frame React renders.
 *
 * Reduced motion: everything in place and still, no scroll cue.
 */

import { useRef } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { Link } from "next-view-transitions";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { AuroraShader } from "./AuroraShader";
import { RotatingWord } from "./RotatingWord";
import { useIntroDone } from "./introBus";

const EASE = [0.22, 1, 0.36, 1] as const;
const WORD_STAGGER = 0.07;
const WORDS = 6; // Master · [rotating] · one · streak · at · a time.
const AFTER_WORDS = 0.12 + WORDS * WORD_STAGGER; // when the headline has landed

// Reduced motion: the same targets with no travel time, so nothing waits.
const headlineV = (reduce: boolean): Variants => ({
  hidden: {},
  show: { transition: reduce ? {} : { staggerChildren: WORD_STAGGER, delayChildren: 0.12 } },
});
// Each word rises out of a blur. The filter is dropped once it lands so the
// settled headline keeps no extra layers.
const wordV = (reduce: boolean): Variants => ({
  hidden: { opacity: 0, y: "0.42em", filter: "blur(14px)" },
  show: {
    opacity: 1,
    y: "0em",
    filter: "blur(0px)",
    transition: reduce ? { duration: 0 } : { duration: 0.9, ease: EASE },
    transitionEnd: { filter: "none" },
  },
});
const followV = (delay: number, reduce: boolean): Variants => ({
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: reduce ? { duration: 0 } : { duration: 0.85, delay, ease: EASE } },
});

export function HeroMidnight() {
  const reduce = useReducedMotionSafe();
  const introDone = useIntroDone();
  const show = introDone || reduce;
  const state = show ? "show" : "hidden";
  const headline = headlineV(reduce);
  const word = wordV(reduce);
  const follow = (delay: number) => followV(delay, reduce);

  // Scroll-out: 0 with the hero at the top, 1 once it has left the screen.
  const hero = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: hero, offset: ["start start", "end start"] });
  const copyScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const lightOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0.25]);
  const lightScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  return (
    <section ref={hero} className="relative isolate flex min-h-[100svh] flex-col overflow-hidden" aria-labelledby="hero-h">
      {/* ── Light: brightens in on the opening, dims as the camera pulls back ── */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 will-change-transform"
        style={reduce ? undefined : { opacity: lightOpacity, scale: lightScale }}
      >
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: show ? 1 : 0.3 }}
          transition={{ duration: reduce ? 0 : 1.8, ease: EASE }}
        >
          <AuroraShader className="absolute inset-x-0 top-0 h-[108%]" />
        </motion.div>
        <div className="grid-faint absolute inset-0" />
      </motion.div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[38%] bg-gradient-to-b from-transparent to-background" />
      {/* a soft dark pool behind the copy keeps body text legible over the light */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[62svh] w-[min(60rem,110vw)] -translate-x-1/2 -translate-y-[42%] rounded-full bg-[radial-gradient(closest-side,hsl(var(--background)/0.8),transparent)]" />

      {/* ── Copy: vertically centred in the first screen ── */}
      <motion.div
        style={reduce ? undefined : { scale: copyScale, y: copyY, opacity: copyOpacity }}
        className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 pb-24 pt-28 text-center will-change-transform sm:pb-28 sm:pt-24"
      >
        <motion.h1
          id="hero-h"
          variants={headline}
          initial="hidden"
          animate={state}
          className="font-display text-[clamp(2.5rem,8vw,6rem)] leading-[0.95] text-foreground [text-wrap:balance]"
        >
          <motion.span variants={word} className="inline-block">
            Master
          </motion.span>{" "}
          <motion.span variants={word} className="inline-block">
            <RotatingWord
              className="text-foreground"
              words={["tech", "Cyber", "Web Dev", "AI", "ML", "Data", "Cloud", "DevOps", "Web3", "IoT"]}
            />
          </motion.span>
          <br />
          <motion.span variants={word} className="inline-block">
            one
          </motion.span>{" "}
          {/* "streak" lands with the others, then its glow comes on last. */}
          <motion.span variants={word} className="relative inline-block pr-1 font-serif-accent text-primary">
            streak
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0 pr-1 text-primary [text-shadow:0_0_22px_hsl(var(--primary)/0.75),0_0_60px_hsl(var(--primary)/0.35)]"
              initial={{ opacity: 0 }}
              animate={show ? { opacity: reduce ? 0.8 : [0, 1, 0.8] } : { opacity: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 1.4, delay: AFTER_WORDS + 0.25, times: [0, 0.45, 1], ease: "easeOut" }}
            >
              streak
            </motion.span>
          </motion.span>{" "}
          {/* Phones break after "streak" so the line never ends on a lone "time." */}
          <br className="sm:hidden" />
          <motion.span variants={word} className="inline-block">
            at
          </motion.span>{" "}
          <motion.span variants={word} className="inline-block">
            a time.
          </motion.span>
        </motion.h1>

        <motion.p
          variants={follow(AFTER_WORDS + 0.1)}
          initial="hidden"
          animate={state}
          className="mt-7 max-w-[34rem] text-[17px] leading-relaxed text-foreground/80 [text-wrap:pretty]"
        >
          Roadmaps for nine tech domains, an AI tutor that teaches at your level, and quizzes that
          prove it. The streak makes tomorrow easy.
        </motion.p>

        <motion.div
          variants={follow(AFTER_WORDS + 0.22)}
          initial="hidden"
          animate={state}
          data-bot-avoid=""
          className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
        >
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/register">
              Start learning free <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link href="/login">I have an account</Link>
          </Button>
        </motion.div>

        <motion.p
          variants={follow(AFTER_WORDS + 0.34)}
          initial="hidden"
          animate={state}
          className="mt-8 text-sm text-muted-foreground [text-wrap:balance]"
        >
          9 domains · 580+ topics · AI-checked quizzes · free forever
        </motion.p>
      </motion.div>

      {/* ── Scroll cue: a drop of light running down a hairline ── */}
      {!reduce && (
        <motion.div
          aria-hidden
          style={{ opacity: cueOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-2.5 sm:bottom-8"
        >
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.8, delay: AFTER_WORDS + 0.9, ease: EASE }}
            className="flex flex-col items-center gap-2.5"
          >
            <span className="label-mono uppercase text-muted-foreground">Scroll</span>
            <span className="relative block h-11 w-px overflow-hidden bg-white/[0.12]">
              <span className="scroll-cue-drop absolute inset-x-0 top-0 h-1/2 bg-[linear-gradient(180deg,transparent,hsl(var(--primary)))] shadow-[0_0_8px_hsl(var(--primary))]" />
            </span>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
