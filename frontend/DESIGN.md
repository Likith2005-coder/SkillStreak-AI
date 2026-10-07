# Design

Visual system for the SkillStreak AI frontend. Captured from the shipping code
(`app/globals.css`, `app/layout.tsx`, `tailwind.config.ts`). Colors are stored as HSL channel
triples consumed via `hsl(var(--token))`.

## Theme

"Playground": bright, light, chunky and celebratory. The learning app is a game board,
not a console. White ground, saturated toy-like colour, 3D pressable keys, heavy rounded type,
and a mascot that talks. It takes its feel from game-style learning apps (Duolingo et al.)
without borrowing anyone's colours, characters or wordmark.

Two places stay dark on purpose, by adding the `dark` class to their root so the tokens
re-scope:
- **The Ethical Hacking Arsenal** (`HackerShell`): the "secret level", a green-phosphor terminal.
- **The landing boot intro** (`LandingIntro`): a dark cinematic boot that lifts into the
  bright page ("lights on").

## Color

Every brand colour has three roles:
- **face** (`X`): deep enough for white text at AA (≥4.5:1) *and* usable as text on white.
- **bright** (`X-bright`): the juicy tone for icons, fills, illustration and celebrations.
  Never small text.
- **shade** (`X-shade`): the bottom edge that makes keys and tiles look pressable.

Meanings are fixed and never swapped:

| Role | Face | Bright | Means |
|---|---|---|---|
| `primary` | `104 66% 31%` | `100 72% 45%` | progress, continue, correct, main CTA |
| `secondary` | `201 90% 37%` | `199 92% 52%` | links, selection, info |
| `energy` | `22 100% 39%` | `28 100% 55%` | the streak (flame) |
| `xp` | `38 100% 31%` | `43 100% 52%` | XP (gem) |
| `grape` | `262 62% 50%` | `262 80% 66%` | level, league, AI accents |
| `destructive` | `0 78% 45%` | `0 85% 60%` | wrong, errors (`destructive-text` for copy) |

Neutrals: background/card white, foreground `215 22% 20%`, muted `210 25% 96%`,
muted-foreground `215 14% 40%` (AA on white), border `214 20% 88%`.

Domain colours (`lib/domain-style.ts`) use Tailwind `X-700` text and `X-100` tints for chips;
roadmap nodes use a bright face + dark edge per domain.

Color strategy: Full palette. Each colour carries one meaning, so the palette reads as
information, not decoration. Colored slabs (unit banners, CTA bands) carry white text only.

## Typography

**Nunito** (`--font-nunito`, `font-sans` and `font-display`) up to weight 1000. `.font-display`
= 900 with `-0.02em` tracking for headings; UI labels and numbers run `font-extrabold` /
`font-black`. One rounded family in many weights. **Martian Mono** (`--font-mono`) is reserved
for the Arsenal terminal.

Headings use `text-wrap: balance`, and the hero clamp max is ≤ 4.25rem. No gradient text:
`.gradient-text` now resolves to solid primary at 900 weight.

## Building blocks

- **Chunky key** (`components/ui/button.tsx`): solid face + `box-shadow: 0 var(--edge) 0
  <shade>`. On `:active` it sinks by `--edge` and the shadow collapses. Variants:
  default (green), secondary, energy, grape, outline, ghost, destructive, link.
- **Chunky card** (`.card-chunky`): 2px border with a 5px bottom border, radius 1.25rem.
  Add `.card-press` when the whole card is clickable.
- **Sticker tile**: a rounded-2xl coloured face, white icon, slight tilt and a 3D edge
  (hero stickers, stat tiles).
- **Juicy progress bar**: `h-4` muted track, bright fill, white/35 gloss strip near the top.
- **Path nodes**: round 3D keys on a thick muted track. Done = check, current = star with a
  ring and a bobbing START bubble, upcoming = grey book (`PathPreview`, `WindingRoadmap`).
- **Mascot** (`components/playground/Mascot.tsx`): the SignalBot with an idle bob and a speech
  bubble that comments on real state.

## Layout

Container-based. The dashboard is a main column plus a 340px right rail (stat pills, streak
week, level, league, Arsenal door), which stacks on mobile. Use cards when the thing is an
object the learner acts on (a course, a stat, a question). Never nest them.

## Motion

framer-motion for component motion; CSS keyframes for idle loops (`.sticker-bob`); Lenis for
smooth scroll on the landing page. Ease out with `cubic-bezier(0.22, 1, 0.36, 1)`. Rewards
get springs: icons pop, numbers bounce when they land, the confetti uses the brand colours.
Every animation goes through `useReducedMotionSafe()` (hydration-safe), and reduced motion gets
an instant or crossfade alternative. This is a hard invariant.

The landing hero's stickers have two transform layers that never fight: the outer one does
cursor parallax via `--mx/--my` (one rAF), the inner one bobs. View transitions
(`next-view-transitions`) morph a domain card into its roadmap header.

## Components

shadcn/radix-derived primitives (`components/ui`), `class-variance-authority` for variants,
`cn()` = `tailwind-merge` + `clsx`. Toasts via `sonner`, icons via `lucide-react`, charts
via `recharts`, code via `shiki`, celebrations via `canvas-confetti`.

## Sub-theme: Hacker terminal (`.dark.hacker`)

Scoped to the Ethical Hacking Arsenal only. Near-black `#04070a` ground, green phosphor
(`140 90% 50%`), CRT scanlines, Martian Mono, blinking `.term-cursor`. Inside the bright app
it shows up as a dark "secret level" door (dashboard rail, landing teaser).
