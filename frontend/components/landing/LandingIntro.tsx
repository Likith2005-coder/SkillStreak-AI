"use client";

/**
 * "Signal Boot" — cinematic landing intro.
 *
 * A drafting-table boot sequence: blueprint construction guides draw
 * themselves across a deep-ink screen, every guide passing through a vertex
 * of the streak bolt they are about to define. The bolt strokes itself in,
 * ignites with a tube-flicker fill, the wordmark rises letter-by-letter,
 * then the whole overlay lifts like a curtain — and only at that moment do
 * the nav + hero play their entrances (via introBus), so the page powers on
 * in one continuous move.
 *
 * Rules of engagement:
 * - Plays once per tab session (sessionStorage), replayable with ?intro=1.
 * - Click / any key skips straight to the reveal.
 * - prefers-reduced-motion: never plays (CSS hides it pre-hydration too).
 * - Hard 6.5s failsafe + a no-JS CSS auto-clear so it can never trap the page.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { introBus } from "./introBus";

const EASE = [0.22, 1, 0.36, 1] as const;
const CURTAIN = [0.76, 0, 0.24, 1] as const;
const SEEN_KEY = "ss-intro-seen";

/* Timeline (seconds from mount) */
const T = {
  grid: 0.05,
  guides: 0.2,
  circles: 0.55,
  ticks: 1.05,
  bolt: 1.2,
  flash: 2.0,
  word: 2.2,
  status: 2.7,
  // Reveal is NOT a wall-clock timer: it fires 0.75s after the status line
  // finishes animating (see onAnimationComplete below), so a janky first
  // load can never cut the choreography short. `failsafe` stays absolute.
  holdAfterStatus: 0.75,
  failsafe: 6.5,
};

/* ── Bolt geometry ─────────────────────────────────────────────
   All guides pass through these vertices — the glyph is visibly
   *constructed* by the drafting lines, not placed on top of them. */
const BOLT =
  "M 408 150 L 272 400 L 352 400 L 312 570 L 448 320 L 368 320 Z";
const VERTICES: Array<[number, number]> = [
  [408, 150],
  [272, 400],
  [352, 400],
  [312, 570],
  [448, 320],
  [368, 320],
];
const H_GUIDES = [150, 320, 400, 570];
const V_GUIDES = [272, 360, 448];
const DIAGONALS: Array<[number, number, number, number]> = [
  [483, 12, 170, 588], // extension of the P1→P2 edge
  [530, 170, 258, 670], // extension of the P5→P4 edge
];

const WORD = "SKILLSTREAK";

type Phase = "boot" | "reveal" | "gone";

