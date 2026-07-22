"use client";

/**
 * One-shot terminal boot intro for the Arsenal. Plays a short sequence of
 * "[ ok ]" boot lines on first entry, then reveals its children. Runs once per
 * browser session (sessionStorage guard) so it feels like booting the console,
 * not a gate you fight on every navigation. Reduced-motion and already-booted
 * both skip straight to the content.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const BOOT_LINES = [
  "initializing skillstreak//arsenal",
  "mounting /dev/tools",
  "loading kill-chain modules  [ recon · scan · access · post · report ]",
  "verifying authorization scope",
  "arsenal online",
];

const SESSION_KEY = "arsenal-booted";
const LINE_MS = 260;

export function BootSequence({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  // Assume booted on the server / first client render so hydration matches and
  // the content is never hidden behind an animation that can't run headless.
  const [booted, setBooted] = useState(true);
  const [line, setLine] = useState(BOOT_LINES.length);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const seen =
      typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY);
    if (seen || reduce) return; // stay in the "already booted" state

    // Play the sequence.
    setBooted(false);
    setLine(0);
    let n = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const tick = () => {
      n += 1;
      setLine(n);
      if (n < BOOT_LINES.length) {
        timers.push(setTimeout(tick, LINE_MS));
      } else {
        timers.push(
          setTimeout(() => {
            sessionStorage.setItem(SESSION_KEY, "1");
            setBooted(true);
          }, 420)
        );
      }
    };
    timers.push(setTimeout(tick, LINE_MS));
    return () => timers.forEach(clearTimeout);
  }, [reduce]);

  return (
    <AnimatePresence mode="wait">
      {booted ? (
        <motion.div
          key="content"
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      ) : (
        <motion.div
          key="boot"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="min-h-[40vh] font-mono text-sm leading-relaxed"
          aria-hidden
        >
          <p className="text-emerald-300/80">
            SkillStreak BIOS v0.7 — POST sequence
          </p>
          <div className="mt-3 space-y-1">
            {BOOT_LINES.slice(0, line).map((l, i) => (
              <div key={l} className="flex gap-2 text-emerald-100/80">
                <span className="text-emerald-400">
                  [&nbsp;<span className="term-glow">ok</span>&nbsp;]
                </span>
                <span>{l}</span>
                {i === line - 1 && line < BOOT_LINES.length && (
                  <span className="term-cursor" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
