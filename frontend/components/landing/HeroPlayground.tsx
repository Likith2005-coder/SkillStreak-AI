"use client";

/**
 * The landing hero, playground edition.
 *
 * Left: a big friendly headline and the two stacked chunky buttons (start /
 * sign in). Right: the SignalBot surrounded by floating domain stickers and
 * reward badges. Each sticker has two motion layers that never fight:
 *   outer — parallax toward the cursor at its own depth (CSS vars --mx/--my)
 *   inner — an idle bob on its own duration and phase (CSS keyframe)
 * Both are transform-only, so they run on the compositor.
 *
 * The entrance waits for the boot intro to lift (introBus), and reduced
 * motion gets everything in place, still.
 */

import { useEffect, useRef } from "react";
import { motion, type Variants } from "framer-motion";
import { Link } from "next-view-transitions";
import { Brain, Cloud, Code2, Database, Flame, Gem, ShieldCheck, Star, Trophy } from "lucide-react";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { SignalBotLazy } from "@/components/3d/SignalBotLazy";
import { RotatingWord } from "./RotatingWord";
import { useIntroDone } from "./introBus";

const EASE = [0.22, 1, 0.36, 1] as const;

type Sticker = {
  icon: typeof Brain;
  face: string; // bg class
  edge: string; // CSS colour for the 3D edge
  pos: string; // absolute position classes
  size: number; // px
  depth: number; // parallax multiplier
  bob: number; // seconds
  delay: number; // seconds (phase)
  tilt: number; // degrees
  label: string;
  hideOnMobile?: boolean;
};

