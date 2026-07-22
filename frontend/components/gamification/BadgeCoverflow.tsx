"use client";

/**
 * Badge Coverflow — a 3D carousel for the badge collection, adapted from a
 * Framer "Smooth 3D Slideshow" coverflow. The active badge stands upright in
 * the spotlight while its neighbours tilt back in perspective; click any
 * card (or use arrows / keyboard) to bring it to centre.
 *
 * Perf: pure CSS 3D transforms with transitions — zero per-frame JS. The
 * gentle autoplay stops the moment the user interacts and pauses on hover.
 * Reduced-motion falls back to the flat grid (BadgeGallery).
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useReducedMotion } from "framer-motion";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Flame,
  Footprints,
  Globe2,
  Lock,
  Moon,
  Rocket,
  Sunrise,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Badge } from "@/lib/api";
import { BadgeGallery } from "./BadgeGallery";

const ICONS: Record<string, LucideIcon> = {
  footprints: Footprints,
  flame: Flame,
  trophy: Trophy,
  award: Award,
  rocket: Rocket,
  "globe-2": Globe2,
  moon: Moon,
  sunrise: Sunrise,
};

/** Per-badge accent so each card feels like its own trophy, not a clone. */
const ACCENTS: Record<
  string,
  { from: string; to: string; text: string; glow: string }
> = {
  footprints: { from: "from-cyan-500/25", to: "to-sky-500/10", text: "text-cyan-300", glow: "0 0 60px -10px rgba(34,211,238,0.55)" },
  flame: { from: "from-orange-500/25", to: "to-amber-500/10", text: "text-orange-300", glow: "0 0 60px -10px rgba(251,146,60,0.55)" },
  trophy: { from: "from-rose-500/25", to: "to-pink-500/10", text: "text-rose-300", glow: "0 0 60px -10px rgba(251,113,133,0.55)" },
  award: { from: "from-violet-500/25", to: "to-purple-500/10", text: "text-violet-300", glow: "0 0 60px -10px rgba(167,139,250,0.55)" },
  rocket: { from: "from-emerald-500/25", to: "to-teal-500/10", text: "text-emerald-300", glow: "0 0 60px -10px rgba(52,211,153,0.55)" },
  "globe-2": { from: "from-blue-500/25", to: "to-indigo-500/10", text: "text-blue-300", glow: "0 0 60px -10px rgba(96,165,250,0.55)" },
  moon: { from: "from-indigo-500/25", to: "to-violet-500/10", text: "text-indigo-300", glow: "0 0 60px -10px rgba(129,140,248,0.55)" },
  sunrise: { from: "from-amber-500/25", to: "to-yellow-500/10", text: "text-amber-300", glow: "0 0 60px -10px rgba(251,191,36,0.55)" },
};

const FALLBACK_ACCENT = ACCENTS.award;

// Coverflow geometry — fixed internals.
const PERSPECTIVE = 1600;
const CARD_W = 290;
const CARD_H = 340;
const GAP_X = 205; // horizontal spread per step
const DEPTH = 230; // how far neighbours fall back
const TILT_Y = 16; // rotateY per step
const TILT_Z = 2.5; // subtle rotateZ per step
const SCALE_STEP = 0.13;
const MAX_VISIBLE = 2;
const MOVE_DUR = 0.6;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const AUTOPLAY_MS = 3200;

