"use client";

/**
 * Magnetic Domain Dock — the per-domain progress grid reimagined as a
 * macOS-dock row, ported from a Framer "MagneticCarousel" and themed to the
 * Signal palette. Each domain is a vertical slat that doubles as a progress
 * thermometer (the accent gradient fills from the bottom as topics are
 * completed). Bars magnify as the cursor nears — the one under the cursor
 * grows most, neighbours taper off by distance (smoothstep falloff). Click
 * a bar to expand it into a detail card while the others blur; click again
 * (or the backdrop) to collapse; "Open roadmap" jumps to the domain.
 *
 * The hover magnify is a continuous rAF lerp loop (no CSS transition) so it
 * tracks the cursor smoothly; the loop self-stops when values settle, so
 * idle cost is zero. Desktop-only — the caller renders the classic ring
 * grid on small screens / reduced motion.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { DomainIcon } from "@/components/shared/DomainIcon";
import { styleFor } from "@/lib/domain-style";
import { cn } from "@/lib/utils";
import type { DomainProgressTile } from "@/lib/api";

// Geometry (px) — tuned for 9 bars in a ~1400px container.
const BAR_W = 96;
const HOVER_W = 210;
const BAR_H = 380;
const HOVER_H = 435;
const OPEN_W = 560;
const GAP = 14;
const INFLUENCE = 240; // px around the cursor that feels the magnify
const BLUR = 3;
const DUR = 0.35;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

// Literal hex stops per accent for the thermometer fill (SVG-style gradients
// need real colors, and these match DomainProgressRing's stops).
const HEX: Record<string, [string, string]> = {
  rose: ["#f43f5e", "#ec4899"],
  blue: ["#3b82f6", "#6366f1"],
  violet: ["#8b5cf6", "#d946ef"],
  emerald: ["#10b981", "#14b8a6"],
  cyan: ["#06b6d4", "#0ea5e9"],
  sky: ["#0ea5e9", "#3b82f6"],
  orange: ["#f97316", "#f59e0b"],
  amber: ["#f59e0b", "#eab308"],
  teal: ["#14b8a6", "#10b981"],
  indigo: ["#6366f1", "#8b5cf6"],
};

export function MagneticDomainDock({ tiles }: { tiles: DomainProgressTile[] }) {
  const n = tiles.length;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [factors, setFactors] = useState<number[]>(() => tiles.map(() => 0));
  const [open, setOpen] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);

  // Continuous easing loop: cur lerps toward target each frame, loop stops
  // once everything settles (idle cost: zero).
  const targetRef = useRef<number[]>(tiles.map(() => 0));
  const curRef = useRef<number[]>(tiles.map(() => 0));
  const loopRef = useRef(0);
  const closeTimer = useRef(0);

  useEffect(() => {
    targetRef.current = tiles.map(() => 0);
    curRef.current = tiles.map(() => 0);
    setFactors(tiles.map(() => 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  useEffect(
    () => () => {
      cancelAnimationFrame(loopRef.current);
      clearTimeout(closeTimer.current);
    },
    []
  );

  const startLoop = () => {
    if (loopRef.current) return;
    const step = () => {
      const tgt = targetRef.current;
      const cur = curRef.current;
      let moving = false;
      for (let i = 0; i < cur.length; i++) {
        const d = (tgt[i] ?? 0) - cur[i];
        if (Math.abs(d) > 0.001) {
          cur[i] += d * 0.2;
          moving = true;
        } else {
          cur[i] = tgt[i] ?? 0;
        }
      }
      setFactors([...cur]);
      loopRef.current = moving ? requestAnimationFrame(step) : 0;
    };
    loopRef.current = requestAnimationFrame(step);
  };

  const setTargetFromCursor = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = clientX - rect.left;
    // Stable collapsed-layout slot centres so the magnify peak tracks the
    // cursor without feedback jitter.
    const totalBase = n * BAR_W + (n - 1) * GAP;
    const startX = (rect.width - totalBase) / 2;
    targetRef.current = tiles.map((_, i) => {
      const center = startX + i * (BAR_W + GAP) + BAR_W / 2;
      const dist = Math.abs(cx - center);
      const f = Math.max(0, 1 - dist / INFLUENCE);
      return f * f * (3 - 2 * f); // smoothstep falloff
    });
    startLoop();
  };

  const close = () => {
    targetRef.current = tiles.map(() => 0);
    curRef.current = tiles.map(() => 0);
    setFactors(tiles.map(() => 0));
    setClosing(true);
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(
      () => setClosing(false),
      DUR * 1000
    );
    setOpen(null);
  };

  const sizeFor = (i: number) => {
    if (open !== null) {
      return i === open
        ? { width: OPEN_W, height: HOVER_H }
        : { width: BAR_W, height: BAR_H };
    }
    const f = factors[i] ?? 0;
    return {
      width: BAR_W + (HOVER_W - BAR_W) * f,
      height: BAR_H + (HOVER_H - BAR_H) * f,
    };
  };

  // Open/close eases via CSS; hover magnify has NO CSS transition — the
  // rAF loop drives it smoothly.
  const openEase = `width ${DUR}s ${EASE}, height ${DUR}s ${EASE}, filter ${DUR}s ${EASE}, opacity ${DUR}s ${EASE}`;
  const barTransition = open !== null || closing ? openEase : "none";

  return (
    <div
      ref={containerRef}
      className="relative flex h-[470px] w-full items-center justify-center"
      style={{ gap: GAP }}
      onMouseMove={(e) => {
        if (open !== null) return;
        setTargetFromCursor(e.clientX);
      }}
      onMouseLeave={() => {
        if (open !== null) return;
        targetRef.current = tiles.map(() => 0);
        startLoop();
      }}
    >
      {/* backdrop — click anywhere to collapse the open card */}
      <div
        className="absolute inset-0 z-[1]"
        style={{ pointerEvents: open !== null ? "auto" : "none" }}
        onClick={close}
      />

      {tiles.map((tile, i) => {
        const { width, height } = sizeFor(i);
        const isOpen = open === i;
        const blurred = open !== null && !isOpen;
        const s = styleFor(tile.color);
        const [hexFrom, hexTo] = HEX[tile.color] ?? HEX.indigo;
        const pct =
          tile.total === 0 ? 0 : Math.round((tile.done / tile.total) * 100);
        const f = factors[i] ?? 0;

        const barStyle: CSSProperties = {
          flex: "none",
          width,
          height,
          transition: barTransition,
          willChange: "width, height",
          zIndex: isOpen ? 3 : 2,
          filter: blurred ? `blur(${BLUR}px)` : "none",
          opacity: blurred ? 0.55 : 1,
        };

        return (
          <div
            key={tile.slug}
            style={barStyle}
            onClick={(e) => {
              e.stopPropagation();
              if (isOpen) close();
              else setOpen(i);
            }}
            className={cn(
              "group relative cursor-pointer overflow-hidden rounded-2xl border bg-card/50 backdrop-blur",
              isOpen ? "border-white/15" : "border-border hover:border-white/15"
            )}
          >
            {/* thermometer fill — completion rises from the bottom */}
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0"
              style={{
                height: `${Math.max(pct, tile.done > 0 ? 6 : 0)}%`,
                background: `linear-gradient(to top, ${hexFrom}55, ${hexTo}22)`,
                boxShadow: `0 -1px 12px ${hexFrom}44`,
              }}
            />
            {/* faint accent wash so even 0% bars carry their colour */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, ${hexFrom}14, transparent 55%)`,
              }}
            />

            {/* ── Slat content (collapsed / magnified) ── */}
            <div
              className="absolute inset-0 flex flex-col items-center gap-2 py-5"
              style={{
                opacity: isOpen ? 0 : 1,
                transition: `opacity ${DUR * 0.6}s ${EASE}`,
                pointerEvents: "none",
              }}
            >
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-white/10",
                  s.iconBg
                )}
              >
                <DomainIcon name={tile.icon} className={cn("h-5 w-5", s.text)} />
              </div>
              {/* name gets the flexible middle and clips before it can ever
                  collide with the % block below */}
              <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
                <span
                  className={cn(
                    "whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.22em] [writing-mode:vertical-rl]",
                    s.text
                  )}
                >
                  {tile.name}
                </span>
              </div>
              {/* fixed-height stat block — the count line always reserves its
                  row, so nothing shifts or overlaps as it fades in */}
              <div className="shrink-0 text-center">
                <div
                  className={cn("text-xl font-bold tabular-nums", s.text)}
                  style={{ opacity: 0.35 + f * 0.65 }}
                >
                  {pct}%
                </div>
                <div
                  className="h-4 text-[10px] tabular-nums text-muted-foreground"
                  style={{ opacity: f }}
                >
                  {tile.done}/{tile.total}
                </div>
              </div>
            </div>

            {/* ── Open detail card ── */}
            <div
              className="absolute inset-0 flex flex-col justify-between p-6"
              style={{
                opacity: isOpen ? 1 : 0,
                transition: `opacity ${DUR}s ${EASE} ${isOpen ? DUR * 0.4 : 0}s`,
                pointerEvents: isOpen ? "auto" : "none",
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-white/10",
                      s.iconBg
                    )}
                  >
                    <DomainIcon
                      name={tile.icon}
                      className={cn("h-6 w-6", s.text)}
                    />
                  </div>
                  <div>
                    <div className="text-lg font-semibold tracking-tight text-foreground">
                      {tile.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tile.done} of {tile.total} topics completed
                    </div>
                  </div>
                </div>
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card/60 text-muted-foreground">
                  <X className="h-3.5 w-3.5" />
                </span>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <div
                    className={cn(
                      "text-6xl font-bold tabular-nums tracking-tight",
                      s.text
                    )}
                    style={{ textShadow: `0 0 36px ${hexFrom}66` }}
                  >
                    {pct}%
                  </div>
                  {tile.avgScore !== null && (
                    <div className="mt-1 inline-flex rounded-full border border-border bg-card/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      avg quiz {tile.avgScore}/5
                    </div>
                  )}
                </div>
                <Link
                  href={`/domains/${tile.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform hover:translate-x-0.5",
                    s.gradientFrom,
                    s.gradientTo
                  )}
                >
                  Open roadmap
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