export function LandingIntro() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("boot");
  const timers = useRef<number[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  const startReveal = useCallback(() => {
    setPhase((p) => (p === "boot" ? "reveal" : p));
  }, []);

  // The moment the curtain starts lifting: persist "seen", release the
  // scroll lock, and let the nav + hero begin their entrances underneath.
  useEffect(() => {
    if (phase !== "reveal") return;
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* storage unavailable — intro just replays next load */
    }
    document.documentElement.style.overflow = "";
    introBus.finish();
  }, [phase]);

  useEffect(() => {
    let seen = false;
    try {
      seen =
        sessionStorage.getItem(SEEN_KEY) === "1" &&
        !window.location.search.includes("intro=1");
    } catch {
      /* ignore */
    }
    if (seen || reduce) {
      setPhase("gone");
      introBus.finish();
      return;
    }

    // React is in control now — disarm the CSS no-JS auto-clear, which is
    // timed from SSR paint and would otherwise cut a slow-hydrating load
    // off mid-choreography. The JS failsafe below takes over that duty.
    overlayRef.current?.style.setProperty("animation", "none");

    // A boot sequence always reveals the top of the page — override any
    // browser-restored scroll position from a previous visit.
    window.scrollTo(0, 0);
    document.documentElement.style.overflow = "hidden";
    timers.current = [
      window.setTimeout(startReveal, T.failsafe * 1000), // failsafe
    ];
    const onKey = () => startReveal();
    window.addEventListener("keydown", onKey);
    return () => {
      timers.current.forEach(clearTimeout);
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [reduce, startReveal]);

  if (phase === "gone") return null;
  const revealing = phase === "reveal";

  return (
    <motion.div
      ref={overlayRef}
      aria-hidden
      onPointerDown={startReveal}
      className="landing-intro fixed inset-0 z-[100] cursor-pointer select-none overflow-hidden bg-background"
      initial={{ clipPath: "inset(0 0 0% 0)" }}
      animate={{ clipPath: revealing ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)" }}
      transition={{ duration: 0.9, ease: CURTAIN }}
      onAnimationComplete={() => {
        if (revealing) setPhase("gone");
      }}
    >
      {/* Blueprint grid ground */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(hsl(187 92% 52% / 0.05) 1px, transparent 1px), linear-gradient(90deg, hsl(187 92% 52% / 0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: T.grid, duration: 0.8, ease: EASE }}
      />
      {/* Vignette — grid strongest at center, dissolving to ink at edges */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,transparent_0%,hsl(var(--background))_80%)]" />
      {/* Film grain, matching the page beneath */}
      <div className="noise-overlay" aria-hidden />

      {/* Center rig — parallaxes upward as the curtain lifts */}
      <motion.div
        className="relative flex h-full flex-col items-center justify-center px-6"
        animate={
          revealing ? { y: -90, scale: 1.05, opacity: 0.85 } : { y: 0, scale: 1, opacity: 1 }
        }
        transition={{ duration: 0.9, ease: CURTAIN }}
      >
        <BlueprintGlyph />

        {/* Wordmark — letters rise out of a clip, blur → sharp */}
        <div className="mt-6 flex overflow-hidden pb-1 font-display text-[clamp(2.1rem,6.5vw,4.4rem)] font-bold leading-none tracking-tight">
          {WORD.split("").map((ch, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ y: "115%", opacity: 0, filter: "blur(8px)" }}
              animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
              transition={{ delay: T.word + i * 0.028, duration: 0.6, ease: EASE }}
            >
              {ch}
            </motion.span>
          ))}
          {/* No blur filter here — a filter layer clips the text-shadow
              glow into a visible rectangle. Rise + fade only. */}
          <motion.span
            className="ml-[0.35em] inline-block text-primary [text-shadow:0_0_16px_hsl(187_92%_52%/0.3)]"
            initial={{ y: "115%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{ delay: T.word + WORD.length * 0.028 + 0.05, duration: 0.6, ease: EASE }}
          >
            AI
          </motion.span>
        </div>

        {/* Status line */}
        <motion.p
          className="mt-5 font-mono text-[11px] uppercase tracking-[0.42em] text-primary/70"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: T.status, duration: 0.5, ease: EASE }}
          onAnimationComplete={() => {
            // Last beat of the boot choreography → hold, then lift the curtain.
            timers.current.push(
              window.setTimeout(startReveal, T.holdAfterStatus * 1000),
            );
          }}
        >
          system online · signal locked
        </motion.p>
      </motion.div>

      {/* Boot progress hairline */}
      <motion.div
        className="absolute bottom-0 left-0 h-px bg-primary/80 shadow-[0_0_12px_hsl(187_92%_52%/0.8)]"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: T.status + 0.5 + T.holdAfterStatus, ease: "linear" }}
      />

      {/* Skip hint */}
      <motion.p
        className="absolute inset-x-0 bottom-6 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: revealing ? 0 : 1 }}
        transition={{ delay: revealing ? 0 : 1.1, duration: 0.5 }}
      >
        click anywhere to skip
      </motion.p>
    </motion.div>
  );
}

/* ── The drafting SVG ──────────────────────────────────────────── */

