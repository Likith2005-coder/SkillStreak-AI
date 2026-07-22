"use client";

/**
 * Landing-page dramatic CTA reveal — final design.
 *
 * Layout (always in this order, top → bottom inside h-screen section):
 *
 *   ┌─────────────────────────────────────────────┐
 *   │  SkillStreak AI  ← wordmark, always visible │
 *   │  Free forever · Built for students · …      │
 *   │                                             │
 *   │  Sparkles                                   │
 *   │  Start learning, the smart way.             │
 *   │  Subtitle copy                              │
 *   │  [ Get started ] [ I already have account ] │
 *   │  • Free • Students • 60-second signup       │
 *   └─────────────────────────────────────────────┘
 *
 * Both the wordmark and the CTA are permanently rendered. Scrolling up shows
 * the wordmark just as readily as scrolling down. The burst circle expands
 * BEHIND both, originating from the measured "a" position so it visually
 * emerges from the letter.
 *
 * Why no scroll-pinning anymore:
 *   The earlier sticky-pinned approach kept producing windows where nothing
 *   was visible (just a gradient with no text), and scroll-up didn't reveal
 *   the wordmark again. Switched to a purely time-based, in-view-triggered
 *   choreography that replays whenever the section re-enters view.
 *
 * Timeline (all triggered by `useInView` with `once: false`):
 *   0.00 → 0.70s  Wordmark fades in from below (translateY 60 → 0).
 *   0.40 → 0.95s  The "a" letter scale-bounces (1 → 1.18 → 1) — the "pop".
 *   0.90 → 1.70s  Burst circle scales 0 → 1.4 from the measured "a" position.
 *   1.30 → 1.85s  CTA fades in BELOW the wordmark.
 */

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { HeroCTA } from "./HeroCTA";
import { MeshText } from "./MeshText";

export function BurstSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const aRef = useRef<HTMLSpanElement | null>(null);
  const reduce = useReducedMotion();

  // Trigger only when the section is roughly centred in the viewport, so the
  // user actually sees the burst happen — not finishes off-screen as they're
  // still scrolling toward it. `amount: 0.55` ≈ half the section visible;
  // `once: true` because once the user has seen the reveal we don't want to
  // replay it every time they scroll back.
  const isInView = useInView(sectionRef, { once: true, amount: 0.55 });

  const [origin, setOrigin] = useState({ x: 50, y: 30 });

  // Measure the "a" position relative to the section. Re-measure on resize,
  // and once after the wordmark has settled so the burst really bursts from
  // the letter the user can see.
  useEffect(() => {
    function measure() {
      if (!aRef.current || !sectionRef.current) return;
      const aRect = aRef.current.getBoundingClientRect();
      const sectionRect = sectionRef.current.getBoundingClientRect();
      const x =
        ((aRect.left + aRect.width / 2 - sectionRect.left) / sectionRect.width) *
        100;
      const y =
        ((aRect.top + aRect.height / 2 - sectionRect.top) / sectionRect.height) *
        100;
      setOrigin({ x, y });
    }
    const t1 = setTimeout(measure, 200);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t1);
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    if (!isInView) return;
    const t = setTimeout(() => {
      if (!aRef.current || !sectionRef.current) return;
      const aRect = aRef.current.getBoundingClientRect();
      const sectionRect = sectionRef.current.getBoundingClientRect();
      const x =
        ((aRect.left + aRect.width / 2 - sectionRect.left) / sectionRect.width) *
        100;
      const y =
        ((aRect.top + aRect.height / 2 - sectionRect.top) / sectionRect.height) *
        100;
      setOrigin({ x, y });
    }, 700);
    return () => clearTimeout(t);
  }, [isInView]);

  const reduced = reduce ?? false;
  const animate = isInView || reduced;

  return (
    <section
      ref={sectionRef}
      className="relative flex h-screen w-full items-center justify-center overflow-hidden"
    >
      {/* Smooth fade at the top + bottom edges so the gradient blends into
          adjacent dark sections instead of meeting them at a hard line. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-30 h-24 bg-gradient-to-b from-background to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-24 bg-gradient-to-t from-background to-transparent"
        aria-hidden
      />
      {/* ── Burst circle — behind everything (z-0). Centre = measured "a".
          Animates simultaneously with the wordmark so there's never a
          moment where the wordmark sits alone on a dark background. */}
      <motion.div
        initial={{ scale: reduced ? 1.4 : 0 }}
        animate={{ scale: animate ? 1.4 : 0 }}
        transition={{
          delay: reduced ? 0 : 0.05,
          duration: reduced ? 0 : 0.8,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="pointer-events-none absolute z-0 rounded-full will-change-transform"
        style={{
          width: "140vmax",
          height: "140vmax",
          left: `calc(${origin.x}% - 70vmax)`,
          top: `calc(${origin.y}% - 70vmax)`,
          transformOrigin: "center",
          contain: "paint",
          // Soft ambient bloom instead of a solid disc — the section stays dark
          // and cinematic; the glow just emanates from the "a".
          background:
            "radial-gradient(circle, hsl(265 85% 60% / 0.30) 0%, hsl(190 92% 52% / 0.12) 30%, transparent 60%)",
        }}
        aria-hidden
      />

      {/* ── Foreground stack: wordmark (always visible) + CTA (fades in) ── */}
      <div className="relative z-10 flex max-h-full w-full flex-col items-center gap-8 overflow-y-auto px-4 py-10 text-center sm:gap-10 lg:gap-12">
        {/* Wordmark — fades in once, stays put forever after */}
        <motion.div
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 40 }}
          animate={{ opacity: animate ? 1 : 0, y: animate ? 0 : 40 }}
          transition={{
            delay: reduced ? 0 : 0.15,
            duration: reduced ? 0 : 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="flex flex-col items-center"
        >
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-white/80 drop-shadow">
            Ready when you are
          </p>
          {/* WebGL mesh wordmark — glyphs are a fine mesh the cursor drags
              through, springing back with a cyan/violet chromatic fringe. The
              aRef sits on it so the burst glow still emanates from the mark. */}
          <span
            ref={aRef}
            className="block h-[18vw] w-full max-w-[1500px] drop-shadow-lg sm:h-[15vw] lg:h-[13vw]"
          >
            <MeshText text="SkillStreak AI" />
          </span>
          <p className="mt-3 text-sm text-white/85 sm:text-base">
            Free forever · Built for students · Pick up where you left off
          </p>
        </motion.div>

        {/* CTA — fades in below the wordmark, both visible together */}
        <motion.div
          initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          animate={{
            opacity: animate ? 1 : 0,
            y: animate ? 0 : 30,
          }}
          transition={{
            delay: reduced ? 0 : 0.7,
            duration: reduced ? 0 : 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="flex w-full max-w-2xl flex-col items-center text-white"
        >
          <Sparkles className="h-8 w-8 drop-shadow-lg" />
          <h3 className="mt-3 font-display text-2xl font-bold tracking-tight drop-shadow-lg sm:text-3xl lg:text-4xl">
            Start learning, the smart way.
          </h3>
          <p className="mt-3 max-w-xl text-sm text-white/90 sm:text-base">
            Join the platform that adapts to your level, recommends your next
            move, and keeps you accountable.
          </p>

          <div className="mt-6">
            <HeroCTA />
          </div>

          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/75">
            <li className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Free forever
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Built for students
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Sign up in 60 seconds
            </li>
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
