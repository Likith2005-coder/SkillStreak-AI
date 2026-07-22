"use client";

/**
 * EmojiBurst — wraps any clickable child and fires a playful emoji burst from
 * the click point. Adapted from Originkit's "Emoji Burst" (Framer) into a
 * plain React wrapper for our stack: raw rAF particle physics, no walls
 * (emojis fly off freely under gravity), reduced-motion aware.
 *
 * Usage:
 *   <EmojiBurst>
 *     <Link href="/register">Get started</Link>
 *   </EmojiBurst>
 *
 * The burst fires on pointer-down so it's already blooming as client
 * navigation kicks in. Purely decorative — never blocks the child's own click.
 */

import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// On-brand + cute: robot mascot, streak fire, signal spark, momentum.
const DEFAULT_EMOJIS = ["🤖", "🔥", "⚡", "✨", "⭐", "🚀", "🧠", "🏆", "💜", "🎉"];

interface Particle {
  el: HTMLSpanElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  size: number;
  life: number;
}

export function EmojiBurst({
  children,
  emojis = DEFAULT_EMOJIS,
  burstCount = 16,
  power = 12,
  spread = 55,
  gravity = 0.6,
  emojiSize = 22,
  className = "",
}: {
  children: React.ReactNode;
  emojis?: string[];
  burstCount?: number;
  power?: number;
  spread?: number;
  gravity?: number;
  emojiSize?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const layerRef = useRef<HTMLSpanElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const lastTsRef = useRef<number>(0);

  const step = useCallback((ts: number) => {
    const cont = containerRef.current;
    const arr = particlesRef.current;
    if (!cont) {
      rafRef.current = 0;
      return;
    }
    let dt = lastTsRef.current ? (ts - lastTsRef.current) / 16.6667 : 1;
    lastTsRef.current = ts;
    if (dt > 3) dt = 3;
    // Burst overflows the button (visible: false clip would trap it), so we
    // measure against the viewport-ish bounds via the layer's own box.
    const layer = layerRef.current;
    const W = layer ? layer.clientWidth : cont.clientWidth;
    const H = layer ? layer.clientHeight : cont.clientHeight;
    for (let i = arr.length - 1; i >= 0; i--) {
      const p = arr[i];
      p.vy += gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vrot * dt;
      p.life -= dt;
      if (
        p.life <= 0 ||
        p.y > H + p.size * 3 ||
        p.x < -p.size * 4 ||
        p.x > W + p.size * 4
      ) {
        p.el.remove();
        arr.splice(i, 1);
        continue;
      }
      const fade = p.life < 22 ? Math.max(0, p.life / 22) : 1;
      p.el.style.opacity = String(fade);
      p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`;
    }
    if (arr.length > 0) {
      rafRef.current = requestAnimationFrame(step);
    } else {
      rafRef.current = 0;
      lastTsRef.current = 0;
    }
  }, [gravity]);

  const burst = useCallback(
    (clientX: number, clientY: number) => {
      if (reduce || typeof window === "undefined") return;
      const cont = containerRef.current;
      const layer = layerRef.current;
      if (!cont || !layer) return;

      const safe = emojis.length ? emojis : ["🎉"];
      const cr = cont.getBoundingClientRect();
      // Origin relative to the burst layer (which is centred on the container).
      const ox = clientX - cr.left;
      const oy = clientY - cr.top;

      const arr = particlesRef.current;
      const MAX = 120;
      const size = emojiSize;
      for (let k = 0; k < burstCount; k++) {
        if (arr.length >= MAX) break;
        const el = document.createElement("span");
        el.textContent = safe[(Math.random() * safe.length) | 0];
        el.style.position = "absolute";
        el.style.left = "0px";
        el.style.top = "0px";
        el.style.fontSize = `${size}px`;
        el.style.lineHeight = "1";
        el.style.willChange = "transform, opacity";
        el.style.pointerEvents = "none";
        el.style.userSelect = "none";
        el.setAttribute("aria-hidden", "true");
        layer.appendChild(el);
        // Biased straight up (-90°) with left/right spread.
        const ang = ((-90 + (Math.random() * 2 - 1) * spread) * Math.PI) / 180;
        const speed = power * (0.65 + Math.random() * 0.8);
        arr.push({
          el,
          x: ox - size / 2,
          y: oy - size / 2,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          rot: Math.random() * 360,
          vrot: (Math.random() * 2 - 1) * 14,
          size,
          life: 220,
        });
      }
      if (!rafRef.current) {
        lastTsRef.current = 0;
        rafRef.current = requestAnimationFrame(step);
      }
    },
    [reduce, emojis, burstCount, power, spread, emojiSize, step]
  );

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      for (const p of particlesRef.current) p.el.remove();
      particlesRef.current = [];
    };
  }, []);

  return (
    <span
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onPointerDown={(e) => burst(e.clientX, e.clientY)}
    >
      {children}
      {/* Overflow-visible layer so emojis fly outside the button bounds. */}
      <span
        ref={layerRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-50 overflow-visible"
      />
    </span>
  );
}
