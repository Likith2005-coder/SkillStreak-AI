"use client";

/**
 * The landing page's light moment.
 *
 * A full-bleed dark band where an aurora (violet → blue → cyan → volt)
 * blooms out of the giant "SkillStreak AI" wordmark, with a horizon of light
 * running under it and the sign-up CTA rising beneath.
 *
 * Layout (top → bottom, inside a min-h-[100svh] section):
 *   wordmark (WebGL mesh on desktop, real type below) · tagline
 *   horizon line
 *   "Your first streak is one click away." · copy · CTAs · reassurance row
 *
 * Choreography (triggered once by `useInView`, amount 0.55):
 *   0.00 → 0.80s  Aurora bloom scales 0 → 1 from the measured "a" position.
 *   0.15 → 0.75s  Wordmark rises in.
 *   0.45 → 1.35s  Horizon line draws outward from the centre.
 *   0.70 → 1.20s  CTA block rises in below.
 *
 * No scroll pinning: an in-view, time-based reveal can never leave a window
 * where nothing is visible, and the wordmark stays put once shown.
 */

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { HeroCTA } from "./HeroCTA";
import { MeshText } from "./MeshText";
import { useIsDesktop } from "@/hooks/useIsDesktop";

const EASE = [0.22, 1, 0.36, 1] as const;