export function BadgeCoverflow({ badges }: { badges: Badge[] }) {
  const reduce = useReducedMotion();
  const n = badges.length;
  const earnedCount = badges.filter((b) => b.earnedAt).length;

  const [active, setActive] = useState(0);
  // Autoplay drifts through the collection until the user takes over.
  const [autoplay, setAutoplay] = useState(true);
  const [hovered, setHovered] = useState(false);

  // Lock input while a card is mid-move so rapid clicks don't stack.
  const lockRef = useRef(false);
  const lock = useCallback(() => {
    lockRef.current = true;
    window.setTimeout(() => {
      lockRef.current = false;
    }, MOVE_DUR * 1000);
  }, []);

  const step = useCallback(
    (dir: number) => {
      if (lockRef.current || n === 0) return;
      lock();
      setActive((a) => (((a + dir) % n) + n) % n);
    },
    [n, lock]
  );

  useEffect(() => {
    if (!autoplay || hovered || n < 2 || reduce) return;
    const id = window.setInterval(() => step(1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [autoplay, hovered, n, reduce, step]);

  const handleCardClick = useCallback(
    (i: number) => {
      if (lockRef.current) return;
      setAutoplay(false);
      lock();
      setActive((a) => (i === a ? (a + 1) % n : i));
    },
    [n, lock]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setAutoplay(false);
        step(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setAutoplay(false);
        step(-1);
      }
    },
    [step]
  );

  // Reduced motion (or a degenerate list) → the calm flat grid.
  if (reduce || n === 0) return <BadgeGallery badges={badges} />;

  const activeBadge = badges[active];
  const activeAccent = ACCENTS[activeBadge.icon] ?? FALLBACK_ACCENT;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card/40 p-5 backdrop-blur">
      {/* ambient bloom tinted to the active badge */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br opacity-40 blur-3xl transition-colors duration-700",
          activeAccent.from,
          activeAccent.to
        )}
      />

      <div className="relative flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Badges</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {earnedCount} of {n} earned
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <CarouselArrow
            dir={-1}
            onClick={() => {
              setAutoplay(false);
              step(-1);
            }}
          />
          <CarouselArrow
            dir={1}
            onClick={() => {
              setAutoplay(false);
              step(1);
            }}
          />
        </div>
      </div>

      {/* ── The 3D stage ── */}
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label="Badge collection"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative mt-2 flex h-[400px] items-center justify-center outline-none"
        style={{ perspective: `${PERSPECTIVE}px` }}
      >
        <div
          className="relative"
          style={{
            width: CARD_W,
            height: CARD_H,
            transformStyle: "preserve-3d",
          }}
        >
          {badges.map((b, i) => {
            // Wrap relative offset for a seamless loop.
            let rel = i - active;
            if (rel > n / 2) rel -= n;
            if (rel < -n / 2) rel += n;
            const ax = Math.abs(rel);
            const visible = ax <= MAX_VISIBLE;
            const isActive = rel === 0;
            const sc = Math.max(0.4, 1 - ax * SCALE_STEP);
            const accent = ACCENTS[b.icon] ?? FALLBACK_ACCENT;
            const Icon = ICONS[b.icon] ?? Award;
            const earned = !!b.earnedAt;

            const cardStyle: CSSProperties = {
              position: "absolute",
              left: "50%",
              top: "50%",
              width: CARD_W,
              height: CARD_H,
              transformOrigin: "center center",
              transform: `translate(-50%, -50%) translateX(${rel * GAP_X}px) translateZ(${-ax * DEPTH}px) rotateY(${-rel * TILT_Y}deg) rotateZ(${rel * TILT_Z}deg) scale(${sc})`,
              transition: `transform ${MOVE_DUR}s ${EASE}, opacity ${MOVE_DUR}s ${EASE}, box-shadow ${MOVE_DUR}s ${EASE}`,
              opacity: visible ? 1 : 0,
              pointerEvents: visible ? "auto" : "none",
              cursor: isActive ? "default" : "pointer",
              boxShadow: isActive && earned ? accent.glow : "0 20px 50px -20px rgba(0,0,0,0.6)",
            };

            return (
              <div
                key={b.slug}
                style={cardStyle}
                onClick={() => handleCardClick(i)}
                aria-label={b.name}
                aria-hidden={!visible}
                className={cn(
                  "overflow-hidden rounded-2xl border bg-gradient-to-br",
                  earned
                    ? cn("border-white/15", accent.from, accent.to, "bg-card/80")
                    : "border-border/70 from-card/80 to-card/60"
                )}
              >
                {/* inner surface */}
                <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                  <div
                    className={cn(
                      "flex h-20 w-20 items-center justify-center rounded-full ring-1",
                      earned
                        ? cn("bg-white/10 ring-white/20", accent.text)
                        : "bg-muted/30 text-muted-foreground ring-border/60"
                    )}
                  >
                    {earned ? (
                      <Icon className="h-9 w-9" />
                    ) : (
                      <Lock className="h-7 w-7" />
                    )}
                  </div>
                  <div>
                    <div className="text-lg font-bold tracking-tight text-foreground">
                      {b.name}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {b.description}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider",
                      earned
                        ? cn("border-white/20 bg-white/10", accent.text)
                        : "border-border bg-muted/20 text-muted-foreground"
                    )}
                  >
                    {earned
                      ? `Earned ${new Date(b.earnedAt!).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                      : "Locked"}
                  </span>
                </div>

                {/* dim veil over non-active cards */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-black"
                  style={{
                    opacity: isActive ? 0 : 0.45,
                    transition: `opacity ${MOVE_DUR}s ${EASE}`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Dots ── */}
      <div className="relative mt-1 flex items-center justify-center gap-1.5">
        {badges.map((b, i) => (
          <button
            key={b.slug}
            aria-label={`Go to ${b.name}`}
            onClick={() => handleCardClick(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === active
                ? "w-6 bg-primary"
                : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function CarouselArrow({ dir, onClick }: { dir: -1 | 1; onClick: () => void }) {
  const Icon = dir === -1 ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={dir === -1 ? "Previous badge" : "Next badge"}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card/60 text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
