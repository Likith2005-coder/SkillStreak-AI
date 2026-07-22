# Design

Visual system for the SkillStreak AI frontend. Captured from the shipping code
(`app/globals.css`, `app/layout.tsx`, Tailwind config). Colors are stored as HSL channel
triples consumed via `hsl(var(--token))`.

## Theme

Dark-locked "Signal" — a deep-ink learning console. `<html>` carries `.dark` permanently;
there is no light mode in production (light tokens exist but are unused). The mood is a dim
control room with an electric signal running through it: near-black blue-tinted ground, cyan
as the live signal, violet for depth, lime for streak energy. A light-token block remains in
`:root` for reference only.

## Color

Primary (cyan) is the signal and the interactive/brand color. Secondary (violet) carries
depth and secondary emphasis. Lime is the energy accent reserved for streak / progress moments
— used sparingly, it should always mean "momentum." Backgrounds are a near-black blue, surfaces
one step up, borders a low-chroma blue hairline.

Dark theme (production), HSL triples:
- background `214 56% 4.5%` — deep ink, the ground
- foreground `195 30% 96%` — near-white body text
- card `213 44% 7%` — raised surface
- primary `187 92% 52%` — electric cyan (signal, links, focus ring)
- primary-foreground `205 90% 6%` — ink on cyan
- secondary `265 85% 68%` — violet (depth, secondary emphasis)
- accent-energy (lime) `84 85% 62%` — streak / progress only
- muted `213 32% 13%` / muted-foreground `205 16% 62%`
- border / input `205 32% 15%`
- destructive `0 72% 42%`
- ring `187 92% 52%`

Color strategy: Committed dark. The deep-ink surface plus a single saturated cyan signal
carries identity; violet and lime are deliberate secondary/accent roles, not decoration.

Contrast watch: `muted-foreground 205 16% 62%` on `card 213 44% 7%` is the value to re-check
whenever muted text sits on a raised surface — keep body and placeholder text ≥4.5:1, bump
toward foreground if borderline.

### Absolute-ban note (impeccable)

`.gradient-text` (lime→cyan→violet `background-clip:text`) is used across headings today. This
is on impeccable's absolute-ban list and reads as a generic AI tell. Treat it as legacy: on new
or reworked brand surfaces, prefer committed solid color with weight/size hierarchy; the cyan
signal can still glow via `text-shadow`, not a clipped gradient. Preserve it only where removing
it would break a shipped identity the user has approved.

## Typography

Family: Inter (`next/font`, `--font-inter`, `font-sans`). Single family, multiple weights.
Inter is a reflex-reject default in the brand register; it is fine to keep for the product app,
but the landing and Arsenal would gain distinctiveness from a committed display face paired
against Inter body (contrast axis, not a second geometric sans). This is the highest-leverage
open typography decision.

Arsenal runs a monospace stack inside `.hacker` (`ui-monospace, JetBrains Mono, Fira Code,
Cascadia Code`) — a genuine terminal, so mono is voice there, not costume.

Scale: fluid `clamp()` headings, `tracking-tight`. Display headings must keep letter-spacing
≥ -0.04em (the `.ghost-word` motif sits exactly at -0.04em) and a clamp max ≤ 6rem.

Kicker caution: small uppercase tracked mono eyebrows (`font-mono text-[11px] uppercase
tracking-[0.28em]`) appear above most section headers via `PageHero`. Repeated as section
grammar this is an AI tell. Keep it where the terminal/console voice is real; thin it to a
deliberate cadence elsewhere rather than stamping it on every header.

## Layout

Container-based, generous vertical rhythm. Radius scale from `--radius: 0.6rem` (cards use
`rounded-2xl`/`rounded-3xl`). Responsive grids use `sm:grid-cols-2 lg:grid-cols-3`; prefer
`repeat(auto-fit, minmax(280px, 1fr))` for breakpoint-free card walls. `PageHero` is the shared
cinematic header panel (bordered card + grid-scene horizon + ghost word + gradient title).
Cards are heavily used — audit for the "identical card grid" reflex and break it where a
section deserves its own composition.

## Motion

Libraries installed and in use: framer-motion / `motion` (component reveals, stagger), GSAP
(navbar underline, timeline work), Lenis (smooth scroll). Easing convention is
`cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quart) — no bounce, no elastic. Every animation has
a `@media (prefers-reduced-motion: reduce)` fallback and this is a hard invariant.

Signature effects (all in `globals.css`, GPU-cheap):
- `.grid-scene` / `.grid-floor` — neon perspective floor receding to a glowing cyan→lime
  horizon; the "ground you build skills on." The house signature.
- `.aurora-bg` — slow drifting cyan + violet blooms behind the page (fixed, `-z-10`).
- `.ghost-word` — giant outlined display word behind heroes (cyan text-stroke).
- `.glitch` — chromatic-aberration split text (needs `data-text`), brief burst on a 5.5s loop.
- `.noise-overlay` — animated film grain, `mix-blend-mode: overlay`, opacity 0.05.
- `.chromatic` — cyan/violet edge split on hover for cards/images.
- `.bento-card` — conic gradient ring drawn on hover via `@property --bento-angle`.
- `.route-bar` — top-of-page cyan→violet route progress bar.

3D: Spline (`@splinetool/react-spline`) runs the interactive robot mascot, lazy-loaded, blended
into the page with `mix-blend-mode: screen` + a radial mask so the canvas dissolves into the
ground. react-three-fiber / drei / three are available for custom WebGL scenes.

## Components

shadcn/radix-derived primitives (`components/ui`), `class-variance-authority` for variants,
`tailwind-merge` + `clsx` via `cn()`. Default button variant is a cyan→teal gradient fill.
Toasts via `sonner` (dark, bottom-center). Icons via `lucide-react`. Charts via `recharts`.
Code highlighting via `shiki`. Confetti via `canvas-confetti` for streak/achievement moments.

## Sub-theme: Hacker terminal (`.hacker`)

Scoped to the Ethical Hacking Arsenal only. Near-black `#04070a` ground, green phosphor grid
(`140 90% 50%`), animated CRT scanlines, monospace type, blinking `.term-cursor`, and a
green-recolored `.prose` for AI guide content. This is an intentional second visual world under
the same voice (deep ground, single live signal) — brand register, and the one place monospace
is earned rather than decorative. It is the strongest existing candidate to push further.
