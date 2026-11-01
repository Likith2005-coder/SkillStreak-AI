/**
 * Who says what, and when. Keeps SignalBot charming instead of chatty:
 *
 *   - one line at a time; reactive lines (hover, greeting) at most one per
 *     GAP across ALL bots. Direct interactions (click, drag, pet, bus) skip
 *     the gap but still replace, never stack.
 *   - when several bots are on a page only one speaks: the visible bot
 *     nearest the cursor (or the largest visible one).
 *   - the greeting happens once per session per page type.
 */

import { useUserStore } from "@/store/userStore";
import { HOVER_SELECTOR, store } from "./store";

export type Bot = { el: HTMLElement; say: (text: string) => void };

const GAP = 4000;
const bots = new Set<Bot>();
let lastSpoke = -Infinity;

export const LINES = {
  click: ["Boop!", "Hehe", "That tickles!", "Beep boop!", "Hi hi!"],
  primary: ["Let's go!", "Ooh, that one!"],
  wake: "Huh? I'm awake!",
  dizzy: "Whoa… everything's spinning",
  drag: "Wheee!",
  release: "Phew.",
  pet: "Aww ♥",
  spin: "Ta-da!",
};

export function pick<T>(arr: readonly T[], avoid?: T): T {
  const pool = arr.length > 1 && avoid !== undefined ? arr.filter((x) => x !== avoid) : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Returns true (and stamps the clock) if a line may be said now. */
function claim(force: boolean) {
  const now = performance.now();
  if (!force && now - lastSpoke < GAP) return false;
  lastSpoke = now;
  return true;
}

function onScreen(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  if (r.width < 4 || r.bottom < 0 || r.right < 0 || r.top > innerHeight || r.left > innerWidth) return null;
  return r;
}

/** The one bot that should speak right now. */
export function pickSpeaker(mode: "near" | "big" = "near"): Bot | null {
  let best: Bot | null = null;
  let score = Infinity;
  bots.forEach((b) => {
    const r = onScreen(b.el);
    if (!r) return;
    const s =
      mode === "near" && store.has
        ? Math.hypot(store.x - (r.left + r.width / 2), store.y - (r.top + r.height / 2))
        : -r.width * r.height;
    if (s < score) {
      score = s;
      best = b;
    }
  });
  if (!best && mode === "big") bots.forEach((b) => (best ??= b));
  return best;
}

/** Say a line through the elected speaker. */
export function speak(text: string, { force = false, mode = "near" as "near" | "big" } = {}) {
  const b = pickSpeaker(mode);
  if (!b || !claim(force)) return false;
  b.say(text);
  return true;
}

/** Say a line through a specific bot (direct interaction with that bot). */
export function speakAs(bot: Bot, text: string, force = true) {
  if (!claim(force)) return false;
  bot.say(text);
  return true;
}

export function isSpeaker(bot: Bot) {
  return pickSpeaker("near") === bot;
}

/* ── Hover lines ──────────────────────────────────────────────── */

export const isPrimary = (el: Element | null) =>
  !!el && /\bbg-primary\b/.test((el as HTMLElement).className?.toString?.() ?? "");

let lastHmm = -Infinity;
let lastHoverEl: Element | null = null;
let lastHoverAt = -Infinity;

function lineFor(el: Element): string | null {
  const opt = el.closest("[data-bot-say]");
  if (opt) return opt.getAttribute("data-bot-say") || null;
  if (!el.matches(HOVER_SELECTOR)) return null;
  const href = el.getAttribute("href") ?? "";
  const text = (el.textContent ?? "").slice(0, 80);
  if (/\/review\b/.test(href) || /mistake/i.test(text)) return "Fix those mistakes, +XP!";
  if (/\/leaderboard\b/.test(href) || /leaderboard|league/i.test(text)) return "Climb that league!";
  if (isPrimary(el)) return pick(LINES.primary);
  if (el.tagName === "A") {
    const now = performance.now();
    if (now - lastHmm > 12_000 && Math.random() < 0.2) {
      lastHmm = now;
      return "Hmm?";
    }
  }
  return null;
}

let hoverT = 0;
function onInput(kind: string) {
  if (kind !== "hover") return;
  clearTimeout(hoverT);
  const el = store.hoverEl;
  if (!el) return;
  // Only lines for things the cursor actually rests on, not ones it sweeps across.
  hoverT = window.setTimeout(() => {
    if (store.hoverEl !== el || !el.isConnected) return;
    const now = performance.now();
    if (el === lastHoverEl && now - lastHoverAt < 15_000) return;
    const line = lineFor(el);
    if (line && speak(line)) {
      lastHoverEl = el;
      lastHoverAt = now;
    }
  }, 280);
}

/* ── Registry + greeting ──────────────────────────────────────── */

export function register(bot: Bot) {
  if (bots.size === 0) store.subs.add(onInput);
  bots.add(bot);
  return () => {
    bots.delete(bot);
    if (bots.size === 0) {
      store.subs.delete(onInput);
      clearTimeout(hoverT);
    }
  };
}

let greetPending = false;
const pageKey = () => `sb-greet:${location.pathname.split("/")[1] || "home"}`;

/** Called when a bot scrolls into view; greets once per session per page type. */
export function maybeGreet() {
  if (greetPending) return;
  let key = "";
  try {
    key = pageKey();
    if (sessionStorage.getItem(key)) return;
  } catch {
    return;
  }
  greetPending = true;
  window.setTimeout(() => {
    greetPending = false;
    const b = pickSpeaker("big");
    if (!b || !onScreen(b.el)) return; // try again when a bot is visible
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode: greet anyway */
    }
    const name = useUserStore.getState().user?.name?.trim().split(/\s+/)[0];
    const landing = location.pathname === "/";
    const line = name ? `Hey ${name}! Ready for a streak?` : landing ? "Hi there!" : "Hey! Ready for a streak?";
    speakAs(b, line, true);
  }, 1100);
}
