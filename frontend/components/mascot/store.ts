/**
 * One shared input store for every SignalBot on the page.
 *
 * A single set of passive window listeners (pointer, hover target, typing,
 * scroll) feeds plain mutable fields; bots subscribe and read what they need.
 * Listeners are attached when the first bot mounts and removed when the last
 * one unmounts (ref-counted), so a page with no bot pays nothing.
 */

export type InputKind = "move" | "hover" | "key" | "scroll";

/** What a bot glances at / reacts to when hovered. `data-bot-say` opts any element in. */
export const HOVER_SELECTOR = "[data-bot-say], a, button, [role='button']";

type Store = {
  x: number;
  y: number;
  /** A real pointer has been seen (false on touch-only until a tap). */
  has: boolean;
  /** Last pointer / key / scroll activity, for dozing and idle glances. */
  lastActive: number;
  hoverEl: Element | null;
  typing: { el: HTMLElement | null; at: number; count: number; secret: boolean };
  scroll: { dir: number; at: number; jumpAt: number };
  subs: Set<(kind: InputKind) => void>;
};

export const store: Store = {
  x: 0,
  y: 0,
  has: false,
  lastActive: 0,
  hoverEl: null,
  typing: { el: null, at: 0, count: 0, secret: false },
  scroll: { dir: 0, at: 0, jumpAt: 0 },
  subs: new Set(),
};

const notify = (kind: InputKind) => store.subs.forEach((fn) => fn(kind));

const onMove = (e: PointerEvent) => {
  store.x = e.clientX;
  store.y = e.clientY;
  store.has = true;
  store.lastActive = performance.now();
  notify("move");
};

const onOver = (e: PointerEvent) => {
  const t = e.target as Element | null;
  let el = t?.closest?.(HOVER_SELECTOR) ?? null;
  // The bot's own parts (and its speech bubble) are not "page controls".
  if (el && el.closest("[data-signalbot]")) el = null;
  if (el !== store.hoverEl) {
    store.hoverEl = el;
    notify("hover");
  }
};

const NON_TEXT = /^(button|checkbox|radio|range|color|file|submit|reset|image|hidden)$/;
const onKey = (e: KeyboardEvent) => {
  if (e.key.length > 1 && e.key !== "Backspace" && e.key !== "Enter") return; // Shift, Tab, arrows…
  const a = document.activeElement as HTMLElement | null;
  if (!a) return;
  const editable =
    a.isContentEditable ||
    a.tagName === "TEXTAREA" ||
    (a.tagName === "INPUT" && !NON_TEXT.test((a as HTMLInputElement).type));
  if (!editable) return;
  const now = performance.now();
  store.typing.el = a;
  store.typing.at = now;
  store.typing.count++;
  store.typing.secret = a.tagName === "INPUT" && (a as HTMLInputElement).type === "password";
  store.lastActive = now;
  notify("key");
};

// Scroll from the window or any scroll container (dashboard panes scroll inside).
const lastPos = new WeakMap<object, { y: number; t: number }>();
const onScroll = (e: Event) => {
  const tgt = e.target === document ? document.scrollingElement : (e.target as Element | null);
  if (!tgt || !("scrollTop" in tgt)) return;
  const y = (tgt as Element).scrollTop;
  const now = performance.now();
  const prev = lastPos.get(tgt);
  lastPos.set(tgt, { y, t: now });
  if (!prev) return;
  const dy = y - prev.y;
  if (!dy) return;
  const dt = Math.max(1, now - prev.t);
  store.scroll.dir = Math.sign(dy);
  store.scroll.at = now;
  if (Math.abs(dy) > 600 || (dt < 100 && Math.abs(dy) / dt > 7)) store.scroll.jumpAt = now;
  store.lastActive = now;
  notify("scroll");
};

let refs = 0;
export function attach() {
  if (refs++ > 0) return;
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onMove, { passive: true });
  window.addEventListener("pointerover", onOver, { passive: true });
  window.addEventListener("keydown", onKey, { passive: true });
  document.addEventListener("scroll", onScroll, { passive: true, capture: true });
}
export function detach() {
  if (--refs > 0) return;
  window.removeEventListener("pointermove", onMove);
  window.removeEventListener("pointerdown", onMove);
  window.removeEventListener("pointerover", onOver);
  window.removeEventListener("keydown", onKey);
  document.removeEventListener("scroll", onScroll, { capture: true });
}
