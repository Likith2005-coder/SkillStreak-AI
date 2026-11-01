/**
 * Particle flourishes for SignalBot: plain DOM spans animated with WAAPI and
 * removed when done. Callers gate these behind reduced motion.
 */

const SPARKLE_COLORS = ["hsl(var(--primary))", "hsl(var(--aurora-3))", "hsl(var(--grape))", "hsl(var(--xp))"];
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function particle(host: HTMLElement, glyph: string, css: string) {
  const s = document.createElement("span");
  s.textContent = glyph;
  s.setAttribute("aria-hidden", "true");
  s.style.cssText = `position:absolute;pointer-events:none;z-index:2;line-height:1;${css}`;
  host.appendChild(s);
  return s;
}

/** Sparkles out of the bot. `big` = the celebrate burst. */
export function burst(host: HTMLElement, big = false) {
  const n = big ? 18 : 9;
  for (let i = 0; i < n; i++) {
    const size = (big ? 12 : 10) + Math.random() * (big ? 14 : 10);
    const s = particle(
      host,
      "✦",
      `left:50%;top:38%;font-size:${size}px;color:${SPARKLE_COLORS[i % SPARKLE_COLORS.length]};text-shadow:0 0 8px currentColor`,
    );
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
    const d = big ? 70 + Math.random() * 70 : 46 + Math.random() * 40;
    s.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.4)", opacity: 1 },
        ...(big ? [{ opacity: 1, offset: 0.55 }] : []),
        {
          transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(1) rotate(${Math.random() * 180}deg)`,
          opacity: 0,
        },
      ],
      { duration: (big ? 900 : 700) + Math.random() * 300, easing: EASE },
    ).onfinish = () => s.remove();
  }
}

/** A few hearts that float up and sway (petting). */
export function hearts(host: HTMLElement) {
  for (let i = 0; i < 5; i++) {
    const x = 30 + Math.random() * 40;
    const s = particle(
      host,
      "♥",
      `left:${x}%;top:22%;font-size:${12 + Math.random() * 8}px;color:hsl(330 100% 74%);text-shadow:0 0 10px hsl(330 100% 60% / 0.8);opacity:0`,
    );
    const sway = (Math.random() - 0.5) * 30;
    s.animate(
      [
        { transform: "translate(-50%, 0) scale(0.5)", opacity: 0 },
        { transform: `translate(calc(-50% + ${sway * 0.4}px), -18px) scale(1)`, opacity: 1, offset: 0.25 },
        { transform: `translate(calc(-50% + ${sway}px), -64px) scale(0.9)`, opacity: 0 },
      ],
      { duration: 1300 + Math.random() * 400, delay: i * 140, easing: "cubic-bezier(0.33, 1, 0.68, 1)", fill: "backwards" },
    ).onfinish = () => s.remove();
  }
}
