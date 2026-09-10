"use client";

/**
 * Zero-JS stand-in for the 3D SignalBot, shown wherever the WebGL scene isn't
 * worth its cost (phones, tablets, coarse pointers, reduced motion).
 *
 * Same character — screen face, glowing eyes, lime antenna, violet ear pods,
 * cyan/violet halo rings — drawn as one inline SVG. No three.js, no canvas,
 * no animation frame: it costs a few kilobytes of markup instead of seconds
 * of main-thread time, and the cursor-tracking the real bot exists for can't
 * happen on touch anyway.
 */

export function SignalBotStatic({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 320 320"
        fill="none"
        role="img"
        aria-label="SignalBot, the SkillStreak mascot"
        className="h-full w-full"
      >
        <defs>
          <radialGradient id="sb-glow" cx="50%" cy="44%" r="50%">
            <stop offset="0%" stopColor="hsl(187 92% 52%)" stopOpacity="0.20" />
            <stop offset="100%" stopColor="hsl(187 92% 52%)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sb-shell" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(213 40% 18%)" />
            <stop offset="100%" stopColor="hsl(214 50% 8%)" />
          </linearGradient>
        </defs>

        <circle cx="160" cy="150" r="150" fill="url(#sb-glow)" />

        {/* antenna — lime tip is the streak-energy accent */}
        <line x1="160" y1="66" x2="160" y2="38" stroke="hsl(265 85% 68%)" strokeWidth="3" />
        <circle cx="160" cy="32" r="9" fill="hsl(var(--energy))" />

        {/* ear pods */}
        <rect x="60" y="128" width="14" height="40" rx="7" fill="hsl(265 85% 68%)" opacity="0.9" />
        <rect x="246" y="128" width="14" height="40" rx="7" fill="hsl(265 85% 68%)" opacity="0.9" />

        {/* head shell + screen face */}
        <rect x="70" y="66" width="180" height="132" rx="30" fill="url(#sb-shell)" stroke="hsl(205 32% 22%)" strokeWidth="2" />
        <rect x="86" y="82" width="148" height="100" rx="20" fill="hsl(230 60% 8%)" />

        {/* eyes + smile */}
        <ellipse cx="131" cy="122" rx="15" ry="19" fill="hsl(187 92% 72%)" />
        <ellipse cx="189" cy="122" rx="15" ry="19" fill="hsl(187 92% 72%)" />
        <path d="M136 152 q24 22 48 0" stroke="hsl(187 92% 72%)" strokeWidth="7" strokeLinecap="round" fill="none" />

        {/* halo rings — the light pool that replaced the legs */}
        <ellipse cx="160" cy="236" rx="74" ry="17" stroke="hsl(265 85% 68%)" strokeWidth="3" opacity="0.75" />
        <ellipse cx="160" cy="250" rx="96" ry="21" stroke="hsl(187 92% 60%)" strokeWidth="3" opacity="0.9" />
      </svg>
    </div>
  );
}
