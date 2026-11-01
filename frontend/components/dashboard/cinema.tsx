"use client";

/**
 * The dashboard's cinematography, in one place.
 *
 * - useOpeningShot(): decides, once per mount, whether this visit gets the
 *   ~2s opening shot (first dashboard visit in this browser session), the
 *   quick half-second entrance (every later visit) or nothing (reduced
 *   motion). The opening is skippable by any click, key, wheel, touch or real
 *   scroll and completes instantly: its keyframes live on `cine-*` classes
 *   that are simply dropped when it ends, so every element falls back to its
 *   resting style (which is the last keyframe) with no jump.
 * - CinemaBackdrop: the living light behind the header (drifting aurora
 *   pools, the one-off light sweep, a cursor-follow light on desktop) with a
 *   slow parallax drift on scroll.
 * - Reveal / RevealHeading: below-the-fold rows rise and unclip once as they
 *   enter the viewport.
 * - Flare: a quick glow when a count-up lands.
 * - GoalComet: a light that rides the goal ring's arc once as it draws.
 *
 * All motion is transform / opacity (plus filter and clip-path on small
 * elements, briefly). Nothing here runs per frame except the compositor's
 * CSS drift, which pauses while the tab is hidden.
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";

export const EASE = [0.22, 1, 0.36, 1] as const;

/** The opening shot's timeline, in ms from mount. */
export const SHOT = {
  /** Longest the shot waits (held on black) for the learner's data. */
  hold: 650,
  kicker: 120,
  words: 240,
  wordStagger: 60,
  lead: 620,
  hero: 520,
  ignite: 820,
  today: 660,
  todayData: 740,
  mascot: 700,
  pulse: 920,
  phoneMascot: 1040,
  explore: 1100,
  arsenal: 1200,
  end: 2100,
} as const;

const SEEN_KEY = "skillstreak.dashboard.opened";

export type ShotMode = "opening" | "quick" | "still";

/**
 * `ready`: the page's data has landed. The shot starts then (or after
 * SHOT.hold at the latest) so it plays over real content, not skeletons;
 * until it starts, every keyframe is held at its first frame (`waiting`).
 */
export function useOpeningShot(ready: boolean) {
  const reduce = useReducedMotionSafe();
  // Decided once from storage (read-only here: a strict-mode double render
  // must not see its own write and downgrade itself to "quick").
  const [first] = useState(() => {
    try {
      return window.sessionStorage.getItem(SEEN_KEY) !== "1";
    } catch {
      return false; // storage blocked: be quick rather than replay every time
    }
  });
  const [playing, setPlaying] = useState(first);
  const mode: ShotMode = reduce ? "still" : first ? "opening" : "quick";
  const live = playing && mode === "opening";
  const [waited, setWaited] = useState(false);
  const started = live && (ready || waited);

  useEffect(() => {
    if (!live || ready) return;
    const t = window.setTimeout(() => setWaited(true), SHOT.hold);
    return () => window.clearTimeout(t);
  }, [live, ready]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // storage blocked: nothing to remember
    }
  }, []);

  useEffect(() => {
    if (!live) return;
    const done = () => setPlaying(false);
    const y0 = window.scrollY;
    const onScroll = () => Math.abs(window.scrollY - y0) > 8 && done();
    const onHide = () => document.hidden && done();
    const opts = { passive: true, capture: true } as const;
    const evs = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    evs.forEach((e) => window.addEventListener(e, done, opts));
    window.addEventListener("scroll", onScroll, opts);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      evs.forEach((e) => window.removeEventListener(e, done, opts));
      window.removeEventListener("scroll", onScroll, opts);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [live]);

  useEffect(() => {
    if (!started) return;
    const t = window.setTimeout(() => setPlaying(false), SHOT.end);
    return () => window.clearTimeout(t);
  }, [started]);

  return { mode, playing: live, started, waiting: live && !started, reduce };
}

