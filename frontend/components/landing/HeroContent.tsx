"use client";

/**
 * Cinematic hero text column.
 *
 * - Line-mask headline reveal (each line slides up from behind a clip).
 * - Staggered blur-in entrance for the badge, subtitle, pills, scroll hint.
 * - Scroll-linked parallax: the whole column drifts up + fades as you scroll
 *   past it, for a filmic exit.
 *
 * The interactive Spline robot lives in a separate column and is untouched.
 */

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  Bot,
  ChevronDown,
  Flame,
  ListChecks,
  Trophy,
} from "lucide-react";
import { RotatingWord } from "./RotatingWord";
import { useIntroDone } from "./introBus";

const EASE = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
};

export function HeroContent() {
  const reduce = useReducedMotion();
  // Hold the entrance until the boot intro starts lifting its curtain, so
  // the choreography plays in view instead of hidden behind the overlay.
  const introDone = useIntroDone();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <motion.div
      ref={ref}
      style={reduce ? undefined : { y, opacity }}
      className="relative z-10 text-center lg:text-left"
    >
      <motion.div
        variants={container}
        initial="hidden"
        animate={introDone || reduce ? "show" : "hidden"}
      >
        <motion.div
          variants={item}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          AI-powered learning, reimagined
        </motion.div>

        <motion.h1
          variants={item}
          className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl xl:text-7xl"
        >
          <span className="block">
            Master{" "}
            <RotatingWord
              className="gradient-text animate-gradient"
              words={[
                "tech",
                "Cyber",
                "Web Dev",
                "AI",
                "ML",
                "Data",
                "Cloud",
                "DevOps",
                "Web3",
                "IoT",
              ]}
            />
          </span>
          <span className="block">
            one{" "}
            <span className="text-lime-300 [text-shadow:0_0_28px_hsl(84_85%_62%/0.45)]">
              streak
            </span>{" "}
            at a time.
          </span>
        </motion.h1>

        <motion.p
          variants={item}
          className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg lg:mx-0"
        >
          9 domains, 5 deep curated roadmaps, a streaming AI chatbot, AI-generated
          quizzes, and gamified daily streaks — all in one platform.
        </motion.p>

        <motion.ul
          variants={item}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground lg:justify-start"
        >
          <Pill icon={<Bot className="h-3.5 w-3.5 text-primary" />}>AI chatbot</Pill>
          <Pill icon={<ListChecks className="h-3.5 w-3.5 text-emerald-400" />}>MCQ quizzes</Pill>
          <Pill icon={<Flame className="h-3.5 w-3.5 text-orange-400" />}>Daily streaks</Pill>
          <Pill icon={<Trophy className="h-3.5 w-3.5 text-amber-400" />}>Leaderboard</Pill>
        </motion.ul>

        <motion.div
          variants={item}
          className="mt-10 flex items-center justify-center gap-3 text-sm text-muted-foreground lg:justify-start"
        >
          <ChevronDown className="h-4 w-4 animate-nudge motion-reduce:animate-none" />
          <span>Scroll to begin</span>
        </motion.div>
      </motion.div>
    </motion.div>
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
