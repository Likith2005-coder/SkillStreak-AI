"use client";

/**
 * SignalBot, alive. The SVG mascot as a character that pays attention:
 *
 *   look    — eyes, face plate and shell follow the cursor as separate
 *             parallax layers, plus a gentle 3D tilt of the whole head,
 *             all driven by a spring so it settles with a little wobble
 *   react   — glances at whatever button or link you hover and grins at the
 *             primary ones; perks up when the cursor comes close
 *   notice  — watches the field you type in (and nods along; looks away from
 *             passwords), looks up/down with fast scrolling ("o" on big jumps)
 *   idle    — random blinks, look-around glances after a few still seconds,
 *             a yawn, then dozes with floating "z"s; wakes up with a hop
 *   play    — click: boing + sparkles; five fast clicks: dizzy; double-click:
 *             a 360° spin with a hop; drag it: it stretches and squeals,
 *             then springs home with a wobble; rest the cursor on its head
 *             for a second: blush + hearts
 *   talk    — short reactive lines in a bubble (see components/mascot/chatter)
 *   bus     — pages can make it react: botReact() in components/mascot/bus
 *
 * Mood also tints the face: happy is warmer/volt, curious bright cyan,
 * sleepy dim, dizzy amber, love pink.
 *
 * Cost: one set of passive input listeners shared by every bot on the page
 * (components/mascot/store). Each bot runs requestAnimationFrame only while
 * something is moving and it's on screen, and writes transforms straight to
 * the DOM, so React re-renders only when the mood or the line changes.
 * Reduced motion: a still, friendly bot that can still talk.
 *
 * `onSay` lets a wrapper (Mascot) show the lines in its own bubble instead
 * of the bot's floating one. `quiet` turns talking off for this bot.
 */

import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useDragControls, type PanInfo } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";
import { BOT_REACT_EVENT, type BotReaction } from "@/components/mascot/bus";
import { LINES, isPrimary, isSpeaker, maybeGreet, pick, register, speakAs, type Bot } from "@/components/mascot/chatter";
import { burst, hearts } from "@/components/mascot/effects";
import { attach, detach, store, type InputKind } from "@/components/mascot/store";

/* ── Moods ────────────────────────────────────────────────────── */

type Mood = "idle" | "curious" | "happy" | "sleepy" | "dizzy" | "love" | "excited" | "surprised" | "yawn";

const MOUTH: Record<Mood, string> = {
  idle: "M136 152 q24 20 48 0",
  curious: "M140 154 q20 12 40 0",
  happy: "M128 148 q32 34 64 0",
  love: "M128 148 q32 34 64 0",
  sleepy: "M146 156 q14 6 28 0",
  dizzy: "M140 156 q10 -8 20 0 q10 8 20 0",
  excited: "M130 146 q30 38 60 0 z",
  surprised: "M151 158 a9 10 0 1 0 18 0 a9 10 0 1 0 -18 0",
  yawn: "M146 156 a14 17 0 1 0 28 0 a14 17 0 1 0 -28 0",
};

/** Eye / mouth light colour per mood. */
const EYE: Record<Mood, string> = {
  idle: "hsl(186 100% 72%)",
  curious: "hsl(186 100% 80%)",
  happy: "hsl(150 100% 72%)",
  love: "hsl(330 100% 78%)",
  sleepy: "hsl(198 45% 54%)",
  dizzy: "hsl(40 100% 64%)",
  excited: "hsl(160 100% 74%)",
  surprised: "hsl(186 100% 86%)",
  yawn: "hsl(194 70% 64%)",
};

/** Halo glow colour + strength, and a faint tint on the screen. */
const GLOW: Record<Mood, [string, number]> = {
  idle: ["hsl(186 100% 56%)", 0.22],
  curious: ["hsl(186 100% 60%)", 0.3],
  happy: ["hsl(84 100% 62%)", 0.3],
  love: ["hsl(330 100% 66%)", 0.32],
  sleepy: ["hsl(222 50% 45%)", 0.12],
  dizzy: ["hsl(40 100% 60%)", 0.3],
  excited: ["hsl(84 100% 62%)", 0.34],
  surprised: ["hsl(186 100% 66%)", 0.32],
  yawn: ["hsl(210 60% 50%)", 0.16],
};
const TINT: Record<Mood, number> = {
  idle: 0,
  curious: 0.07,
  happy: 0.08,
  love: 0.12,
  sleepy: 0,
  dizzy: 0.1,
  excited: 0.1,
  surprised: 0.06,
  yawn: 0,
};

