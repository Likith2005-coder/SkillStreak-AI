/**
 * SignalBot reactions bus: let any page make the mascot react.
 *
 *   import { botReact } from "@/components/mascot/bus";
 *
 *   botReact({ mood: "celebrate", say: "Goal smashed!" });
 *   botReact({ mood: "love", say: "Aww, thanks!", durationMs: 3000 });
 *   botReact({ say: "New badge!" });            // just talk
 *
 *   mood        "happy" | "curious" | "dizzy" | "love" | "celebrate"
 *               celebrate = a jump, a big sparkle burst and a happy face.
 *   say         a short line (keep it under ~30 chars) shown in the bot's
 *               speech bubble for ~2.5s. Bus lines skip the chatter rate limit.
 *   durationMs  how long the mood is held (default 2200ms).
 *
 * It dispatches a `window` CustomEvent named "signalbot:react" with the
 * reaction as `detail`, so it works from anywhere (no React context needed)
 * and is a no-op when no bot is mounted or on the server. Every mounted bot
 * shows the mood; only one (the one nearest the cursor, else the largest
 * visible one) says the line. Under reduced motion the face still changes and
 * the line is still said, but nothing jumps.
 *
 * Hover lines: put `data-bot-say="Your line"` on any element and the bot says
 * that line when the element is hovered (rate-limited). `data-bot-say=""`
 * keeps the bot quiet for that element.
 */

export const BOT_REACT_EVENT = "signalbot:react";

export type BotMood = "happy" | "curious" | "dizzy" | "love" | "celebrate";

export type BotReaction = {
  mood?: BotMood;
  say?: string;
  durationMs?: number;
};

export function botReact(reaction: BotReaction) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<BotReaction>(BOT_REACT_EVENT, { detail: reaction }));
}