function BlueprintGlyph() {
  return (
    <svg
      viewBox="0 0 720 720"
      fill="none"
      className="h-[min(44vh,360px)] w-auto max-w-[86vw]"
    >
      {/* Construction guides — dim to a whisper once the bolt ignites */}
      <motion.g
        stroke="hsl(187 92% 60% / 0.3)"
        strokeWidth="1"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0.28 }}
        transition={{ delay: T.flash, duration: 0.6, ease: EASE }}
      >
        {H_GUIDES.map((y, i) => (
          <motion.line
            key={`h${y}`}
            x1="30"
            y1={y}
            x2="690"
            y2={y}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: T.guides + i * 0.07, duration: 0.55, ease: EASE }}
          />
        ))}
        {V_GUIDES.map((x, i) => (
          <motion.line
            key={`v${x}`}
            x1={x}
            y1="30"
            x2={x}
            y2="690"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: T.guides + 0.12 + i * 0.07, duration: 0.55, ease: EASE }}
          />
        ))}
        {DIAGONALS.map(([x1, y1, x2, y2], i) => (
          <motion.line
            key={`d${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: T.guides + 0.28 + i * 0.09, duration: 0.6, ease: EASE }}
          />
        ))}
        {/* Circumscribing circle through both bolt tips */}
        <motion.circle
          cx="360"
          cy="360"
          r="215"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: T.circles, duration: 0.8, ease: EASE }}
        />
        {/* Inner reference circle — violet for depth */}
        <motion.circle
          cx="360"
          cy="360"
          r="120"
          stroke="hsl(265 85% 68% / 0.3)"
          strokeDasharray="4 8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: T.circles + 0.15, duration: 0.8, ease: EASE }}
        />
        {/* Drafting microtext */}
        <motion.text
          x="46"
          y="104"
          fill="hsl(187 92% 60% / 0.5)"
          stroke="none"
          fontFamily="ui-monospace, monospace"
          fontSize="15"
          letterSpacing="3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: T.ticks, duration: 0.4 }}
        >
          SS.BOOT_SEQ // v0.7
        </motion.text>
        <motion.text
          x="470"
          y="632"
          fill="hsl(187 92% 60% / 0.5)"
          stroke="none"
          fontFamily="ui-monospace, monospace"
          fontSize="15"
          letterSpacing="3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: T.ticks + 0.12, duration: 0.4 }}
        >
          R:215 · LOCK
        </motion.text>
        {/* Vertex ticks — the intersections the bolt will claim */}
        {VERTICES.map(([x, y], i) => (
          <motion.g
            key={`t${i}`}
            stroke="hsl(187 92% 65% / 0.8)"
            strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: T.ticks + i * 0.05, duration: 0.3, ease: EASE }}
            style={{ transformOrigin: `${x}px ${y}px` }}
          >
            <line x1={x - 8} y1={y} x2={x + 8} y2={y} />
            <line x1={x} y1={y - 8} x2={x} y2={y + 8} />
          </motion.g>
        ))}
      </motion.g>

      {/* Ignition shockwave */}
      <motion.circle
        cx="360"
        cy="360"
        r="215"
        stroke="hsl(187 92% 60%)"
        strokeWidth="1.5"
        initial={{ scale: 1, opacity: 0 }}
        animate={{ scale: 1.55, opacity: [0, 0.55, 0] }}
        transition={{ delay: T.flash, duration: 0.7, ease: "easeOut" }}
        style={{ transformOrigin: "360px 360px" }}
      />

      {/* The streak bolt — stroked in, then ignites with a tube flicker */}
      <motion.path
        d={BOLT}
        stroke="hsl(187 92% 64%)"
        strokeWidth="4"
        strokeLinejoin="round"
        fill="hsl(187 92% 52%)"
        style={{ filter: "drop-shadow(0 0 20px hsl(187 92% 52% / 0.75))" }}
        initial={{ pathLength: 0, fillOpacity: 0 }}
        animate={{ pathLength: 1, fillOpacity: [0, 0.95, 0.25, 0.9] }}
        transition={{
          pathLength: { delay: T.bolt, duration: 0.8, ease: EASE },
          fillOpacity: { delay: T.flash, duration: 0.45, times: [0, 0.4, 0.62, 1] },
        }}
      />
    </svg>
  );
}
