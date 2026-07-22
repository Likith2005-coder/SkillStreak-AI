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

Structured mastery of modern tech, guided by an AI tutor and kept alive by streaks — a
learning console you operate, not a course catalog you browse.

## Brand Personality

Electric, precise, cinematic. The product should feel like mission control for your own
skill: an instrument with a deep-ink console, a live signal running through it, and a sense
that something capable is working on your behalf. Confident without being corporate, energetic
without being noisy. The emotional target is momentum plus a little awe — the learner should
feel that continuing is the obvious next move, and that the tool taking them there is serious.

## Anti-references

Generic edtech (Coursera / Udemy corporate-blue course grids), Bootstrap-default dashboards,
and cookie-cutter SaaS templates — the hero-metric-plus-three-cards layout, the safe rounded
card grid repeated forever, motion bolted on as an afterthought. If it looks like a course
marketplace or an admin template someone downloaded, it has failed.

## Design Principles

A learning console, not a catalog. Screens should read like instruments the learner operates,
with a clear signal and live state, not like pages of content to scroll past.

Momentum is the product. Streak, XP, and progress are the emotional core; they should be felt
on every surface, never buried in a stat box.

One world, many treatments. Landing, app, and Arsenal can look different, but they share a
voice — deep ink, electric signal, precise motion — so the whole thing feels like one system.

Theatrical entrances, calm workspaces. The landing and Arsenal earn ambitious first-load
motion and unconventional layout; inside the app, motion is quiet and gets out of the way of
the task. Loud where it persuades, calm where it works.

Show mastery, don't claim it. The craft of the interface is itself the proof that the platform
is serious about skill. Distinctiveness over safety — average now reads as mediocre.

## Accessibility & Inclusion

Target WCAG 2.1 AA. The product ships dark-locked, so the discipline is contrast: body text
and placeholders must clear 4.5:1 against the deep-ink surfaces (the muted-gray-on-tinted-dark
trap is the one to watch). Every animation already has a `prefers-reduced-motion` path; keep
that invariant as motion grows. Signal is carried by more than hue (icons, weight, position)
so the cyan/violet/lime language stays legible for color-blind users.
