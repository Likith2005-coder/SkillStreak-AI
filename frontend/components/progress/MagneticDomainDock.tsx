"use client";

/**
 * Magnetic Domain Dock — the per-domain progress grid reimagined as a
 * macOS-dock row, ported from a Framer "MagneticCarousel" and themed to
 * Midnight. Each domain is a dark hairline slat that doubles as a
 * progress thermometer (the domain colour fills from the bottom as topics are
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
import { Link } from "next-view-transitions";
import { ArrowRight, X } from "lucide-react";
import { DomainIcon } from "@/components/shared/DomainIcon";
import { hexFor, styleFor } from "@/lib/domain-style";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
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
        const [hex] = hexFor(tile.color);
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
              "group relative cursor-pointer overflow-hidden rounded-2xl border bg-card shadow-[inset_0_1px_0_rgb(255_255_255/0.05),0_12px_32px_-16px_rgb(0_0_0/0.7)]",
              isOpen ? "border-white/15" : "border-white/[0.08] hover:border-white/20"
            )}
          >
            {/* thermometer fill — completion rises from the bottom, its
                surface a glowing line in the domain colour */}
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0"
              style={{
                height: `${Math.max(pct, tile.done > 0 ? 6 : 0)}%`,
                background: `linear-gradient(to top, ${hex}10, ${hex}33)`,
                borderTop: tile.done > 0 ? `2px solid ${hex}` : undefined,
                boxShadow: tile.done > 0 ? `0 -6px 18px -6px ${hex}` : undefined,
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
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1",
                  s.iconBg,
                  s.ring
                )}
              >
                <DomainIcon name={tile.icon} className={cn("h-5 w-5", s.text)} />
              </div>
              {/* name gets the flexible middle and clips before it can ever
                  collide with the % block below */}
              <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
                <span
                  className={cn(
                    "whitespace-nowrap text-sm font-semibold [writing-mode:vertical-rl]",
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
                  className={cn("font-display text-2xl tabular-nums", s.text)}
                >
                  {pct}%
                </div>
                <div
                  className="h-4 font-mono text-[11px] tabular-nums text-muted-foreground"
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
                      "flex h-14 w-14 items-center justify-center rounded-xl ring-1",
                      s.iconBg,
                      s.ring
                    )}
                  >
                    <DomainIcon
                      name={tile.icon}
                      className={cn("h-7 w-7", s.text)}
                    />
                  </div>
                  <div>
                    <div className="font-display text-2xl text-foreground">
                      {tile.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tile.done} of {tile.total} topics completed
                    </div>
                  </div>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-muted-foreground">
                  <X className="h-4 w-4" strokeWidth={2} />
                </span>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <div
                    className={cn("font-display text-7xl leading-none tabular-nums", s.text)}
                    style={{ textShadow: `0 0 28px ${hex}80` }}
                  >
                    {pct}%
                  </div>
                  {tile.avgScore !== null && (
                    <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                      avg quiz {tile.avgScore}/5
                    </div>
                  )}
                </div>
                <Link
                  href={`/domains/${tile.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className={buttonVariants({ size: "lg" })}
                >
                  Open roadmap
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
