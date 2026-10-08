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

Confident, electric, premium. It should feel like the best-made product the learner has ever
used: a deep, quiet dark canvas where light means something (the streak glows, progress lights
up volt, the next step is the brightest thing on screen). Serious about skill, with a sense of
spectacle. The Arsenal is a dark hacker-terminal "secret level" that rewards curiosity.

## Anti-references

Generic edtech (Coursera / Udemy corporate-blue course grids), Bootstrap-default dashboards,
and cookie-cutter SaaS templates — the hero-metric-plus-three-cards layout, the safe rounded
card grid repeated forever, motion bolted on as an afterthought. If it looks like a course
marketplace or an admin template someone downloaded, it has failed.

## Design Principles

Light is meaning. On a near-black canvas, glow is reserved for what is live or next: the
current topic, an alive streak, the main action. If everything glows, nothing does.

Momentum is the product. Streak, XP and level have fixed colours (ember, gold, violet) and are
felt on every surface.

Spectacle where it persuades, calm where it works. The landing and celebrations earn the big
moments; lessons and quizzes stay focused and legible.

Professional first. Precise type, hairline structure and restraint make the spectacle read as
craft rather than noise.

## Accessibility & Inclusion

Target WCAG 2.1 AA. On dark the discipline is contrast in both directions: role colours
are bright enough to be text on the ground, fills carry dark ink, and body copy never drops
below `muted-foreground`. Text over the hero light sits on a dark scrim. Every animation already has a `prefers-reduced-motion` path; keep
that invariant as motion grows. Signal is carried by more than hue (icons, weight, position)
so the colour language stays legible for color-blind users.
