"use client";

/**
 * SignalBot as the landing page's companion: pinned to the bottom-right
 * corner, it rides along while the visitor scrolls and narrates the page.
 *
 *   appear   a spring drop-in once the boot intro lifts (introBus), after the
 *            hero has had its opening
 *   follow   fixed in the corner, with a little physical response to scrolling:
 *            scroll velocity → a lagging lift + lean (useVelocity → useSpring →
 *            transform). SignalBotLive already turns its eyes toward the scroll
 *            direction, so this only adds the body's inertia.
 *   narrate  each `[data-narrate]` section says its line once per visit as it
 *            crosses the middle of the screen. Lines are spaced at least
 *            NARRATE_GAP apart; a line that has to wait is dropped if its
 *            section has scrolled away by then.
 *   make way when a `[data-bot-avoid]` element (a CTA row) passes under it
 *            in the bottom corner, it tucks half off the edge so it never covers
 *            a button, and peeks back out after.
 *
 * Reduced motion: no drop-in, sway or tuck animation; it is simply there and
 * can still talk.
 */

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform, useVelocity } from "framer-motion";
import { SignalBotLive } from "@/components/3d/SignalBotLive";
import { botReact, type BotMood } from "@/components/mascot/bus";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useIntroDone } from "./introBus";

const NARRATE_GAP = 4200;
/** Wait for the hero's opening (and the bot's own greeting) before narrating. */
const APPEAR_DELAY = 1.5;
const FIRST_LINE_AFTER = (APPEAR_DELAY + 3.2) * 1000;
/** Height of the bottom band (px) the bot occupies, for making way. */
const AVOID_BAND = 132;

export function CompanionBot() {
  const reduce = useReducedMotionSafe();
  const introDone = useIntroDone();
  const box = useRef<HTMLDivElement>(null);
  const tucked = useTucked(introDone, box);
  useNarration(introDone);

  // Scroll inertia: velocity (px/s) → a smoothed, clamped lift and lean.
  // Scrolling down, the page pulls the bot along and it lags a touch behind.
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { stiffness: 220, damping: 32, mass: 0.6 });
  const y = useTransform(smooth, [-2600, 0, 2600], [12, 0, -12], { clamp: true });
  const rotate = useTransform(smooth, [-2600, 0, 2600], [-7, 0, 7], { clamp: true });

  if (!introDone) return null;

  const bot = (
    <SignalBotLive className="h-full w-full" label="SignalBot, your AI tutor. Click me!" />
  );

  return (
    <div ref={box} className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom,0px)_+_1.25rem)] right-[max(1.25rem,env(safe-area-inset-right))] z-40 h-[72px] w-[72px] sm:bottom-[calc(env(safe-area-inset-bottom,0px)_+_2rem)] sm:right-[max(2rem,env(safe-area-inset-right))] sm:h-24 sm:w-24">
      {reduce ? (
        <div
          className="pointer-events-auto h-full w-full"
          style={{ transform: tucked ? "translateX(62%)" : undefined }}
        >
          {bot}
        </div>
      ) : (
        <motion.div
          className="pointer-events-auto h-full w-full"
          initial={{ opacity: 0, y: -140, scale: 0.5, rotate: -12 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 15, mass: 0.9, delay: APPEAR_DELAY }}
        >
          {/* make way for a CTA: tuck half off the edge, peek back after */}
          <motion.div
            className="h-full w-full"
            animate={tucked ? { x: "62%", rotate: -14 } : { x: "0%", rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <motion.div className="h-full w-full" style={{ y, rotate, transformOrigin: "50% 85%" }}>
              <div className="anim-bob-6 h-full w-full">{bot}</div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * True while a `[data-bot-avoid]` element (a CTA row) passes through the
 * bot's corner: in the bottom band of the screen AND horizontally under the
 * bot. On phones that's every full-width CTA; on desktop only rows that reach
 * the right edge (e.g. the footer links on narrower laptops).
 */
function useTucked(active: boolean, box: React.RefObject<HTMLDivElement>) {
  const [tucked, setTucked] = useState(false);
  useEffect(() => {
    if (!active) return;
    let io: IntersectionObserver | null = null;
    const under = new Set<Element>();
    const build = () => {
      io?.disconnect();
      under.clear();
      setTucked(false);
      io = new IntersectionObserver(
        (entries) => {
          const botLeft = box.current?.getBoundingClientRect().left ?? window.innerWidth;
          entries.forEach((e) => {
            const r = e.boundingClientRect;
            if (e.isIntersecting && r.right > botLeft - 8) under.add(e.target);
            else under.delete(e.target);
          });
          setTucked(under.size > 0);
        },
        // Observe only the bottom band of the viewport the bot sits in.
        { rootMargin: `-${Math.max(0, window.innerHeight - AVOID_BAND)}px 0px 0px 0px` },
      );
      document.querySelectorAll("[data-bot-avoid]").forEach((el) => io!.observe(el));
    };
    build();
    let t = 0;
    const onResize = () => {
      clearTimeout(t);
      t = window.setTimeout(build, 200);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      io?.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [active, box]);
  return tucked;
}

/**
 * Section narration. `data-narrate="line"` (and optional `data-narrate-mood`)
 * on a section makes the bot say the line once per visit when the section
 * crosses the middle of the screen.
 */
function useNarration(active: boolean) {
  const readyAt = useRef(0);
  useEffect(() => {
    if (!active) return;
    readyAt.current = performance.now() + FIRST_LINE_AFTER;
    let lastAt = -Infinity;
    let timer = 0;
    let pending: Element | null = null;
    const said = new Set<Element>();
    const visible = new Set<Element>();

    const sayNow = (el: Element) => {
      const line = el.getAttribute("data-narrate");
      if (!line) return;
      said.add(el);
      lastAt = performance.now();
      const mood = (el.getAttribute("data-narrate-mood") || undefined) as BotMood | undefined;
      botReact({ say: line, mood, durationMs: 2400 });
    };
    const flush = () => {
      timer = 0;
      const el = pending;
      pending = null;
      // Only if it's still on screen; otherwise it can try again next time.
      if (el && visible.has(el) && !said.has(el)) sayNow(el);
    };
    const request = (el: Element) => {
      if (said.has(el)) return;
      const now = performance.now();
      const at = Math.max(lastAt + NARRATE_GAP, readyAt.current);
      if (now >= at && !pending) return sayNow(el);
      pending = el; // newest section wins the queue
      clearTimeout(timer);
      timer = window.setTimeout(flush, Math.max(0, at - now));
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            visible.add(e.target);
            request(e.target);
          } else visible.delete(e.target);
        });
      },
      // a thin band across the middle of the screen
      { rootMargin: "-42% 0px -42% 0px" },
    );
    document.querySelectorAll("[data-narrate]").forEach((el) => io.observe(el));
    return () => {
      clearTimeout(timer);
      io.disconnect();
    };
  }, [active]);
}
