# Product

## Register

product

## Platform

web

## Users

Final-year engineering students and early-career self-learners trying to master modern
technology domains — cybersecurity, web development, AI/ML, data, cloud, DevOps, Web3, IoT.
They study alone, on their own schedule, and they burn out or drift without structure and
without a reason to come back tomorrow. Their job-to-be-done is "make consistent, visible
progress toward real skill in a domain I chose, and don't let me lose momentum."

The learner app (dashboard, domains, roadmaps, quiz, interview, progress, leaderboard,
settings) is the primary surface and lives in the product register: design serves the task.
Two surfaces are deliberately brand register, where the design itself does the persuading —
the public landing page and the Ethical Hacking Arsenal. Work on those two is judged by
brand rules even though the app default is product. The admin console is a separate app at
:3001, product register.

## Product Purpose

SkillStreak AI turns "I want to learn X" into a guided, gamified path: an AI tutor generates
and answers along a structured roadmap, streaks and XP keep the learner returning, and
curated resources, quizzes, mock interviews, and a hands-on hacking arsenal give the skill
somewhere to be practiced. Success is a learner who keeps a streak alive across weeks and can
feel themselves getting more capable — not a course they bought and abandoned.

## Positioning

Structured mastery of modern tech, guided by an AI tutor and kept alive by streaks. Learning
that feels like a game you want to come back to, not a course catalog you browse.

## Brand Personality

Playful, encouraging, energetic. It should feel like a game board for your own skills:
bright colour, chunky buttons you want to press, a mascot cheering you on, and rewards that
land with a pop. It is friendly without being childish: the content is serious tech, and the
delight is what keeps the learner showing up tomorrow. The one exception is the Arsenal, a
dark hacker-terminal "secret level" that rewards curiosity with a change of world.

## Anti-references

Generic edtech (Coursera / Udemy corporate-blue course grids), Bootstrap-default dashboards,
and cookie-cutter SaaS templates — the hero-metric-plus-three-cards layout, the safe rounded
card grid repeated forever, motion bolted on as an afterthought. If it looks like a course
marketplace or an admin template someone downloaded, it has failed.

## Design Principles

A game board, not a catalog. Every screen should make the next action obvious and pressable.

Momentum is the product. Streak, XP and level are the emotional core. They have fixed
colours (orange, gold, grape) and are felt on every surface, not buried in a stat box.

Celebrate the right things. Correct answers, finished topics and kept streaks get motion,
colour and confetti. Everything else stays calm so the celebration means something.

One meaning per colour. Green moves you forward, red tells you it was wrong. The palette is
information.

Show mastery, don't claim it. The craft of the interface is the proof that the platform takes
skill seriously.

## Accessibility & Inclusion

Target WCAG 2.1 AA. On a bright palette the discipline is contrast: small text uses a
colour's *face* tone, never its *bright* tone, and coloured slabs carry white text only.
Body text and placeholders must clear 4.5:1. Every animation already has a `prefers-reduced-motion` path; keep
that invariant as motion grows. Signal is carried by more than hue (icons, weight, position)
so the colour language stays legible for color-blind users.
