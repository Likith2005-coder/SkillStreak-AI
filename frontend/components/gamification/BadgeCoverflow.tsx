"use client";

/**
 * Badge Coverflow — a 3D carousel for the badge collection, adapted from a
 * Framer "Smooth 3D Slideshow" coverflow. The active badge stands upright in
 * the spotlight while its neighbours tilt back in perspective; click any
 * card (or use arrows / keyboard) to bring it to centre.
 *
 * Perf: pure CSS 3D transforms with transitions — zero per-frame JS. The
 * gentle autoplay stops the moment the user interacts and pauses on hover.
 * Reduced-motion falls back to the flat grid (BadgeGallery). Cards are
 * chunky white tiles with a coloured medal; locked ones are grey.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Badge } from "@/lib/api";
import { BadgeGallery, BadgeHeader } from "./BadgeGallery";
import { Medal, toneFor } from "./Medal";

// Coverflow geometry — fixed internals.
const PERSPECTIVE = 1600;
const CARD_W = 260;
const CARD_H = 320;
const GAP_X = 190; // horizontal spread per step
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

  return (
    <div className="card-chunky relative overflow-hidden p-5">
      <BadgeHeader earned={earnedCount} total={n}>
        <div className="flex shrink-0 items-center gap-2">
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
      </BadgeHeader>

      {/* ── The 3D stage ── */}
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label="Badge collection"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="focus-ring relative mt-2 flex h-[370px] items-center justify-center rounded-2xl"
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
            const tone = toneFor(b.icon);
            const earned = !!b.earnedAt;

            const cardStyle: CSSProperties = {
              position: "absolute",
              left: "50%",
              top: "50%",
              width: CARD_W,
              height: CARD_H,
              transformOrigin: "center center",
              transform: `translate(-50%, -50%) translateX(${rel * GAP_X}px) translateZ(${-ax * DEPTH}px) rotateY(${-rel * TILT_Y}deg) rotateZ(${rel * TILT_Z}deg) scale(${sc})`,
              transition: `transform ${MOVE_DUR}s ${EASE}, opacity ${MOVE_DUR}s ${EASE}`,
              opacity: visible ? 1 : 0,
              pointerEvents: visible ? "auto" : "none",
              cursor: isActive ? "default" : "pointer",
            };

            return (
              <div
                key={b.slug}
                style={cardStyle}
                onClick={() => handleCardClick(i)}
                aria-label={b.name}
                aria-hidden={!visible}
                className="overflow-hidden rounded-[1.5rem] border-2 border-b-[6px] border-border bg-card"
              >
                {/* coloured top band — the ribbon the medal hangs from */}
                <div aria-hidden className={cn("absolute inset-x-0 top-0 h-20", earned ? tone.tint : "bg-muted")} />
                <div className="relative flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                  <Medal icon={b.icon} earned={earned} size="lg" />
                  <div>
                    <div className={cn("text-xl font-black", earned ? "text-foreground" : "text-muted-foreground")}>
                      {b.name}
                    </div>
                    <p className="mt-1.5 text-sm font-semibold leading-snug text-muted-foreground">
                      {b.description}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-extrabold",
                      earned ? cn(tone.tint, tone.text) : "bg-muted text-muted-foreground"
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
                  className="pointer-events-none absolute inset-0 bg-white"
                  style={{
                    opacity: isActive ? 0 : 0.5,
                    transition: `opacity ${MOVE_DUR}s ${EASE}`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Dots ── */}
      <div className="relative mt-1 flex flex-wrap items-center justify-center">
        {badges.map((b, i) => (
          <button
            key={b.slug}
            type="button"
            aria-label={`Go to ${b.name}`}
            aria-current={i === active ? "true" : undefined}
            onClick={() => handleCardClick(i)}
            className="focus-ring flex h-8 items-center justify-center rounded-full px-1"
          >
            <span
              className={cn(
                "block h-2.5 rounded-full transition-all duration-300 motion-reduce:transition-none",
                i === active ? "w-7 bg-primary-bright" : "w-2.5 bg-border hover:bg-muted-foreground/50"
              )}
            />
          </button>
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
      className="focus-ring flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-border bg-card text-muted-foreground transition-[transform,box-shadow] duration-100 [box-shadow:0_4px_0_hsl(var(--border))] hover:bg-muted hover:text-foreground active:translate-y-[4px] active:[box-shadow:none] motion-reduce:transition-none"
    >
      <Icon className="h-5 w-5" strokeWidth={3} />
    </button>
  );
}
