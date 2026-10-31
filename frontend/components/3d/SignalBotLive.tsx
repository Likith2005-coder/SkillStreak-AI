"use client";

/**
 * SignalBot, alive. The SVG mascot as a character that pays attention:
 *
 *   look    — eyes, face plate and shell follow the cursor as separate
 *             parallax layers, plus a gentle 3D tilt of the whole head,
 *             all driven by a spring so it settles with a little wobble
 *   react   — glances at whatever button or link you hover and grins at the
 *             primary ones; perks up when the cursor comes close
 *   idle    — random blinks (sometimes a double), dozes off with floating
 *             "z"s after a while without movement, wakes up with a hop
 *   play    — click it: squash-and-stretch boing + sparkles; click five
 *             times fast and it gets dizzy
 *
 * Cost: one pointer listener shared by every bot on the page (module-level
 * store). Each bot runs requestAnimationFrame only while something is moving
 * and it's on screen, and writes transforms straight to the DOM, so React
 * never re-renders per frame. Reduced motion: a still, friendly bot.
 */

import { useEffect, useId, useRef, useState } from "react";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";

/* ── One shared pointer for every bot ─────────────────────────── */

type Store = {
  x: number;
  y: number;
  has: boolean;
  lastMove: number;
  hoverEl: Element | null;
  subs: Set<() => void>;
};
const store: Store = { x: 0, y: 0, has: false, lastMove: 0, hoverEl: null, subs: new Set() };
let listeners = 0;
const notify = () => store.subs.forEach((fn) => fn());
const onMove = (e: PointerEvent) => {
  store.x = e.clientX;
  store.y = e.clientY;
  store.has = true;
  store.lastMove = performance.now();
  notify();
};
const onOver = (e: PointerEvent) => {
  const el = (e.target as Element | null)?.closest?.("a, button, [role='button']") ?? null;
  if (el !== store.hoverEl) {
    store.hoverEl = el;
    notify();
  }
};
function attach() {
  if (listeners++ > 0) return;
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onMove, { passive: true });
  window.addEventListener("pointerover", onOver, { passive: true });
}
function detach() {
  if (--listeners > 0) return;
  window.removeEventListener("pointermove", onMove);
  window.removeEventListener("pointerdown", onMove);
  window.removeEventListener("pointerover", onOver);
}

/* ── Moods ────────────────────────────────────────────────────── */

type Mood = "idle" | "curious" | "happy" | "sleepy" | "dizzy";

const MOUTH: Record<Mood, string> = {
  idle: "M136 152 q24 20 48 0",
  curious: "M140 154 q20 12 40 0",
  happy: "M128 148 q32 34 64 0",
  sleepy: "M146 156 q14 6 28 0",
  dizzy: "M140 156 q10 -8 20 0 q10 8 20 0",
};

const isPrimary = (el: Element | null) =>
  !!el && /\bbg-primary\b/.test((el as HTMLElement).className?.toString?.() ?? "");

/* Spring: playful but settles fast. Per second. */
const STIFF = 170;
const DAMP = 16;
const SLEEP_AFTER = 10_000;