const OPEN_EYES: Partial<Record<Mood, string>> = {
  idle: "none",
  curious: "scale(1.12)",
  sleepy: "scaleY(0.25)",
  excited: "scale(1.3)",
  surprised: "scale(1.22)",
  yawn: "scaleY(0.4)",
};

/* Spring: playful but settles fast. Per second. */
const STIFF = 170;
const DAMP = 16;
const SLEEP_AFTER = 10_000;
const YAWN_AT = 8_600;
const SAY_MS = 2_500;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

type Ctl = {
  force: (m: Mood, ms: number) => void;
  boing: () => void;
  spin: () => void;
  dizzy: (ms?: number) => void;
  love: (ms?: number) => void;
  celebrate: (ms?: number) => void;
  wake: () => void;
  isDizzy: () => boolean;
  kick: () => void;
};

type Line = { id: number; text: string; side: "left" | "right" };

export function SignalBotLive({
  className,
  label = "SignalBot, the SkillStreak mascot",
  onSay,
  quiet = false,
}: {
  className?: string;
  label?: string;
  /** Show lines in your own bubble: called with the line, then null when it ends. */
  onSay?: (line: string | null) => void;
  /** This bot never talks (it still reacts). */
  quiet?: boolean;
}) {
  const reduce = useReducedMotionSafe();
  const uid = useId().replace(/:/g, "");
  const [mood, setMood] = useState<Mood>("idle");
  const moodRef = useRef<Mood>("idle");
  const [line, setLine] = useState<Line | null>(null);
  const [srLine, setSrLine] = useState("");

  const outer = useRef<HTMLDivElement>(null); // layout box + bubble anchor
  const dragLayer = useRef<HTMLDivElement>(null); // framer drag
  const root = useRef<HTMLDivElement>(null); // tilt layer (rAF)
  const squash = useRef<HTMLDivElement>(null); // boing / spin / stretch (WAAPI + drag)
  const shell = useRef<SVGGElement>(null);
  const face = useRef<SVGGElement>(null);
  const eyes = useRef<SVGGElement>(null); // follows the pointer (attribute)
  const lids = useRef<SVGGElement>(null); // blinks (CSS), nested so the two never fight
  const rings = useRef<SVGGElement>(null);
  const antenna = useRef<SVGGElement>(null);

  const ctl = useRef<Ctl | null>(null);
  const botRef = useRef<Bot | null>(null);
  const drag = useRef({ active: false, moved: false, holding: false, holdT: 0, sx: 0, sy: 0 });
  const dragControls = useDragControls();
  const onSayRef = useRef(onSay);
  onSayRef.current = onSay;

  const set = (m: Mood) => {
    if (moodRef.current === m) return;
    moodRef.current = m;
    setMood(m);
  };

  /* ── Talking, clicks and the bus (also under reduced motion) ── */
  useEffect(() => {
    const host = outer.current;
    const el = root.current;
    if (!host || !el) return;
    attach();

    let lineT = 0;
    let moodT = 0;
    let n = 0;
    let saidAt = -Infinity;
    const say = (text: string) => {
      clearTimeout(lineT);
      saidAt = performance.now();
      const r = host.getBoundingClientRect();
      const side = r.left + r.width / 2 > window.innerWidth / 2 ? "left" : "right";
      if (onSayRef.current) onSayRef.current(text);
      else setLine({ id: ++n, text, side });
      setSrLine(text);
      lineT = window.setTimeout(() => {
        onSayRef.current?.(null);
        setLine(null);
        setSrLine("");
      }, SAY_MS);
    };
    const bot: Bot = { el: host, say };
    botRef.current = quiet ? null : bot;
    const unregister = quiet ? () => {} : register(bot);
    const talk = (text: string) => !quiet && speakAs(bot, text);

    // Mood hold: the motion loop owns moods when it runs; otherwise a plain face swap.
    const hold = (m: Mood, ms: number) => {
      if (ctl.current) return ctl.current.force(m, ms);
      clearTimeout(moodT);
      set(m);
      moodT = window.setTimeout(() => set("idle"), ms);
    };

    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !quiet) maybeGreet();
    });
    io.observe(host);

    const clicks: number[] = [];
    let lastClickLine = "";
    const onClick = () => {
      if (drag.current.moved) return; // that was a drag, not a click
      const now = performance.now();
      clicks.push(now);
      while (clicks.length && now - clicks[0] > 1600) clicks.shift();
      const c = ctl.current;
      c?.boing();
      c?.wake();
      if (clicks.length >= 5) {
        clicks.length = 0;
        if (c) c.dizzy();
        else hold("dizzy", 1800);
        talk(LINES.dizzy);
      } else {
        if (!c?.isDizzy()) hold("happy", 900);
        // Don't talk over a line this bot said a moment ago (e.g. "I'm awake!").
        if (now - saidAt > 700) {
          lastClickLine = pick(LINES.click, lastClickLine);
          talk(lastClickLine);
        }
      }
    };
    const onDbl = () => {
      if (drag.current.moved) return;
      ctl.current?.spin();
      talk(LINES.spin);
    };
    el.addEventListener("click", onClick);
    el.addEventListener("dblclick", onDbl);

    const onReact = (e: Event) => {
      const r = (e as CustomEvent<BotReaction>).detail ?? {};
      const ms = r.durationMs ?? 2200;
      const c = ctl.current;
      if (r.mood === "celebrate") {
        if (c) c.celebrate(ms);
        else hold("happy", ms);
      } else if (r.mood === "love") {
        if (c) c.love(ms);
        else hold("love", ms);
      } else if (r.mood === "dizzy") {
        if (c) c.dizzy(ms);
        else hold("dizzy", ms);
      } else if (r.mood) hold(r.mood, ms);
      if (r.say && !quiet && isSpeaker(bot)) speakAs(bot, r.say);
    };
    window.addEventListener(BOT_REACT_EVENT, onReact);

    return () => {
      clearTimeout(lineT);
      clearTimeout(moodT);
      io.disconnect();
      el.removeEventListener("click", onClick);
      el.removeEventListener("dblclick", onDbl);
      window.removeEventListener(BOT_REACT_EVENT, onReact);
      unregister();
      botRef.current = null;
      onSayRef.current?.(null);
      detach();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiet]);

  /* ── Motion: look, moods, idle life, petting, typing, scrolling ── */
  useEffect(() => {
    if (reduce) {
      ctl.current = null;
      return;
    }
    const el = root.current;
    const host = dragLayer.current;
    if (!el || !host) return;

    let raf = 0;
    let visible = true;
    let last = performance.now();
    let asleep = false;
    let yawned = false;
    let forced: { mood: Mood; until: number } = { mood: "idle", until: 0 };
    let hopUntil = 0;
    let glance = { x: 0, y: 0, until: 0 };
    let lastWakeLine = -Infinity;
    let lastNod = store.typing.count;
    const pet = { start: 0, ax: 0, ay: 0, t: 0, cool: 0 };
    const press = drag.current;
    // spring state
    const cur = { x: 0, y: 0 };
    const vel = { x: 0, y: 0 };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(1 / 30, (now - last) / 1000);
      last = now;

      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.42;

      const t = store.typing;
      const typing = !!t.el?.isConnected && now - t.at < 1600;
      const scrolling = now - store.scroll.at < 450;
      const hover = store.hoverEl?.isConnected ? store.hoverEl : null;
      const dragging = drag.current.active;

      // Where to look: the field being typed in, scroll direction, an idle
      // glance, a hovered control, the pointer, or straight ahead.
      let tx = 0;
      let ty = 0;
      let dist = Infinity;
      if (asleep) {
        ty = 0.45; // head nods down
      } else if (scrolling && !typing) {
        tx = cur.x * 0.5;
        ty = store.scroll.dir * 0.8;
      } else if (!typing && now < glance.until) {
        tx = glance.x;
        ty = glance.y;
      } else {
        const look = typing ? t.el!.getBoundingClientRect() : hover && !dragging ? hover.getBoundingClientRect() : null;
        if (look || store.has) {
          const px = look ? look.left + Math.min(look.width / 2, 140) : store.x;
          const py = look ? look.top + look.height / 2 : store.y;
          const dx = px - cx;
          const dy = py - cy;
          dist = Math.hypot(dx, dy);
          tx = Math.max(-1, Math.min(1, dx / 420));
          ty = Math.max(-1, Math.min(1, dy / 320));
          if (typing && t.secret) {
            tx = tx > 0 ? -0.8 : 0.8; // "I'm not looking!"
            ty = -0.4;
          }
        }
      }

      let m: Mood;
      if (dragging) m = "excited";
      else if (now < forced.until) m = forced.mood;
      else if (asleep) m = "sleepy";
      else if (now - store.scroll.jumpAt < 700) m = "surprised";
      else if (typing) m = t.secret ? "happy" : "curious";
      else if (hover && isPrimary(hover)) m = "happy";
      else if (hover || dist < 170) m = "curious";
      else m = "idle";
      set(m);

      // Semi-implicit Euler spring toward the target.
      vel.x += ((tx - cur.x) * STIFF - vel.x * DAMP) * dt;
      vel.y += ((ty - cur.y) * STIFF - vel.y * DAMP) * dt;
      cur.x += vel.x * dt;
      cur.y += vel.y * dt;

      const hop = now < hopUntil ? Math.sin(((hopUntil - now) / 420) * Math.PI) * -10 : 0;
      el.style.transform = `perspective(600px) rotateY(${(cur.x * 16).toFixed(2)}deg) rotateX(${(-cur.y * 12).toFixed(2)}deg) translateY(${hop.toFixed(1)}px)`;
      shell.current?.setAttribute("transform", `translate(${(cur.x * 5).toFixed(2)} ${(cur.y * 4).toFixed(2)}) rotate(${(cur.x * 6).toFixed(2)} 160 132)`);
      face.current?.setAttribute("transform", `translate(${(cur.x * 11).toFixed(2)} ${(cur.y * 8).toFixed(2)})`);
      eyes.current?.setAttribute("transform", `translate(${(cur.x * 9).toFixed(2)} ${(cur.y * 7).toFixed(2)})`);
      rings.current?.setAttribute("transform", `translate(${(-cur.x * 6).toFixed(2)} 0)`);

      const moving =
        Math.abs(tx - cur.x) + Math.abs(ty - cur.y) + Math.abs(vel.x) + Math.abs(vel.y) > 0.002 ||
        now < hopUntil ||
        now < forced.until ||
        now < glance.until ||
        now - store.scroll.jumpAt < 700 ||
        scrolling ||
        typing ||
        dragging ||
        !!hover;
      if (moving && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf && visible) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const anim = (keyframes: Keyframe[], opts: KeyframeAnimationOptions) => squash.current?.animate(keyframes, opts);
    const spinAntenna = () =>
      antenna.current?.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(720deg)" }], { duration: 1400, easing: EASE });
    const force = (m: Mood, ms: number) => {
      forced = { mood: m, until: performance.now() + ms };
      kick();
    };

    // Activity wakes a dozing bot with a little startled hop.
    const wake = () => {
      if (!asleep) return;
      asleep = false;
      hopUntil = performance.now() + 420;
      const now = performance.now();
      const bot = botRef.current;
      if (bot && now - lastWakeLine > 30_000 && isSpeaker(bot)) {
        lastWakeLine = now;
        speakAs(bot, LINES.wake);
      }
      kick();
    };

    const love = (ms = 2200) => {
      force("love", ms);
      hearts(el);
    };

    // Petting: the cursor rests on the top half of the head for ~1s.
    const inHead = () => {
      const r = el.getBoundingClientRect();
      return (
        store.x > r.left + r.width * 0.18 &&
        store.x < r.right - r.width * 0.18 &&
        store.y > r.top + r.height * 0.1 &&
        store.y < r.top + r.height * 0.52
      );
    };
    const petCheck = () => {
      const now = performance.now();
      if (now < pet.cool || drag.current.active || !visible) return;
      if (!inHead()) {
        pet.start = 0;
        clearTimeout(pet.t);
        return;
      }
      if (pet.start && Math.hypot(store.x - pet.ax, store.y - pet.ay) <= 14) return;
      pet.start = now;
      pet.ax = store.x;
      pet.ay = store.y;
      clearTimeout(pet.t);
      pet.t = window.setTimeout(() => {
        if (!pet.start || !inHead() || drag.current.active) return;
        pet.start = 0;
        pet.cool = performance.now() + 6000;
        love(2200);
        const bot = botRef.current;
        if (bot) speakAs(bot, LINES.pet);
      }, 1000);
    };

    const onInput = (kind: InputKind) => {
      if (kind !== "hover") {
        yawned = false;
        wake();
      }
      if (kind === "move") petCheck();
      if (kind === "key" && visible && store.typing.count - lastNod >= 3) {
        lastNod = store.typing.count;
        anim(
          [{ transform: "translateY(0)" }, { transform: "translateY(4px) scale(1.02, 0.96)" }, { transform: "translateY(0)" }],
          { duration: 260, easing: EASE },
        );
      }
      kick();
    };
    store.subs.add(onInput);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
    });
    io.observe(el);

    // Blinks: every 2.5–6s, sometimes a double.
    let blinkT = 0;
    const blinkOnce = (g: SVGGElement) => {
      g.classList.remove("sb-blink");
      void g.getBoundingClientRect(); // restart the animation
      g.classList.add("sb-blink");
    };
    const blink = () => {
      const g = lids.current;
      const m = moodRef.current;
      if (g && visible && (m === "idle" || m === "curious")) {
        blinkOnce(g);
        if (Math.random() < 0.25) setTimeout(() => blinkOnce(g), 260);
      }
      blinkT = window.setTimeout(blink, 2500 + Math.random() * 3500);
    };
    blinkT = window.setTimeout(blink, 1200 + Math.random() * 2000);

    // Idle life: glance around after a few still seconds, yawn, then doze.
    const idleT = window.setInterval(() => {
      const now = performance.now();
      if (!store.has || asleep || drag.current.active || now < forced.until || !visible) return;
      const idleFor = now - store.lastActive;
      if (idleFor > SLEEP_AFTER) {
        asleep = true;
        kick(); // one settle pass to nod the head down
      } else if (idleFor > YAWN_AT && !yawned) {
        yawned = true;
        force("yawn", 1300);
      } else if (idleFor > 4000 && idleFor < 8200 && now > glance.until + 900 && Math.random() < 0.35) {
        glance = {
          x: (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.3),
          y: -0.15 + Math.random() * 0.25,
          until: now + 650 + Math.random() * 400,
        };
        kick();
      }
    }, 1000);

    // Touch: drag only after a short press-and-hold, so a swipe still scrolls.
    const onTouchMove = (e: TouchEvent) => {
      if (drag.current.holding) e.preventDefault();
    };
    const onCtx = (e: Event) => {
      if (drag.current.holding || drag.current.holdT) e.preventDefault();
    };
    host.addEventListener("touchmove", onTouchMove, { passive: false });
    host.addEventListener("contextmenu", onCtx);

    ctl.current = {
      force,
      kick,
      wake,
      love,
      isDizzy: () => forced.mood === "dizzy" && performance.now() < forced.until,
      boing: () => {
        anim(
          [
            { transform: "scale(1, 1)" },
            { transform: "scale(1.14, 0.84)" },
            { transform: "scale(0.9, 1.12)" },
            { transform: "scale(1.04, 0.97)" },
            { transform: "scale(1, 1)" },
          ],
          { duration: 620, easing: EASE },
        );
        burst(el);
      },
      spin: () => {
        anim(
          [
            { transform: "translateY(0) rotateY(0deg)" },
            { transform: "translateY(-18px) rotateY(180deg)", offset: 0.5 },
            { transform: "translateY(0) rotateY(360deg)" },
          ],
          { duration: 800, easing: "cubic-bezier(0.45, 0, 0.2, 1)" },
        );
        force("happy", 900);
      },
      dizzy: (ms = 1800) => {
        force("dizzy", ms);
        spinAntenna();
      },
      celebrate: (ms = 2200) => {
        force("happy", ms);
        asleep = false;
        anim(
          [
            { transform: "translateY(0) scale(1, 1)" },
            { transform: "translateY(0) scale(1.16, 0.82)", offset: 0.16 },
            { transform: "translateY(-34px) scale(0.9, 1.14)", offset: 0.42 },
            { transform: "translateY(0) scale(1.12, 0.88)", offset: 0.7 },
            { transform: "translateY(0) scale(0.97, 1.03)", offset: 0.85 },
            { transform: "translateY(0) scale(1, 1)" },
          ],
          { duration: 950, easing: "ease-out" },
        );
        burst(el, true);
        setTimeout(() => burst(el, true), 240);
        spinAntenna();
      },
    };

    return () => {
      ctl.current = null;
      cancelAnimationFrame(raf);
      store.subs.delete(onInput);
      io.disconnect();
      clearTimeout(blinkT);
      clearTimeout(pet.t);
      clearTimeout(press.holdT);
      clearInterval(idleT);
      host.removeEventListener("touchmove", onTouchMove);
      host.removeEventListener("contextmenu", onCtx);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  /* ── Drag handlers ───────────────────────────────────────────── */
  const onPointerDown = (e: ReactPointerEvent) => {
    if (reduce) return;
    const d = drag.current;
    d.moved = false;
    if (e.pointerType === "touch") {
      d.sx = e.clientX;
      d.sy = e.clientY;
      const native = e.nativeEvent;
      clearTimeout(d.holdT);
      d.holdT = window.setTimeout(() => {
        d.holdT = 0;
        d.holding = true;
        dragControls.start(native);
        squash.current?.animate([{ transform: "scale(1)" }, { transform: "scale(1.06, 0.94)" }, { transform: "scale(1)" }], {
          duration: 200,
        });
      }, 280);
    } else if (e.button === 0) {
      dragControls.start(e);
    }
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (d.holdT && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 10) {
      clearTimeout(d.holdT); // it's a scroll, not a hold
      d.holdT = 0;
    }
  };
  const endPress = () => {
    const d = drag.current;
    clearTimeout(d.holdT);
    d.holdT = 0;
    d.holding = false;
  };
  const onDragStart = () => {
    const d = drag.current;
    d.active = true;
    d.moved = true;
    if (dragLayer.current) dragLayer.current.style.zIndex = "40";
    if (squash.current) squash.current.style.transformOrigin = "50% 55%";
    ctl.current?.wake();
    ctl.current?.kick();
    if (botRef.current) speakAs(botRef.current, LINES.drag);
  };
  const onDrag = (_: unknown, info: PanInfo) => {
    const sq = squash.current;
    if (!sq) return;
    const { x, y } = info.velocity;
    const s = Math.min(0.24, Math.hypot(x, y) / 3500);
    const a = (Math.atan2(y, x) * 180) / Math.PI;
    sq.style.transform = `rotate(${a.toFixed(1)}deg) scale(${(1 + s).toFixed(3)}, ${(1 - s * 0.6).toFixed(3)}) rotate(${(-a).toFixed(1)}deg)`;
  };
  const onDragEnd = () => {
    const d = drag.current;
    d.active = false;
    d.holding = false;
    const sq = squash.current;
    if (sq) {
      sq.style.transform = "";
      sq.style.transformOrigin = "";
      sq.animate(
        [
          { transform: "scale(1, 1)" },
          { transform: "scale(0.9, 1.1)" },
          { transform: "scale(1.07, 0.94)" },
          { transform: "scale(0.98, 1.02)" },
          { transform: "scale(1, 1)" },
        ],
        { duration: 700, delay: 120, easing: "ease-out" },
      );
    }
    ctl.current?.force("happy", 1100);
    window.setTimeout(() => {
      if (dragLayer.current && !drag.current.active) dragLayer.current.style.zIndex = "";
      if (botRef.current && !drag.current.active) speakAs(botRef.current, LINES.release);
    }, 650);
  };

  const g = (id: string) => `${uid}-${id}`;
  const eye = EYE[mood];
  const [glow, glowOp] = GLOW[mood];
  const colorT = "fill 500ms ease, stroke 500ms ease";
  const openEyes = OPEN_EYES[mood];
  const squint = mood === "happy" || mood === "love";

  return (
    <div ref={outer} className={cn("relative select-none", className)} data-signalbot="" data-mood={mood}>
      {!quiet && (
        <span className="sr-only" aria-live="polite">
          {srLine}
        </span>
      )}

      <motion.div
        ref={dragLayer}
        className={cn("relative h-full w-full [-webkit-touch-callout:none]", !reduce && "cursor-grab active:cursor-grabbing")}
        drag={!reduce}
        dragControls={dragControls}
        dragListener={false}
        dragSnapToOrigin
        dragMomentum={false}
        dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
        dragElastic={0.6}
        dragTransition={{ bounceStiffness: 340, bounceDamping: 11 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPress}
        onPointerCancel={endPress}
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
      >
        {/* Floating speech bubble (when no wrapper shows the lines itself). */}
        <AnimatePresence mode="wait">
          {line && !onSay && (
            <motion.div
              key={line.id}
              aria-hidden
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -4, transition: { duration: reduce ? 0 : 0.14 } }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 24 }}
              className={cn(
                "pointer-events-none absolute bottom-[88%] z-30 whitespace-nowrap rounded-xl border border-white/10 bg-card/95 px-3 py-1.5 text-[13px] font-semibold leading-tight text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_12px_32px_-12px_rgb(0_0_0/0.85)] backdrop-blur-sm",
                line.side === "left" ? "right-[60%] origin-bottom-right" : "left-[60%] origin-bottom-left",
              )}
            >
              {line.text}
              <span
                className={cn(
                  "absolute -bottom-[5px] h-2.5 w-2.5 rotate-45 border-b border-r border-white/10 bg-card",
                  line.side === "left" ? "right-3" : "left-3",
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>


        <div ref={root} className="relative h-full w-full [transform-style:preserve-3d]">
          <div ref={squash} className="h-full w-full origin-bottom">
            <svg viewBox="0 0 320 320" fill="none" role="img" aria-label={label} className="h-full w-full overflow-visible">
              <defs>
                <radialGradient id={g("glow")} cx="50%" cy="44%" r="50%">
                  <stop offset="0%" style={{ stopColor: glow, stopOpacity: glowOp, transition: "stop-color 500ms ease, stop-opacity 500ms ease" }} />
                  <stop offset="100%" style={{ stopColor: glow, stopOpacity: 0, transition: "stop-color 500ms ease" }} />
                </radialGradient>
                <linearGradient id={g("shell")} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(228 22% 20%)" />
                  <stop offset="100%" stopColor="hsl(228 28% 7%)" />
                </linearGradient>
                <linearGradient id={g("screen")} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(230 50% 10%)" />
                  <stop offset="100%" stopColor="hsl(232 60% 5%)" />
                </linearGradient>
              </defs>

              <circle cx="160" cy="150" r="150" fill={`url(#${g("glow")})`} />

              {/* halo rings: counter-parallax so the head reads as floating above them */}
              <g ref={rings}>
                <ellipse cx="160" cy="236" rx="74" ry="17" stroke="hsl(var(--grape))" strokeWidth="3" opacity="0.75" />
                <ellipse cx="160" cy="250" rx="96" ry="21" stroke="hsl(var(--aurora-3))" strokeWidth="3" opacity="0.85" />
              </g>

              <g ref={shell}>
                {/* antenna: the tip is the volt "streak" light; brighter when it's paying attention */}
                <g ref={antenna} style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
                  <line x1="160" y1="66" x2="160" y2="38" stroke="hsl(var(--grape))" strokeWidth="3" />
                  <circle
                    cx="160"
                    cy="32"
                    r="9"
                    style={{
                      fill: mood === "love" ? "hsl(330 100% 72%)" : "hsl(var(--primary))",
                      filter:
                        mood === "idle" || mood === "sleepy" || mood === "yawn"
                          ? "none"
                          : `drop-shadow(0 0 8px ${mood === "love" ? "hsl(330 100% 66%)" : "hsl(var(--primary))"})`,
                      opacity: mood === "sleepy" ? 0.45 : 1,
                      transition: "fill 500ms ease, filter 300ms, opacity 300ms",
                    }}
                  />
                </g>

                {/* ear pods */}
                <rect x="60" y="128" width="14" height="40" rx="7" fill="hsl(var(--grape))" opacity="0.9" />
                <rect x="246" y="128" width="14" height="40" rx="7" fill="hsl(var(--grape))" opacity="0.9" />

                {/* head shell */}
                <rect x="70" y="66" width="180" height="132" rx="30" fill={`url(#${g("shell")})`} stroke="hsl(228 16% 26%)" strokeWidth="2" />
                <rect x="82" y="70" width="150" height="6" rx="3" fill="white" opacity="0.06" />

                {/* screen face: parallaxes further than the shell */}
                <g ref={face}>
                  <rect x="86" y="82" width="148" height="100" rx="20" fill={`url(#${g("screen")})`} />
                  {/* mood tint on the screen */}
                  <rect
                    x="86"
                    y="82"
                    width="148"
                    height="100"
                    rx="20"
                    style={{ fill: eye, opacity: TINT[mood], transition: "fill 500ms ease, opacity 500ms ease" }}
                  />

                  {/* blush (love) */}
                  <g style={{ opacity: mood === "love" ? 0.6 : 0, transition: "opacity 300ms ease" }}>
                    <ellipse cx="110" cy="150" rx="13" ry="7" fill="hsl(340 100% 70%)" />
                    <ellipse cx="210" cy="150" rx="13" ry="7" fill="hsl(340 100% 70%)" />
                  </g>

                  <g ref={eyes}>
                    <g ref={lids} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
                      {/* open eyes */}
                      <g
                        style={{
                          opacity: openEyes ? 1 : 0,
                          transform: openEyes && openEyes !== "none" ? openEyes : undefined,
                          transformBox: "fill-box",
                          transformOrigin: "center",
                          transition: "transform 220ms cubic-bezier(0.22,1,0.36,1), opacity 150ms",
                        }}
                      >
                        <ellipse cx="131" cy="122" rx="15" ry="19" style={{ fill: eye, transition: colorT }} />
                        <ellipse cx="189" cy="122" rx="15" ry="19" style={{ fill: eye, transition: colorT }} />
                        <circle cx="136" cy="114" r="4" fill="white" opacity="0.85" />
                        <circle cx="194" cy="114" r="4" fill="white" opacity="0.85" />
                      </g>
                      {/* happy eyes ^ ^ */}
                      <g style={{ opacity: squint ? 1 : 0, transition: "opacity 150ms" }}>
                        <path d="M117 128 q14 -20 28 0" strokeWidth="7" strokeLinecap="round" style={{ stroke: eye, transition: colorT }} />
                        <path d="M175 128 q14 -20 28 0" strokeWidth="7" strokeLinecap="round" style={{ stroke: eye, transition: colorT }} />
                      </g>
                      {/* dizzy eyes x x */}
                      <g
                        style={{ opacity: mood === "dizzy" ? 1 : 0, stroke: eye, transition: `opacity 150ms, ${colorT}` }}
                        strokeWidth="6"
                        strokeLinecap="round"
                      >
                        <path d="M121 112 l20 20 M141 112 l-20 20" />
                        <path d="M179 112 l20 20 M199 112 l-20 20" />
                      </g>
                    </g>
                  </g>

                  <path
                    d={MOUTH[mood]}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    style={{ stroke: eye, transition: `d 260ms cubic-bezier(0.22,1,0.36,1), ${colorT}` }}
                  />
                </g>
              </g>

              {/* dozing */}
              {mood === "sleepy" && (
                <g className="sb-zzz" fill="hsl(var(--aurora-3))" fontFamily="var(--font-sans)" fontWeight="700">
                  <text x="232" y="66" fontSize="22">z</text>
                  <text x="252" y="44" fontSize="16">z</text>
                </g>
              )}
            </svg>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
