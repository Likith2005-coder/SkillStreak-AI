# Design

Visual system for the SkillStreak AI frontend. Captured from the shipping code
(`app/globals.css`, `app/layout.tsx`, `tailwind.config.ts`). Colors are stored as HSL channel
triples consumed via `hsl(var(--token))`.

## Theme

"Midnight": premium dark with real spectacle. A near-black ground with depth, hairline panels
that catch a cursor spotlight, one electric volt accent that glows, and big, tight display type
with a serif accent. The bar is the best product sites (Linear, Vercel, Raycast): professional
first, then striking. A flat dark UI reads as dull; a childish, bubbly one reads as wrong (both
were tried and rejected).

The Ethical Hacking Arsenal keeps its own world: a green-phosphor terminal, scoped by a `dark`
class on its root (`HackerShell`), which applies the legacy `.dark` token block.

## Color

On dark every role colour is bright enough to be **text** on the ground *and* a **fill**.
Fills carry dark ink (`*-foreground`), never white.

| Role | Token | Means |
|---|---|---|
| `primary` | volt `84 100% 62%` | progress, continue, correct, the main CTA |
| `secondary` | electric blue `224 100% 70%` | links, selection, info |
| `energy` | ember `24 100% 62%` | the streak (flame) |
| `xp` | gold `44 100% 62%` | XP (gem) |
| `grape` | violet `262 100% 76%` | level, league, AI accents |
| `destructive` | red `355 92% 64%` | wrong, errors (`destructive-text` for copy) |
| `aurora-1..4` | violet → blue → cyan → volt | spectacle only: hero light, beams, celebrations |

Neutrals: background `228 20% 3.5%`, card `228 16% 6.5%`, muted `228 14% 10%`,
foreground `220 25% 96%`, muted-foreground `225 12% 66%` (AA on card), border `228 12% 14%`.
Tints are white at low alpha (`bg-white/[0.03]`, `border-white/10`) or a role at 10–15%.

Domain colours (`lib/domain-style.ts`): `text-X-300` on dark, `bg-X-500/15` wells and badges.

## Typography

- **Bricolage Grotesque** (`--font-sans`, `font-sans` / `.font-display`): one family with an
  optical-size axis, crisp as body copy and dramatic at display sizes. Display = 700,
  `-0.035em`, `text-wrap: balance`, hero clamp max 6rem.
- **Instrument Serif italic** (`--font-serif`, `.font-serif-accent`): one or two accent words
  per major headline, usually volt with `.text-glow`. Contrast on the serif/sans axis.
- **Martian Mono** (`--font-mono`, `.label-mono`): data labels, counters, and the terminal.

No gradient text: `.gradient-text` is solid volt.

## Surfaces and light

- **Panel** (`.card-chunky`): near-black card, 1px hairline, a top-lip highlight, a deep drop
  shadow. `.card-press` lifts it toward the light on hover. Panels never nest.
- **Spotlight** (`.spotlight`): a soft light that follows the cursor inside a panel, plus a
  brighter rim where it meets the border. One global `SpotlightTracker` feeds every panel.
- **Glows** (`.glow-*`, `.text-glow`): only for things that are live (current node, alive
  streak, active tab, the main CTA).
- **Border beam** (`.border-beam`): a light that sweeps around a border. The single most
  important element on a screen only.
- **Atmosphere**: the hero's WebGL aurora (`AuroraShader`, half-resolution, paused off-screen),
  `.aurora-bg` light pools, `.grid-faint`, and a static film grain.

## Components

Lit buttons (`components/ui/button.tsx`): a bright face, an inner top highlight and a coloured
halo that grows on hover; press is a small scale-down. Variants: default (volt), secondary,
energy, grape, outline (hairline glass), ghost, destructive, link. Inputs: hairline, inset
shadow, volt focus ring. shadcn/radix primitives, `cva`, `cn()`, `sonner`, `lucide-react`,
`recharts`, `shiki`, `canvas-confetti` (aurora colours).

## Motion

framer-motion; ease `cubic-bezier(0.22, 1, 0.36, 1)`. Entrances rise out of a blur; rewards
spring; numbers count up. The hero's product preview lies tilted back and swings upright on
scroll. View transitions (`next-view-transitions`) morph a domain card into its roadmap header.
Every animation goes through `useReducedMotionSafe()`, and reduced motion gets a still or
crossfade alternative. This is a hard invariant.