/** Class + delay for an opening-shot element; nothing once the shot is over. */
export function shot(playing: boolean, cls: string, delayMs = 0): { className?: string; style?: CSSProperties } {
  if (!playing) return {};
  return { className: `cine ${cls}`, style: { ["--d" as string]: `${delayMs}ms` } };
}

/* ── Atmosphere ─────────────────────────────────────────────────────── */

export function CinemaBackdrop({ playing, reduce }: { playing: boolean; reduce: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  // The light layer lags the content: it drifts down 40px over the first
  // 600px of scroll, so the header reads as a deeper plane.
  const y = useTransform(scrollY, [0, 600], [0, 40], { clamp: true });

  // Pause the ambient drift while the tab is hidden.
  useEffect(() => {
    if (reduce) return;
    const el = rootRef.current;
    const sync = () => el?.classList.toggle("cine-paused", document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [reduce]);

  // Cursor light: desktop pointers only, one rAF-throttled pointermove,
  // one rect read then one transform write per frame.
  useEffect(() => {
    if (reduce) return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)");
    if (!mq.matches) return;
    let raf = 0;
    let cx = 0;
    let cy = 0;
    let on = false;
    const paint = () => {
      raf = 0;
      const root = rootRef.current;
      const light = lightRef.current;
      if (!root || !light) return;
      const r = root.getBoundingClientRect();
      const x = cx - r.left;
      const yy = cy - r.top;
      const inside = yy >= 0 && yy <= r.height * 0.85;
      light.style.transform = `translate3d(${x}px, ${yy}px, 0)`;
      if (inside !== on) {
        on = inside;
        light.classList.toggle("is-on", inside);
      }
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      cx = e.clientX;
      cy = e.clientY;
      if (!raf && !document.hidden) raf = requestAnimationFrame(paint);
    };
    const leave = () => {
      on = false;
      lightRef.current?.classList.remove("is-on");
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduce]);

  return (
    <motion.div
      ref={rootRef}
      aria-hidden
      style={reduce ? undefined : { y }}
      className="cine-backdrop pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem] overflow-hidden"
    >
      {/* Light pools: soft-edged gradients (no filter blur), drifting on the
          compositor with the shared aurora-css keyframes. */}
      <div className="aurora-css absolute -left-[12%] -top-48 h-[30rem] w-[46rem] max-w-[90vw] rounded-full bg-[radial-gradient(closest-side,hsl(var(--aurora-1)/0.20),hsl(var(--aurora-2)/0.06)_60%,transparent)]" />
      <div className="aurora-css aurora-css-b absolute -top-40 right-[-8%] h-[26rem] w-[40rem] max-w-[80vw] rounded-full bg-[radial-gradient(closest-side,hsl(var(--aurora-3)/0.11),transparent_70%)]" />
      <div className="aurora-css aurora-css-c absolute left-[30%] top-24 h-[20rem] w-[34rem] max-w-[70vw] rounded-full bg-[radial-gradient(closest-side,hsl(var(--aurora-2)/0.08),transparent_70%)]" />
      {!reduce && <div ref={lightRef} className="cine-cursor" />}
      {playing && <div className="cine-sweep" />}
    </motion.div>
  );
}

/**
 * The fade up from black. Rendered only during the opening shot, portalled
 * to <body> so it covers the nav too (the page root is its own stacking
 * context). Held black while the shot waits for data.
 */
export function Curtain({ held }: { held: boolean }) {
  return createPortal(<div aria-hidden className={cn("cine-curtain", held && "is-held")} />, document.body);
}

/* ── Scroll reveals ─────────────────────────────────────────────────── */

/**
 * Rises and unclips once as it enters the viewport. The clip is dropped
 * when the reveal ends so shadows, focus rings and the phone tab bar's
 * bleed are never cut off.
 */
export function Reveal({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const reduce = useReducedMotionSafe();
  if (reduce) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 28, clipPath: "inset(-12% -6% 30% -6%)" }}
      whileInView={{ opacity: 1, y: 0, clipPath: "inset(-12% -6% -12% -6%)", transitionEnd: { clipPath: "none" } }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.75, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * A chapter marker: words rise out of a mask and a hairline draws out to
 * the right, once, as it scrolls into view.
 */
export function RevealHeading({ id, lead, accent }: { id: string; lead: string; accent: string }) {
  const reduce = useReducedMotionSafe();
  const words = [...lead.split(" ").map((w) => ({ w, accent: false })), { w: accent, accent: true }];
  return (
    <motion.div
      className="mb-5 flex items-center gap-4"
      initial={reduce ? false : "hidden"}
      whileInView={reduce ? undefined : "show"}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ staggerChildren: 0.06 }}
    >
      <h2 id={id} className="shrink-0 font-display text-[1.6rem] leading-none text-foreground sm:text-[1.9rem]">
        {words.map(({ w, accent: a }, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.14em] align-bottom">
            <motion.span
              className={cn("inline-block", a && "font-serif-accent text-primary")}
              variants={{
                hidden: { y: "105%" },
                show: { y: "0%", transition: { duration: 0.7, ease: EASE } },
              }}
            >
              {w}
            </motion.span>
            {i < words.length - 1 && " "}
          </span>
        ))}
      </h2>
      <motion.span
        aria-hidden
        className="h-px flex-1 origin-left bg-gradient-to-r from-primary/40 via-white/10 to-transparent"
        variants={{
          hidden: { scaleX: 0 },
          show: { scaleX: 1, transition: { duration: 1.1, ease: EASE, delay: 0.15 } },
        }}
      />
    </motion.div>
  );
}

/* ── Micro-cinematics ───────────────────────────────────────────────── */

/**
 * Wraps a count-up's text and flares it once when the count lands on its
 * target (only after it actually moved, so a static number never flashes).
 */
export function Flare({
  shown,
  target,
  color,
  children,
}: {
  shown: number;
  target: number;
  /** An HSL triplet var, e.g. "var(--energy)". Defaults to primary. */
  color?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotionSafe();
  const [n, setN] = useState(0);
  const moving = useRef(false);
  useEffect(() => {
    if (reduce) return;
    if (shown !== target) {
      moving.current = true;
    } else if (moving.current) {
      moving.current = false;
      setN((k) => k + 1);
    }
  }, [shown, target, reduce]);
  return (
    <span
      key={n}
      className={n > 0 ? "cine-flare" : "inline-block"}
      style={color ? ({ ["--flare" as string]: color } as CSSProperties) : undefined}
    >
      {children}
    </span>
  );
}

/**
 * A comet riding the goal ring as it draws: same size, same 12 o'clock
 * start, same curve and timing as GoalRing's stroke, so the head sits on
 * the drawing tip. Rotation only.
 */
export function GoalComet({ pct, size }: { pct: number; size: number }) {
  const reduce = useReducedMotionSafe();
  if (reduce || pct <= 0) return null;
  const stroke = size >= 110 ? 10 : 8;
  const r = (size - stroke) / 2 - 4; // GoalRing's radius
  const c = size / 2;
  const tail = (38 * Math.PI) / 180;
  const tx = c - r * Math.sin(tail);
  const ty = c - r * Math.cos(tail);
  const gid = `comet-${size}`;
  return (
    <div
      aria-hidden
      className="cine-comet pointer-events-none absolute inset-0"
      style={{ ["--to" as string]: `${pct * 360}deg` } as CSSProperties}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <defs>
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={tx} y1={ty} x2={c} y2={c - r}>
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset="1" stopColor="white" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path
          d={`M ${tx} ${ty} A ${r} ${r} 0 0 1 ${c} ${c - r}`}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke * 0.55}
          strokeLinecap="round"
        />
        <circle cx={c} cy={c - r} r={stroke * 0.45} fill="white" className="cine-comet-head" />
      </svg>
    </div>
  );
}
