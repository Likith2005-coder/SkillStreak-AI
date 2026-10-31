"use client";

/**
 * "Did you know?" — a small rotating fact for the learner's current domain.
 * Static, hand-picked list (no LLM call per page load). Auto-advances every
 * 10s while visible and not hovered; under reduced motion it stays put and
 * the "Next" button swaps instantly.
 */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, RefreshCw } from "lucide-react";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const TIPS: Record<string, string[]> = {
  "web-development": [
    "The first website ever made, info.cern.ch from 1991, is still online and still loads.",
    "A <button> gets keyboard focus, Enter and Space support for free. A clickable <div> gets none of it.",
    "HTTP/3 runs over UDP, not TCP, so one lost packet no longer stalls every other request.",
    "CSS `gap` works in flexbox too, not just grid. No more margin hacks on the last child.",
  ],
  cybersecurity: [
    "\"123456\" has topped leaked-password lists for over a decade.",
    "Many breaches start with a person, not an exploit: phishing remains one of the most common ways in.",
    "The CIA triad is Confidentiality, Integrity and Availability. Every control protects at least one.",
    "A hash is one-way; encryption is two-way. Passwords should be hashed (with a salt), never encrypted.",
  ],
  "artificial-intelligence": [
    "The term \"artificial intelligence\" was coined in 1956 for a summer workshop at Dartmouth.",
    "Large language models predict the next token. Everything else they do falls out of that one task.",
    "AlphaGo's famous move 37 in 2016 was one it estimated a human would play only 1 time in 10,000.",
    "A model's \"temperature\" controls randomness: 0 is near-deterministic, higher values get creative.",
  ],
  "machine-learning": [
    "If your model scores 99% on training data and 60% on test data, it memorised rather than learned.",
    "Gradient descent just walks downhill on the loss surface, one small step at a time.",
    "Most real ML time goes into cleaning and labelling data, not choosing the model.",
    "A random forest is many decision trees voting; the crowd beats any single tree.",
  ],
  "data-science": [
    "Anscombe's quartet: four datasets with identical means and correlations that look nothing alike when plotted.",
    "Correlation is not causation: ice-cream sales and shark attacks both rise in summer.",
    "The median resists outliers; the mean doesn't. One billionaire moves the mean salary of a town.",
    "Pandas got its name from \"panel data\", an econometrics term.",
  ],
  "cloud-computing": [
    "\"The cloud\" is someone else's data centre, rented by the second.",
    "Availability zones are separate buildings with their own power, so one fire can't take you down.",
    "Serverless still has servers; you just never patch or scale them yourself.",
    "Egress (data leaving the cloud) is usually what surprises people on the bill.",
  ],
  devops: [
    "Docker containers share the host's kernel, which is why they start in milliseconds and VMs don't.",
    "Elite teams deploy many times a day; small changes are easier to ship and to roll back.",
    "\"Works on my machine\" is the bug that containers were invented to kill.",
    "Infrastructure as code means your servers get code review, history and rollbacks too.",
  ],
  blockchain: [
    "Bitcoin's first block (the genesis block) quotes a 2009 newspaper headline about bank bailouts.",
    "A blockchain is an append-only ledger; each block stores the hash of the one before it.",
    "Smart contracts are just programs that run on every node, so every line costs gas.",
    "Proof of stake cut Ethereum's energy use by roughly 99.9% after the 2022 Merge.",
  ],
  iot: [
    "There are now more connected IoT devices on Earth than people.",
    "MQTT, a common IoT protocol, was designed in 1999 to monitor oil pipelines over satellite.",
    "Default passwords on cameras and routers powered the Mirai botnet, which knocked big sites offline in 2016.",
    "Edge computing processes data on the device so it doesn't have to round-trip to the cloud.",
  ],
};

const GENERIC = [
  "Testing yourself beats re-reading: recall practice is one of the best-proven ways to remember.",
  "Spacing practice over days beats cramming the same hours in one sitting.",
  "Explaining a topic in your own words (the Feynman technique) shows exactly where the gaps are.",
  "Mistakes you correct stick better than answers you got right the first time.",
];

export function TipCard({ domainSlug, domainName, className }: { domainSlug?: string; domainName?: string; className?: string }) {
  const reduce = useReducedMotionSafe();
  const tips = useMemo(() => (domainSlug && TIPS[domainSlug]) || GENERIC, [domainSlug]);
  // Start on a day-dependent tip so each visit isn't the same first line.
  const [i, setI] = useState(() => new Date().getDate() % tips.length);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduce || paused) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") setI((n) => (n + 1) % tips.length);
    }, 10000);
    return () => window.clearInterval(id);
  }, [reduce, paused, tips.length]);

  return (
    <section
      className={cn("card-chunky spotlight flex flex-col p-5 [--spot:var(--grape)]", className)}
      aria-labelledby="tip-h"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex items-center justify-between gap-3">
        <span aria-hidden className="grid h-10 w-10 place-items-center rounded-lg bg-grape/10 text-grape ring-1 ring-grape/25">
          <Lightbulb className="h-5 w-5" />
        </span>
        <button
          type="button"
          onClick={() => setI((n) => (n + 1) % tips.length)}
          className="focus-ring group inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw
            className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90 motion-reduce:transition-none"
            aria-hidden
          />
          Next
        </button>
      </div>
      <p id="tip-h" className="label-mono mt-4 truncate text-grape">{domainName ? `${domainName} · ` : ""}Did you know?</p>
      <div className="relative mt-2 min-h-[6.5rem] flex-1" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={`${domainSlug}-${i}`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, filter: "blur(4px)" }}
            transition={{ duration: reduce ? 0.1 : 0.35, ease: EASE }}
            className="font-display text-lg leading-snug text-foreground [text-wrap:pretty]"
          >
            {tips[i % tips.length]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="mt-4 flex gap-1.5" aria-hidden>
        {tips.map((_, k) => (
          <span
            key={k}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              k === i % tips.length ? "bg-grape shadow-[0_0_8px_hsl(var(--grape)/0.8)]" : "bg-white/10",
            )}
          />
        ))}
      </div>
    </section>
  );
}
