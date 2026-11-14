"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { MaskHeading } from "./Reveal";

const TOPICS = 582;

// The supporting facts, read as a spec sheet rather than four equal tiles.
const FACTS = [
  {
    value: "9",
    label: "domains",
    detail: "Cybersecurity, web, AI, ML, data science, cloud, DevOps, blockchain and IoT.",
  },
  {
    value: "5",
    label: "questions per topic",
    detail: "Written by the AI, checked by a second pass. Get three right and the topic counts.",
  },
  {
    value: "37",
    label: "tools in the Arsenal",
    detail: "Nmap, Burp, Metasploit and the rest, each with its own field guide.",
  },
  {
    value: "8",
    label: "badges",
    detail: "For streaks, perfect quizzes and the first topic you finish.",
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * What's inside: one number carries the section (the topic count, which
 * counts up once), and the rest sit beside it as a hairline spec sheet.
 * One colour, no tiles, so it reads as a quiet beat between the hero and
 * the scroll story.
 */
export function StatsBanner() {
  const reduce = useReducedMotion();
  const [counting, setCounting] = useState(false);
  const topics = useCountUp(TOPICS, counting, 1300);

  return (
    <section className="relative px-4 py-20 lg:px-12 lg:py-28">
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-12 grid gap-5 md:grid-cols-[1.3fr_1fr] md:items-end">
          <MaskHeading line="left" className="font-display text-4xl leading-[1.05] [text-wrap:balance] md:text-6xl">
            What&apos;s inside, from{" "}
            <span className="font-serif-accent text-primary text-glow">day one.</span>
          </MaskHeading>
          <motion.p
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : 0.25, ease: EASE }}
            className="max-w-sm text-[15px] leading-relaxed text-muted-foreground md:justify-self-end md:pb-8 md:text-base"
          >
            Nothing sits behind a paywall. Sign up and all nine roadmaps are yours to start.
          </motion.p>
        </div>

        <div className="grid gap-10 border-t border-white/[0.08] pt-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            onViewportEnter={() => setCounting(true)}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: reduce ? 0 : 0.6, ease: EASE }}
          >
            <p className="font-display text-[clamp(5.5rem,17vw,11rem)] leading-[0.82] tabular-nums text-foreground">
              {topics}
            </p>
            <p className="mt-5 max-w-xs text-lg leading-snug text-foreground">
              topics, in the order you should learn them.
            </p>
            <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-muted-foreground">
              Each one is a lesson, a tutor you can interrupt, and a quiz at the end.
            </p>
          </motion.div>

          <dl>
            {FACTS.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : i * 0.06, ease: EASE }}
                className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-baseline gap-x-4 border-b border-white/[0.08] py-5 first:pt-0 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-x-6"
              >
                <dt>
                  <span className="block text-base font-semibold text-foreground">{f.label}</span>
                  <span className="mt-1 block text-[15px] leading-relaxed text-muted-foreground">{f.detail}</span>
                </dt>
                <dd className="order-first font-display text-4xl leading-none tabular-nums text-foreground sm:text-5xl">
                  {f.value}
                </dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

// rAF count-up triggered when `start` flips true. Honors reduced-motion.
function useCountUp(target: number, start: boolean, durationMs: number): number {
  const reduce = useReducedMotion();
  const [v, setV] = useState(0);

  useEffect(() => {
    if (!start) return;
    if (reduce) {
      setV(target);
      return;
    }
    const startTime = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - p, 4);
      setV(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, durationMs, reduce]);

  return v;
}