export function SignalBotLive({
  className,
  label = "SignalBot, the SkillStreak mascot",
}: {
  className?: string;
  label?: string;
}) {
  const reduce = useReducedMotionSafe();
  const uid = useId().replace(/:/g, "");
  const [mood, setMood] = useState<Mood>("idle");
  const moodRef = useRef<Mood>("idle");

  const root = useRef<HTMLDivElement>(null); // tilt layer (rAF)
  const squash = useRef<HTMLDivElement>(null); // click boing (WAAPI)
  const shell = useRef<SVGGElement>(null);
  const face = useRef<SVGGElement>(null);
  const eyes = useRef<SVGGElement>(null); // follows the pointer (attribute)
  const lids = useRef<SVGGElement>(null); // blinks (CSS), nested so the two never fight
  const rings = useRef<SVGGElement>(null);
  const antenna = useRef<SVGGElement>(null);

  const set = (m: Mood) => {
    if (moodRef.current === m) return;
    moodRef.current = m;
    setMood(m);
  };

  useEffect(() => {
    if (reduce) return;
    const el = root.current;
    if (!el) return;

    attach();
    let raf = 0;
    let visible = true;
    let last = performance.now();
    let dizzyUntil = 0;
    let happyUntil = 0;
    let hopUntil = 0;
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

      // Where to look: a hovered control, else the pointer, else straight ahead.
      let tx = 0;
      let ty = 0;
      const sleeping = moodRef.current === "sleepy";
      const target = store.hoverEl?.isConnected ? store.hoverEl.getBoundingClientRect() : null;
      const px = target ? target.left + target.width / 2 : store.x;
      const py = target ? target.top + target.height / 2 : store.y;
      let dist = Infinity;
      if (store.has && !sleeping) {
        const dx = px - cx;
        const dy = py - cy;
        dist = Math.hypot(dx, dy);
        tx = Math.max(-1, Math.min(1, dx / 420));
        ty = Math.max(-1, Math.min(1, dy / 320));
      } else if (sleeping) {
        ty = 0.45; // head nods down
      }

      // Mood from attention (dizzy and sleepy are owned by their timers).
      if (now < dizzyUntil) set("dizzy");
      else if (now < happyUntil) set("happy");
      else if (!sleeping) {
        if (target && isPrimary(store.hoverEl)) set("happy");
        else if (target || dist < 170) set("curious");
        else set("idle");
      }

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
        now < dizzyUntil ||
        now < happyUntil ||
        !!target;
      if (moving && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf && visible) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    // Any pointer activity wakes a dozing bot with a little startled hop.
    const wake = () => {
      if (moodRef.current === "sleepy") {
        set("idle");
        hopUntil = performance.now() + 420;
      }
      kick();
    };
    store.subs.add(wake);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
    });
    io.observe(el);

    // Blinks: every 2.5–6s, sometimes a double.
    let blinkT = 0;
    const blink = () => {
      const g = lids.current;
      if (g && moodRef.current !== "sleepy" && moodRef.current !== "dizzy") {
        g.classList.remove("sb-blink");
        void g.getBoundingClientRect(); // restart the animation
        g.classList.add("sb-blink");
        if (Math.random() < 0.25) setTimeout(() => {
          g.classList.remove("sb-blink");
          void g.getBoundingClientRect();
          g.classList.add("sb-blink");
        }, 260);
      }
      blinkT = window.setTimeout(blink, 2500 + Math.random() * 3500);
    };
    blinkT = window.setTimeout(blink, 1200 + Math.random() * 2000);

    // Doze off when the pointer has been still for a while.
    const idleT = window.setInterval(() => {
      if (store.has && performance.now() - store.lastMove > SLEEP_AFTER && moodRef.current !== "dizzy") {
        set("sleepy");
        kick(); // one settle pass to nod the head down
      }
    }, 1000);

    // Click: boing + sparkles; five quick clicks = dizzy.
    const clicks: number[] = [];
    const onClick = () => {
      const now = performance.now();
      clicks.push(now);
      while (clicks.length && now - clicks[0] > 1600) clicks.shift();
      squash.current?.animate(
        [
          { transform: "scale(1, 1)" },
          { transform: "scale(1.14, 0.84)" },
          { transform: "scale(0.9, 1.12)" },
          { transform: "scale(1.04, 0.97)" },
          { transform: "scale(1, 1)" },
        ],
        { duration: 620, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
      burst(el);
      if (clicks.length >= 5) {
        clicks.length = 0;
        dizzyUntil = now + 1800;
        antenna.current?.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(720deg)" }], {
          duration: 1400,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        });
      } else if (now >= dizzyUntil) {
        happyUntil = now + 900;
      }
      wake();
    };
    el.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      store.subs.delete(wake);
      io.disconnect();
      clearTimeout(blinkT);
      clearInterval(idleT);
      el.removeEventListener("click", onClick);
      detach();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const g = (id: string) => `${uid}-${id}`;

  return (
    <div
      ref={root}
      className={cn("relative select-none [transform-style:preserve-3d]", !reduce && "cursor-pointer", className)}
      data-mood={mood}
    >
      <div ref={squash} className="h-full w-full origin-bottom">
        <svg viewBox="0 0 320 320" fill="none" role="img" aria-label={label} className="h-full w-full overflow-visible">
          <defs>
            <radialGradient id={g("glow")} cx="50%" cy="44%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--aurora-3))" stopOpacity="0.22" />
              <stop offset="100%" stopColor="hsl(var(--aurora-3))" stopOpacity="0" />
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
                fill="hsl(var(--primary))"
                className="transition-[filter,opacity] duration-300"
                style={{
                  filter: mood === "idle" || mood === "sleepy" ? "none" : "drop-shadow(0 0 8px hsl(var(--primary)))",
                  opacity: mood === "sleepy" ? 0.45 : 1,
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

              <g ref={eyes}>
              <g ref={lids} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
                {/* open eyes (idle / curious) */}
                <g
                  className="transition-opacity duration-150"
                  style={{
                    opacity: mood === "idle" || mood === "curious" || mood === "sleepy" ? 1 : 0,
                    transform: mood === "curious" ? "scale(1.12)" : mood === "sleepy" ? "scaleY(0.25)" : undefined,
                    transformBox: "fill-box",
                    transformOrigin: "center",
                    transition: "transform 220ms cubic-bezier(0.22,1,0.36,1), opacity 150ms",
                  }}
                >
                  <ellipse cx="131" cy="122" rx="15" ry="19" fill="hsl(186 100% 72%)" />
                  <ellipse cx="189" cy="122" rx="15" ry="19" fill="hsl(186 100% 72%)" />
                  <circle cx="136" cy="114" r="4" fill="white" opacity="0.85" />
                  <circle cx="194" cy="114" r="4" fill="white" opacity="0.85" />
                </g>
                {/* happy eyes ^ ^ */}
                <g className="transition-opacity duration-150" style={{ opacity: mood === "happy" ? 1 : 0 }}>
                  <path d="M117 128 q14 -20 28 0" stroke="hsl(186 100% 72%)" strokeWidth="7" strokeLinecap="round" />
                  <path d="M175 128 q14 -20 28 0" stroke="hsl(186 100% 72%)" strokeWidth="7" strokeLinecap="round" />
                </g>
                {/* dizzy eyes x x */}
                <g className="transition-opacity duration-150" style={{ opacity: mood === "dizzy" ? 1 : 0 }} stroke="hsl(186 100% 72%)" strokeWidth="6" strokeLinecap="round">
                  <path d="M121 112 l20 20 M141 112 l-20 20" />
                  <path d="M179 112 l20 20 M199 112 l-20 20" />
                </g>
              </g>
              </g>

              <path
                d={MOUTH[mood]}
                stroke="hsl(186 100% 72%)"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
                style={{ transition: "d 260ms cubic-bezier(0.22,1,0.36,1)" }}
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
  );
}

/* Sparkles out of the bot on click. Plain DOM + WAAPI, removed when done. */
function burst(host: HTMLElement) {
  const colors = ["hsl(var(--primary))", "hsl(var(--aurora-3))", "hsl(var(--grape))", "hsl(var(--xp))"];
  for (let i = 0; i < 9; i++) {
    const s = document.createElement("span");
    s.textContent = "✦";
    s.setAttribute("aria-hidden", "true");
    s.style.cssText = `position:absolute;left:50%;top:38%;font-size:${10 + Math.random() * 10}px;color:${colors[i % colors.length]};pointer-events:none;text-shadow:0 0 8px currentColor;z-index:2`;
    host.appendChild(s);
    const a = (Math.PI * 2 * i) / 9 + Math.random() * 0.5;
    const d = 46 + Math.random() * 40;
    s.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.4)", opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(1) rotate(${Math.random() * 180}deg)`, opacity: 0 },
      ],
      { duration: 700 + Math.random() * 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    ).onfinish = () => s.remove();
  }
}
