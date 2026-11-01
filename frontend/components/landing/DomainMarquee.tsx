"use client";

/**
 * The nine domains as an endless rail of type whose speed answers the
 * scroll: it drifts on its own, rushes ahead while the page is scrolling
 * (and runs backwards while scrolling up), then eases back to its drift.
 *
 * One motion value written from useAnimationFrame: no React renders per
 * frame, and the loop idles while the rail is off screen. Hovering pauses it
 * so a name can be read. Reduced motion: a still row.
 */

import { useEffect, useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

// All nine domains, set as type. Each name takes its domain hue on hover.
const DOMAINS = [
  { name: "Cybersecurity", hover: "hover:text-rose-300" },
  { name: "Web Development", hover: "hover:text-blue-300" },
  { name: "Artificial Intelligence", hover: "hover:text-violet-300" },
  { name: "Machine Learning", hover: "hover:text-emerald-300" },
  { name: "Data Science", hover: "hover:text-cyan-300" },
  { name: "Cloud Computing", hover: "hover:text-sky-300" },
  { name: "DevOps", hover: "hover:text-orange-300" },
  { name: "Blockchain", hover: "hover:text-amber-300" },
  { name: "Internet of Things", hover: "hover:text-teal-300" },
];

/** Base drift, in % of the doubled track per second (50% = one full loop). */
const DRIFT = 50 / 38;

const wrap = (min: number, max: number, v: number) => {
  const r = max - min;
  return ((((v - min) % r) + r) % r) + min;
};

export function DomainMarquee() {
  const reduce = useReducedMotionSafe();
  const rail = useRef<HTMLDivElement>(null);
  const onScreen = useRef(true);
  const paused = useRef(false);
  const dir = useRef(-1); // -1 runs leftward

  const base = useMotionValue(0);
  const x = useTransform(base, (v) => `${wrap(-50, 0, v)}%`);

  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 });

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (onScreen.current = e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (reduce || !onScreen.current) return;
    const v = smooth.get();
    if (v < -40) dir.current = 1;
    else if (v > 40) dir.current = -1;
    // Scrolling down runs the rail leftward, scrolling up runs it back;
    // 1× at rest, up to 6× during a fast scroll.
    const speed = paused.current ? 0 : DRIFT * (1 + Math.min(5, Math.abs(v) / 600));
    base.set(base.get() + dir.current * speed * (Math.min(delta, 64) / 1000));
  });

  // Duplicate the list so the loop is seamless.
  const items = [...DOMAINS, ...DOMAINS];
  return (
    <div
      ref={rail}
      onPointerEnter={() => (paused.current = true)}
      onPointerLeave={() => (paused.current = false)}
      className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]"
    >
      <motion.ul className="flex w-max items-center will-change-transform" style={reduce ? undefined : { x }}>
        {items.map((d, i) => (
          <li
            key={`${d.name}-${i}`}
            aria-hidden={i >= DOMAINS.length || undefined}
            className="flex shrink-0 items-center"
          >
            <span className={`whitespace-nowrap px-6 font-display text-4xl text-foreground/85 transition-colors duration-300 md:px-8 md:text-6xl ${d.hover}`}>
              {d.name}
            </span>
            <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.8)]" />
          </li>
        ))}
      </motion.ul>
    </div>
  );
}