export function BurstSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const aRef = useRef<HTMLSpanElement | null>(null);
  const reduce = useReducedMotion();

  const isInView = useInView(sectionRef, { once: true, amount: 0.55 });

  // The build-up: while the finale scrolls into view, the light gathers
  // (scroll-linked) so the bloom lands as the climax rather than a surprise.
  const { scrollYProgress: approach } = useScroll({ target: sectionRef, offset: ["start end", "start start"] });
  const gatherOpacity = useTransform(approach, [0, 0.85], [0, 1]);
  const gatherScale = useTransform(approach, [0, 1], [0.7, 1.05]);
  const gatherY = useTransform(approach, [0, 1], ["18%", "0%"]);

  const [origin, setOrigin] = useState({ x: 50, y: 30 });

  // Measure the wordmark centre relative to the section, so the bloom really
  // grows out of the mark the user can see. Re-measure on resize and once the
  // wordmark has settled.
  useEffect(() => {
    function measure() {
      if (!aRef.current || !sectionRef.current) return;
      const aRect = aRef.current.getBoundingClientRect();
      const sectionRect = sectionRef.current.getBoundingClientRect();
      const x = ((aRect.left + aRect.width / 2 - sectionRect.left) / sectionRect.width) * 100;
      const y = ((aRect.top + aRect.height / 2 - sectionRect.top) / sectionRect.height) * 100;
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
      const x = ((aRect.left + aRect.width / 2 - sectionRect.left) / sectionRect.width) * 100;
      const y = ((aRect.top + aRect.height / 2 - sectionRect.top) / sectionRect.height) * 100;
      setOrigin({ x, y });
    }, 700);
    return () => clearTimeout(t);
  }, [isInView]);

  const reduced = reduce ?? false;
  const isDesktop = useIsDesktop();
  const animate = isInView || reduced;

  return (
    <section
      ref={sectionRef}
      data-narrate="Your first streak starts here!"
      data-narrate-mood="celebrate"
      className="relative isolate flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-background py-20"
    >
      {/* ── Aurora bloom: grows out of the wordmark ───────────────── */}
      <motion.div
        initial={{ scale: reduced ? 1 : 0, opacity: reduced ? 1 : 0 }}
        animate={{ scale: animate ? 1 : 0, opacity: animate ? 1 : 0 }}
        transition={{ delay: reduced ? 0 : 0.05, duration: reduced ? 0 : 1.1, ease: EASE }}
        className="pointer-events-none absolute -z-10 rounded-full will-change-transform"
        style={{
          width: "130vmax",
          height: "90vmax",
          left: `calc(${origin.x}% - 65vmax)`,
          top: `calc(${origin.y}% - 45vmax)`,
          contain: "paint",
          background: [
            "radial-gradient(closest-side, hsl(var(--aurora-4) / 0.30), transparent 34%)",
            "radial-gradient(closest-side at 38% 46%, hsl(var(--aurora-3) / 0.28), transparent 60%)",
            "radial-gradient(closest-side at 64% 54%, hsl(var(--aurora-1) / 0.30), transparent 62%)",
            "radial-gradient(closest-side, hsl(var(--aurora-2) / 0.22), transparent 78%)",
          ].join(", "),
        }}
        aria-hidden
      />

      {/* Gathering light: brightens as the section arrives (scroll-linked) */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[8%] -z-10 mx-auto h-[70%] w-[min(90rem,140vw)] will-change-transform"
        style={
          reduced
            ? { opacity: 1 }
            : { opacity: gatherOpacity, scale: gatherScale, y: gatherY }
        }
      >
        <div className="absolute inset-0 bg-[radial-gradient(50%_45%_at_50%_45%,hsl(var(--aurora-2)/0.26),hsl(var(--aurora-1)/0.12)_55%,transparent_80%)]" />
      </motion.div>

      {/* Slow aurora curtains drifting across the band */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -left-[10%] top-[8%] h-[55%] w-[55%] rounded-full bg-[radial-gradient(closest-side,hsl(var(--aurora-1)/0.22),transparent)] blur-3xl"
          animate={reduced || !animate ? undefined : { x: ["0%", "14%", "0%"], y: ["0%", "6%", "0%"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-[12%] bottom-[4%] h-[60%] w-[55%] rounded-full bg-[radial-gradient(closest-side,hsl(var(--aurora-3)/0.16),transparent)] blur-3xl"
          animate={reduced || !animate ? undefined : { x: ["0%", "-12%", "0%"], y: ["0%", "-5%", "0%"] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Faint grid, and top/bottom fades so the band has no hard seams */}
        <div className="grid-faint absolute inset-0 opacity-60" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* ── Foreground stack ───────────────────────────────────────── */}
      <div className="relative z-10 flex w-full flex-col items-center px-4 text-center">
        {/* The wordmark comes into focus: it settles from slightly large and
            soft to sharp as the bloom opens behind it (a one-off blur). */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 1.06, filter: "blur(14px)" }}
          animate={
            animate
              ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }
              : { opacity: 0, y: 40, scale: 1.06, filter: "blur(14px)" }
          }
          transition={{ delay: reduced ? 0 : 0.15, duration: reduced ? 0 : 1.1, ease: EASE }}
          className="flex w-full flex-col items-center"
        >
          <p className="font-serif-accent text-xl text-foreground/90 sm:text-2xl">Ready when you are.</p>
          {/* WebGL mesh wordmark on desktop: the glyphs are a fine mesh the
              cursor drags through, springing back with an aurora fringe.
              Below desktop it is real type (the mesh is a cursor effect). */}
          <span
            ref={aRef}
            className="mt-2 block w-full max-w-[1500px] [filter:drop-shadow(0_0_40px_hsl(var(--aurora-2)/0.35))] lg:h-[13vw]"
          >
            {isDesktop ? (
              <MeshText text="SkillStreak AI" weight={800} />
            ) : (
              <span className="block font-display text-[clamp(2.75rem,14vw,5.5rem)] leading-[0.95] text-foreground [text-wrap:balance]">
                SkillStreak AI
              </span>
            )}
          </span>
        </motion.div>

        {/* Horizon of light under the wordmark */}
        <motion.div
          aria-hidden
          initial={{ scaleX: reduced ? 1 : 0, opacity: reduced ? 1 : 0 }}
          animate={{ scaleX: animate ? 1 : 0, opacity: animate ? 1 : 0 }}
          transition={{ delay: reduced ? 0 : 0.45, duration: reduced ? 0 : 0.9, ease: EASE }}
          className="my-10 h-px w-full max-w-4xl bg-[linear-gradient(90deg,transparent,hsl(var(--aurora-1)/0.8)_25%,hsl(var(--aurora-3))_50%,hsl(var(--aurora-4)/0.8)_75%,transparent)] shadow-[0_0_24px_2px_hsl(var(--aurora-3)/0.45)] sm:my-12"
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: animate ? 1 : 0, y: animate ? 0 : 30 }}
          transition={{ delay: reduced ? 0 : 0.7, duration: reduced ? 0 : 0.5, ease: EASE }}
          className="flex w-full max-w-2xl flex-col items-center"
        >
          <h3 className="font-display text-3xl leading-tight [text-wrap:balance] sm:text-4xl lg:text-5xl">
            Your first <span className="font-serif-accent text-primary text-glow">streak</span> is one click away.
          </h3>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Sign up in a minute. Start with the topic your AI tutor picks for you, and come back
            tomorrow to keep it alive.
          </p>

          <div className="mt-8 w-full" data-bot-avoid="">
            <HeroCTA />
          </div>

          <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {["Free forever", "Built for students", "Sign up in 60 seconds"].map((t) => (
              <li key={t} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.9)]" />
                {t}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