const STICKERS: Sticker[] = [
  { icon: ShieldCheck, face: "bg-rose-500", edge: "#9f1239", pos: "left-[4%] top-[14%]", size: 76, depth: 22, bob: 3.4, delay: 0, tilt: -10, label: "Cybersecurity" },
  { icon: Code2, face: "bg-blue-500", edge: "#1e3a8a", pos: "right-[6%] top-[8%]", size: 68, depth: 16, bob: 3.9, delay: 0.6, tilt: 8, label: "Web development" },
  { icon: Brain, face: "bg-violet-500", edge: "#4c1d95", pos: "right-[0%] top-[46%]", size: 82, depth: 26, bob: 3.1, delay: 1.1, tilt: 12, label: "Artificial intelligence" },
  { icon: Cloud, face: "bg-sky-500", edge: "#075985", pos: "left-[0%] bottom-[18%]", size: 70, depth: 18, bob: 3.7, delay: 0.3, tilt: 6, label: "Cloud computing", hideOnMobile: true },
  { icon: Database, face: "bg-teal-500", edge: "#115e59", pos: "right-[18%] bottom-[6%]", size: 60, depth: 12, bob: 4.2, delay: 1.5, tilt: -8, label: "Data science", hideOnMobile: true },
  { icon: Flame, face: "bg-energy-bright", edge: "hsl(var(--energy-shade))", pos: "left-[22%] top-[2%]", size: 54, depth: 30, bob: 2.8, delay: 0.9, tilt: -14, label: "Streak", hideOnMobile: true },
  { icon: Gem, face: "bg-xp-bright", edge: "hsl(var(--xp-shade))", pos: "left-[12%] bottom-[2%]", size: 50, depth: 34, bob: 2.6, delay: 0.2, tilt: 10, label: "XP" },
  { icon: Star, face: "bg-grape-bright", edge: "hsl(var(--grape-shade))", pos: "right-[30%] top-[0%]", size: 48, depth: 28, bob: 3.0, delay: 1.8, tilt: -6, label: "Level", hideOnMobile: true },
];

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export function HeroPlayground() {
  const reduce = useReducedMotionSafe();
  const introDone = useIntroDone();
  const stage = useRef<HTMLDivElement>(null);

  // One pointer listener drives every sticker's parallax through two CSS
  // variables, eased with a single rAF so it never steps.
  useEffect(() => {
    if (reduce) return;
    const el = stage.current;
    if (!el) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const tick = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      el.style.setProperty("--mx", x.toFixed(4));
      el.style.setProperty("--my", y.toFixed(4));
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.0005 ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  const show = introDone || reduce;

  return (
    <section className="relative grid min-h-[100svh] grid-cols-1 items-center gap-10 overflow-hidden px-4 pb-16 pt-28 lg:grid-cols-[1fr_1.05fr] lg:gap-6 lg:px-12">
      {/* ── Copy ─────────────────────────────────────────── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate={show ? "show" : "hidden"}
        className="relative z-10 mx-auto max-w-2xl text-center lg:mx-0 lg:text-left"
      >
        <motion.h1
          variants={item}
          // The rotating word reserves room for its longest option ("Web Dev"), so
          // the measure has to fit "Master Web Dev" on one line at the max size.
          className="font-display text-[clamp(2.5rem,5.2vw,4.25rem)] leading-[1.04] text-foreground"
        >
          Master{" "}
          <RotatingWord
            className="text-primary"
            words={["tech", "Cyber", "Web Dev", "AI", "ML", "Data", "Cloud", "DevOps", "Web3", "IoT"]}
          />
          <br />
          one <span className="text-energy">streak</span> at a time.
        </motion.h1>

        <motion.p variants={item} className="mx-auto mt-5 max-w-md text-lg font-semibold text-muted-foreground lg:mx-0 [text-wrap:pretty]">
          Bite-sized lessons, an AI tutor that knows where you are, and a streak that makes
          tomorrow the easy part. Free, forever.
        </motion.p>

        <motion.div variants={item} className="mx-auto mt-8 flex max-w-sm flex-col gap-3 lg:mx-0">
          <Link
            href="/register"
            className="focus-ring inline-flex h-14 items-center justify-center rounded-2xl bg-primary text-base font-black uppercase tracking-wider text-primary-foreground transition-[transform,box-shadow] duration-100 [box-shadow:0_5px_0_hsl(var(--primary-shade))] hover:brightness-110 active:translate-y-[5px] active:[box-shadow:none] motion-reduce:transition-none"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="focus-ring inline-flex h-14 items-center justify-center rounded-2xl border-2 border-border bg-card text-base font-black uppercase tracking-wider text-secondary transition-[transform,box-shadow] duration-100 [box-shadow:0_5px_0_hsl(var(--border))] hover:bg-muted active:translate-y-[5px] active:[box-shadow:none] motion-reduce:transition-none"
          >
            I already have an account
          </Link>
        </motion.div>

        <motion.ul variants={item} className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-bold text-muted-foreground lg:justify-start">
          <li className="flex items-center gap-1.5"><Flame className="h-4 w-4 text-energy" fill="currentColor" aria-hidden /> Daily streaks</li>
          <li className="flex items-center gap-1.5"><Gem className="h-4 w-4 text-xp" fill="currentColor" aria-hidden /> XP & levels</li>
          <li className="flex items-center gap-1.5"><Trophy className="h-4 w-4 text-grape" fill="currentColor" aria-hidden /> Weekly leagues</li>
        </motion.ul>
      </motion.div>

      {/* ── Stage: bot + stickers ────────────────────────── */}
      <div ref={stage} className="relative mx-auto h-[400px] w-full max-w-[620px] sm:h-[480px] lg:h-[600px]" style={{ ["--mx" as string]: 0, ["--my" as string]: 0 }}>
        {/* soft colour pool so the bot sits on something */}
        <div aria-hidden className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle,hsl(var(--primary-bright)/0.16),hsl(var(--secondary-bright)/0.08)_45%,transparent_70%)]" />

        {STICKERS.map((s, i) => (
          <motion.span
            key={s.label}
            aria-hidden
            initial={{ opacity: 0, scale: 0.4 }}
            animate={show ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
            transition={{ duration: reduce ? 0 : 0.55, delay: reduce ? 0 : 0.35 + i * 0.07, ease: EASE }}
            className={`absolute z-20 ${s.pos} ${s.hideOnMobile ? "hidden sm:block" : ""}`}
          >
            {/* parallax layer */}
            <span
              className="block will-change-transform"
              style={{ transform: `translate3d(calc(var(--mx) * ${s.depth * 2}px), calc(var(--my) * ${s.depth * 2}px), 0)` }}
            >
              {/* bob layer */}
              <span
                className={`sticker-bob flex items-center justify-center rounded-[22px] ${s.face}`}
                style={{
                  width: s.size,
                  height: s.size,
                  boxShadow: `0 6px 0 ${s.edge}`,
                  ["--tilt" as string]: `${s.tilt}deg`,
                  animationDuration: `${s.bob}s`,
                  animationDelay: `${s.delay}s`,
                }}
              >
                <s.icon className="text-white" style={{ width: s.size * 0.48, height: s.size * 0.48 }} strokeWidth={2.6} />
              </span>
            </span>
          </motion.span>
        ))}

        <SignalBotLazy className="absolute inset-[8%] z-10" />
      </div>
    </section>
  );
}
