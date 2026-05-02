# SkillStreak AI — Implementation Battleplan

**Companion to:** `SKILLSTREAK_AI_PLANNING.md`
**Purpose:** Phase-by-phase execution roadmap. Each phase ends in a stable, demoable state.
**Date:** 2026-05-02
**Status:** Ready to execute

---

## Battleplan Principles

These rules apply to every phase. Read them before starting.

1. **Vertical slices, not horizontal.** Build one feature end-to-end (DB → API → UI) before starting the next. Never build "all backend first" — you won't see anything working until week 10.
2. **Deploy after every phase.** Push to staging at every phase exit. A broken main branch blocks the team.
3. **Definition of Done is the gate.** A phase is not "done" until every checkbox is ticked. Half-done phases compound into a broken project.
4. **Polish lives in dedicated phases.** Don't polish as you go — it kills momentum. Ship rough, polish in Phase 9.
5. **Parallelize when possible.** Phases marked `[parallel]` can run alongside another phase if you have multiple developers.
6. **Commit early, commit often.** Push to GitHub at least daily. The git history is part of your final submission.
7. **One commit message rule:** `<phase>: <what changed>` (e.g., `phase-3-chatbot: add streaming SSE handler`).

---

## Phase Overview

| # | Phase | Duration | Demoable Output | Parallelizable |
|---|---|---|---|---|
| **0** | Foundation Setup | 1 week | Empty deployed shell | — |
| **1** | Auth & User System | 1 week | Working login/signup on staging | — |
| **2** | Domains, Roadmaps & Topics | 1.5 weeks | Browse 9 domains; see 5 deep roadmaps | partly with Phase 3 |
| **3** | AI Chatbot (Core) | 1.5 weeks | Working streaming chatbot | partly with Phase 2 |
| **4** | Quiz Engine | 1 week | Take a 5-question quiz, get scored | — |
| **5** | Progress & Analytics | 1 week | Dashboard with progress widgets | partly with Phase 6 |
| **6** | Streaks & Gamification | 1 week | Streaks, XP, levels, badges, leaderboard | partly with Phase 5 |
| **7** | Resource Recommender | 1 week | Curated YouTube + docs per topic | — |
| **8** | Notifications & Admin | 1 week | Email reminders + admin panel | — |
| **9** | Frontend Excellence | 2 weeks | Production-quality polish | — |
| **10** | Testing & Hardening | 1 week | Test coverage + security review | — |
| **11** | Deployment & Demo Prep | 1 week | Final report + recorded demo | — |

**Total: 14 weeks (1 semester).** Add a 1-week buffer if possible.

---

## Phase 0 — Foundation Setup

**Tagline:** *"Set the stage for everything that comes next."*

### Goal
A deployable monorepo with both apps (frontend + backend) booted, connected to a database, and continuously deployed to staging — with zero features.

### Prerequisites
- Team formed and roles agreed
- GitHub organization or shared repo created
- LLM API account chosen and credits added
- Hosting accounts created (Vercel, Render, Neon)

### Tasks
1. Initialize monorepo with the structure from `SKILLSTREAK_AI_PLANNING.md` §19.
2. Set up `frontend/` with Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui.
3. Set up `backend/` with Express + TypeScript + Prisma.
4. Create `docker-compose.yml` for local Postgres + Redis.
5. Create `.env.example` files (frontend + backend) with all required env vars.
6. Define design tokens in Tailwind config: indigo/violet palette, font stack, spacing scale.
7. Write the minimal `prisma/schema.prisma` with `users` table only (more added later).
8. Run first Prisma migration.
9. Build a "Hello SkillStreak" landing page on frontend.
10. Build a `/health` endpoint on backend that pings the database.
11. Frontend calls backend `/health` and displays the result.
12. Set up GitHub Actions: lint + type-check + test on every PR.
13. Deploy frontend to Vercel + backend to Render + DB to Neon.
14. Verify the full deployed pipeline: visit the Vercel URL → it shows DB connection status from Render.
15. Write `README.md` with setup instructions.
16. Draw architecture and ER diagrams (export PNG to `docs/diagrams/`).

### Definition of Done
- [ ] Monorepo structure matches `SKILLSTREAK_AI_PLANNING.md` §19
- [ ] Local: `npm run dev` starts both apps on `:3000` and `:4000`
- [ ] Local: Postgres + Redis running via `docker-compose up`
- [ ] Frontend deployed to Vercel; backend deployed to Render; DB on Neon
- [ ] Visiting deployed frontend shows backend `/health` returning OK
- [ ] CI runs lint + type-check + test on every push
- [ ] Architecture and ER diagrams committed as PNG
- [ ] README explains how to set up and run

### Demoable Output
> "Here's our deployed staging URL. The frontend connects to the backend, which connects to the database. We can deploy any change in under 5 minutes."

### Risks / Notes
- Don't skip CI setup. Adding it later means broken builds get merged.
- Get one person to own deployment so credentials don't sprawl.

---

## Phase 1 — Auth & User System

**Tagline:** *"Real users, real sessions."*

### Goal
Complete authentication: signup, login, JWT-based sessions, protected routes, profile.

### Prerequisites
- Phase 0 complete

### Tasks
1. Extend `prisma/schema.prisma`: `users`, `user_profile` tables (per planning doc §12.2).
2. Run migration.
3. Backend services: `auth.service.ts` with `register`, `login`, `verifyToken`, `getUser`.
4. Backend controllers + routes: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`.
5. Backend middleware: `auth.middleware.ts` (verifies JWT, attaches `req.user`).
6. Backend utilities: `password.util.ts` (bcrypt), `jwt.util.ts`.
7. Frontend pages: `/register`, `/login`, `/dashboard` (placeholder, protected).
8. Frontend lib: `api.ts` (axios with token interceptor), `auth.ts` (token storage).
9. Frontend hooks: `useUser.ts`.
10. Frontend store: `userStore.ts` (Zustand).
11. Build forms with React Hook Form + Zod validation.
12. Build the **Onboarding Survey** (3 questions: prior_level, goal, pace) — appears once after first signup.
13. Save profile data to `user_profile` table.
14. Build the basic Navbar with login/logout state.
15. Wire up route protection: redirect to `/login` if not authenticated.
16. Add password requirements (min 8 chars, etc.) and clear error messages.

### Definition of Done
- [ ] User can register with email + password
- [ ] User receives JWT on login; token persists across reloads
- [ ] Onboarding survey appears once, saves to DB
- [ ] Protected routes redirect to login when no token
- [ ] `GET /auth/me` returns current user
- [ ] Logout clears token and redirects to landing
- [ ] Password is hashed with bcrypt in DB (not plain text)
- [ ] All forms have client + server validation
- [ ] Manual QA: 5 different signup/login scenarios pass

### Demoable Output
> "I can sign up, complete onboarding, log in, see a protected dashboard, and log out. My session persists across reloads."

### Risks / Notes
- Don't store JWT in localStorage if you can avoid it — use httpOnly cookies for production. For demo, localStorage is acceptable but document the tradeoff.
- Password reset is OUT of scope for the demo. Don't build it now.

---

## Phase 2 — Domains, Roadmaps & Topics

**Tagline:** *"The skeleton of the learning experience."*

### Goal
All 9 domains visible; 5 of them (Cybersecurity, Web Dev, AI, ML, Data Science) have full curated roadmaps with seeded topic data; topic pages render explanations.

### Prerequisites
- Phase 1 complete

### Tasks

#### Backend
1. Extend `prisma/schema.prisma`: `domains`, `roadmaps`, `topics` tables.
2. Add pgvector extension (`CREATE EXTENSION vector;`).
3. Add `embedding VECTOR(1536)` to topics (population deferred to Phase 7).
4. Run migration.
5. Build `prisma/seed.ts`:
   - Seed all 9 domains (with icons, descriptions).
   - For each of the 5 deep domains, seed a full roadmap with 60–90 topics.
   - Use LLM-assisted generation to draft topic lists, then human-review.
6. Routes/controllers: `GET /domains`, `GET /domains/:slug`, `GET /roadmap/:domainSlug`, `GET /topics/:id`.
7. LLM service: `llm.service.ts` — wrapper around chosen provider (Claude / OpenAI / Gemini), with retries and error handling.
8. Topic explanation endpoint: `POST /topics/:id/explain` — calls LLM, caches in Redis (key: `topic:{id}:level:{level}`, TTL 30 days).
9. Cache service: `cache.service.ts` (get/set/del with Redis).

#### Frontend
10. Pages: `/domains` (gallery), `/domains/[slug]` (roadmap view), `/topic/[id]` (topic page).
11. Components: `DomainCard`, `RoadmapTree`, `TopicCard`, `PhaseHeader`.
12. Build the domain gallery as a card grid (9 cards, color-coded by domain).
13. Build the roadmap view: visualize the 60–90 topics as a tree or path, with locked/unlocked states.
14. Topic page layout: title, summary, AI explanation panel, resources placeholder, quiz button placeholder, "Mark Complete" button.
15. Wire up the explanation endpoint: on first load, fetch and stream/render the LLM explanation; cache subsequent loads.
16. Add loading skeletons for all async UI.

### Definition of Done
- [ ] 9 domains seeded and visible in the gallery
- [ ] 5 deep roadmaps seeded with full topic data (60–90 topics each)
- [ ] Clicking a domain shows its roadmap visualization
- [ ] Clicking a topic opens the topic page with AI explanation
- [ ] AI explanation is cached after first generation (verify Redis hit on second load)
- [ ] "Mark Complete" button works (creates `user_progress` row)
- [ ] All pages mobile-responsive
- [ ] Manual QA: walk through all 5 deep domains end-to-end

### Demoable Output
> "I can browse 9 tech domains, click any of the 5 main domains to see a roadmap, click any topic, and get an AI-generated explanation."

### Risks / Notes
- Seeding 5 deep roadmaps is the heaviest content task. Use LLM to draft, then review. Allocate at least 3 days for content review alone.
- Don't ship topics with bad LLM explanations to staging — review at least the first 10 topics per domain manually.

---

## Phase 3 — AI Chatbot (Core)

**Tagline:** *"The crown jewel of SkillStreak AI."*

### Goal
A premium streaming chatbot with intent routing, structured outputs, and topic-aware context.

### Prerequisites
- Phase 1 (auth) complete
- Phase 2 (topics) at least partially complete (chatbot needs topic context)

### Tasks

#### Backend
1. Extend schema: `chat_sessions`, `chat_messages` tables.
2. Run migration.
3. Build `chat.service.ts`:
   - `createSession(userId, topicId?)` → returns sessionId
   - `sendMessage(sessionId, userMessage)` → streams LLM response
   - `getHistory(sessionId)` → returns messages
4. Build the **intent router** (`intent.prompt.ts` + classifier function):
   - Classify input into: `explain | roadmap | quiz | recommend | doubt | motivational`
   - Route to appropriate prompt template and output schema.
5. Build prompt templates: `system.prompt.ts`, `explain.prompt.ts`, `quiz.prompt.ts`, `roadmap.prompt.ts`.
6. System prompt includes: user level, current domain, current topic, streak status, recent quiz scores.
7. Implement Server-Sent Events (SSE) endpoint: `POST /chat` — streams tokens.
8. Persist user + assistant messages to `chat_messages` after stream completes.
9. Cache common explanations keyed by `topic_id + level` (re-use Phase 2 cache).
10. Add input sanitization: length limit (2000 chars), basic prompt-injection regex filter.
11. Add safety disclaimer to system prompt: "If asked something off-topic, politely redirect to tech learning."

#### Frontend (Premium UI)
12. Components: `ChatWidget` (floating button), `ChatWindow`, `MessageBubble`, `ChatInput`, `SessionSidebar`.
13. Page: `/chatbot` (full-screen view); also embedded as floating widget on every page.
14. Build streaming text rendering with **typewriter effect**.
15. Render assistant messages as **Markdown** with `react-markdown` + `remark-gfm`.
16. Syntax-highlight code blocks with **Shiki**; add a copy button to each.
17. **Typing indicator** (3 animated dots) before the first token arrives.
18. **Auto-scroll** the chat window, but don't fight the user if they manually scroll up.
19. **Suggested follow-up chips** (3 generated alongside the response, rendered below).
20. **Regenerate response** button on assistant messages.
21. **Session sidebar:** list, search, rename, delete sessions.
22. Topic-aware default: when opened from a topic page, the chatbot pre-loads that topic context.
23. Hooks: `useChat.ts` — manages SSE stream, message state, regeneration.
24. Store: `chatStore.ts` — session list, active session, messages.
25. Animation: bot messages fade in; user messages slide in from right.

### Definition of Done
- [ ] Chat widget is visible on every authenticated page
- [ ] Sending a message streams a response token-by-token
- [ ] Messages persist; reloading restores the conversation
- [ ] Markdown renders correctly; code blocks have syntax highlighting + copy buttons
- [ ] Intent router correctly classifies: "explain X", "give me a roadmap for X", "quiz me on X", "recommend videos for X"
- [ ] Topic-aware: chat opened from a topic page already knows that topic
- [ ] Session sidebar lists past sessions; can rename and delete
- [ ] Off-topic questions are politely redirected
- [ ] Regenerate button works
- [ ] Suggested follow-up chips appear after each response
- [ ] Manual QA: 10+ different chat scenarios across all 5 deep domains

### Demoable Output
> "Watch — I'm on the CIA Triad topic. I open the chatbot. It already knows the topic. I ask 'explain this with an analogy.' It streams a beautifully formatted response with a code-style example, suggests three follow-up questions, and saves the session."

### Risks / Notes
- This is the most visible feature. Spend extra polish time here.
- Test the intent router thoroughly — misclassification breaks the experience.
- Cap LLM tokens per response (e.g., 800 max) to control cost.
- Add a "AI may be inaccurate" disclaimer below the chat input.

---

## Phase 4 — Quiz Engine

**Tagline:** *"Test understanding, feed personalization."*

### Goal
LLM-generated MCQ quizzes with auto-grading, attempt history, and beautiful presentation.

### Prerequisites
- Phase 2 (topics) complete
- Phase 3 (LLM service) complete

### Tasks

#### Backend
1. Extend schema: `quiz_attempts` table.
2. Run migration.
3. Build `quiz.service.ts`:
   - `generateQuiz(topicId, level)` → returns 5 MCQs in JSON.
   - `submitAttempt(userId, topicId, answers)` → scores and stores.
4. Use LLM **JSON mode / tool use** to force structured output (5 questions, 4 options each, answer index, explanation).
5. **Validation pass:** second LLM call validates the answer key against the explanation — flag mismatches; retry if mismatch detected.
6. Cache generated quizzes keyed by `topic_id + level` (TTL 7 days).
7. Routes: `POST /quiz/generate`, `POST /quiz/:id/submit`, `GET /quiz/history`.
8. Hook into progress: passing 3/5 marks topic as `completed`.

#### Frontend
9. Page: `/quiz/[topicId]`.
10. Components: `QuizPlayer`, `QuestionCard`, `QuizTimer`, `QuizResult`.
11. Card-flip animation on question reveal.
12. One question at a time; progress bar showing N of 5.
13. 60-second timer per question (optional; user can disable in settings).
14. Submit selection → animate green for correct, red shake for incorrect; show inline explanation.
15. After all 5 questions: result screen with score, breakdown, confetti on perfect score.
16. Add "Retake quiz" button.
17. Wire to `user_progress`: update best_score and status.

### Definition of Done
- [ ] Quiz generates 5 valid MCQs for any topic
- [ ] Validation pass catches and rejects bad question/answer pairs
- [ ] User can answer all 5; correct/incorrect feedback is immediate
- [ ] Final score is computed and stored in `quiz_attempts`
- [ ] Passing 3/5 marks the topic complete in `user_progress`
- [ ] Confetti fires on perfect score
- [ ] Retake works; new questions are different
- [ ] Quiz UI works on mobile

### Demoable Output
> "I take a 5-question quiz on the CIA Triad. Each question reveals with a card-flip animation. Wrong answers show me why. I get 5/5 → confetti. The topic is now marked complete."

### Risks / Notes
- LLM hallucination on quiz answers is the #1 risk. The two-pass validation is mandatory.
- Don't let users repeat the same exact quiz immediately — regenerate on retake.

---

## Phase 5 — Progress & Analytics

**Tagline:** *"Show users their journey."*

### Goal
A dashboard that visualizes the user's progress across all domains with charts, heatmap, and insights.

### Prerequisites
- Phase 2 (topics, progress data exists)
- Phase 4 (quiz attempts exist)

### Tasks

#### Backend
1. Routes: `GET /progress`, `GET /progress/:domainSlug`, `GET /analytics/heatmap`.
2. Build `progress.controller.ts`:
   - Total topics completed / total available
   - Per-domain progress (topics done / total)
   - Average quiz score per domain
   - Time spent per domain
   - Weak areas (topics where user scored < 60%)
   - Activity heatmap data (last 90 days, count per day)
3. Add efficient SQL queries with appropriate indexes.

#### Frontend
4. Page: `/dashboard` (already a placeholder from Phase 1; now build it out).
5. Page: `/progress` (deeper analytics view).
6. Components: `StreakBanner`, `DomainProgress` (rings), `Heatmap`, `WeakAreasCard`.
7. **GitHub-style heatmap** with hover tooltips showing date + activity.
8. **Circular progress rings** per domain, with gradient strokes.
9. Animated XP bar (animate from old value to new on XP gain).
10. "Today's topic" card with gradient border.
11. Charts (Recharts) for quiz score trends and time spent.

### Definition of Done
- [ ] Dashboard shows current streak, today's topic, total XP, level
- [ ] Heatmap shows last 90 days of activity
- [ ] Per-domain progress rings update as user completes topics
- [ ] Weak areas card lists topics under 60% score
- [ ] Charts render smoothly with hover interactions
- [ ] All numbers reflect real DB state (no hardcoded values)
- [ ] Mobile-responsive (charts adapt or stack)

### Demoable Output
> "Here's my dashboard. I've done 12 topics across 3 domains, my streak is 7 days, I have 215 XP and I'm level 3. The heatmap shows my consistency. I'm weak in OWASP Top 10 — the system flagged it."

### Risks / Notes
- Make sure analytics queries use indexes; otherwise the dashboard will be slow as data grows.
- Heatmap should gracefully handle "0 days completed" empty state.

---

## Phase 6 — Streaks & Gamification

**Tagline:** *"Build the habit loop."*

### Goal
Daily streaks, XP, levels, badges, weekly leaderboard — fully wired into every action.

### Prerequisites
- Phase 4 (quiz attempts) complete — XP needs source events
- Phase 5 (dashboard) — gamification surfaces here

### Tasks

#### Backend
1. Extend schema: `streaks`, `badges`, `user_badges` tables.
2. Run migration.
3. Build `streak.service.ts`:
   - `recordActivity(userId)` → updates streak based on last_active_date
   - `useFreeze(userId)` → consume a freeze
   - `dailyStreakCheck()` → cron job: at midnight, mark streaks broken if no activity yesterday
4. Build XP rules engine (per planning doc §17.1):
   - Award XP on: topic complete, quiz pass, perfect quiz, daily streak, first topic of day, chat usage.
   - Compute level from total XP using the formula in §17.2.
5. Seed badges (per §17.4): First Step, Week Warrior, Marathoner, Quiz Master, Domain Pioneer, Polyglot, Insomniac, Early Bird.
6. Build badge-evaluation logic — runs after every relevant event; awards if criteria met.
7. Routes: `GET /streak`, `POST /streak/freeze`, `GET /leaderboard`, `GET /badges`.
8. Leaderboard query: top 10 users by XP earned this week.

#### Frontend
9. Components: `StreakBanner`, `XPBar`, `BadgeCard`, `LevelUpModal`, `LeaderboardRow`.
10. Streak banner at top of dashboard with flame icon (scales with streak length).
11. **Level-up modal** with confetti and animation when a level is gained.
12. **Badge earned toast** when a badge unlocks; tap to see badge gallery.
13. Page: `/leaderboard` — weekly top 10 with avatars and XP.
14. Animate XP gain (number tickers up, bar fills).

### Definition of Done
- [ ] Streak increments on first qualifying action of the day
- [ ] Streak breaks if no activity for a full day (and no freeze used)
- [ ] User can use a streak freeze (max 1 banked)
- [ ] XP is awarded correctly per the XP rules
- [ ] Levels recalculate correctly from XP total
- [ ] All 8 badges are earnable; criteria checked correctly
- [ ] Level-up modal fires on level gain
- [ ] Weekly leaderboard shows top 10
- [ ] Manual QA: simulate 7 days of activity → streak says 7

### Demoable Output
> "Watch — I complete a topic. XP +10 animates. I see my flame icon get bigger. I check the leaderboard — I'm 3rd this week. I just earned the 'Week Warrior' badge — there's the toast."

### Risks / Notes
- Time-zone handling for streaks is tricky. Default to UTC; mention this in the report.
- Test the cron job manually first (run it on demand) before relying on schedule.

---

## Phase 7 — Resource Recommender

**Tagline:** *"Curated learning, automatic."*

### Goal
Every topic ends with curated YouTube videos and documentation links, ranked by quality.

### Prerequisites
- Phase 2 (topics) complete

### Tasks

#### Backend
1. Extend schema: `resources` table.
2. Run migration.
3. Build `youtube.service.ts`:
   - Use YouTube Data API v3 to search by topic title.
   - Filter by view count, duration (3–20 min ideal), language.
   - Cache search results in DB for 7 days.
4. Build `recommender.service.ts`:
   - Generate embeddings for each topic via the LLM provider's embedding API.
   - Store in `topics.embedding` (pgvector).
   - Generate a "user profile embedding" by averaging completed topic embeddings.
   - Top-K next-topic recommendations via cosine similarity.
5. Routes: `GET /resources/:topicId`, `GET /recommendations` (returns top-K next topics).
6. Hand-curate documentation links per topic for the 5 deep domains (admin task).
7. Quality scoring: combine YouTube view count, click-through rate (later), admin rating.

#### Frontend
8. On topic page: render resources section with 3–5 YouTube videos + 2–3 doc links.
9. Video cards show thumbnail, title, channel, duration, view count.
10. Doc cards show favicon, title, source domain.
11. Track click-through (POST to backend → updates click count).
12. On dashboard: "Recommended for you" section using the embedding recommender.

### Definition of Done
- [ ] Every topic has at least 3 videos + 1 doc link
- [ ] Click-through is tracked
- [ ] Embedding-based recommender returns sensible top-K topics
- [ ] YouTube quota usage stays under 5,000 units/day in normal use
- [ ] Resource cards look beautiful (thumbnails, hover effects)

### Demoable Output
> "On the CIA Triad page, I see 5 great YouTube videos and 3 documentation links — all curated. On my dashboard, the system recommends 'Authentication vs Authorization' as my next topic, based on cosine similarity of my completed-topic embeddings."

### Risks / Notes
- YouTube API has a 10,000 unit/day quota. Cache aggressively.
- pgvector is fast but make sure the IVFFlat index is created.

---

## Phase 8 — Notifications & Admin

**Tagline:** *"Keep users coming back; keep content fresh."*

### Goal
Email reminders that protect streaks; admin panel for content curation and metrics.

### Prerequisites
- Phase 6 (streaks) complete — reminders depend on streak data
- Phase 1 (auth + roles) — admin needs role gating

### Tasks

#### Backend
1. Build `email.service.ts` (Resend or SendGrid).
2. Build daily streak reminder cron: `streakReminder.job.ts` — runs at user's chosen time; emails users whose streak is at risk (no activity by 8 PM local).
3. Build weekly digest cron: `weeklyDigest.job.ts` — sends Sunday summary (XP earned, topics completed, leaderboard rank).
4. Add `role` column to users (default `user`, admin set manually for the demo team).
5. Admin routes: `POST /admin/topics`, `PUT /admin/topics/:id`, `DELETE /admin/topics/:id`, `GET /admin/metrics`.
6. Role-gating middleware on `/admin/*` routes.

#### Frontend
7. Page: `/admin` (separate area, only accessible to admins).
8. Admin panel sections:
   - Topics: list, create, edit, delete.
   - Resources: add/edit per topic.
   - Metrics: total users, daily active users, popular topics, retention.
   - Approve/reject auto-generated content.
9. Settings page: let user configure reminder time and toggle weekly digest.

### Definition of Done
- [ ] Streak reminder email sends at the right time
- [ ] Weekly digest sends every Sunday
- [ ] Admin can add/edit/delete topics and resources
- [ ] Admin metrics dashboard shows real numbers
- [ ] Non-admin users get 403 on `/admin/*` routes
- [ ] User can configure reminder time

### Demoable Output
> "Here's an email I got at 8 PM saying my streak is at risk. Here's the admin panel — I can add a new topic, edit it, see how many users are active today."

### Risks / Notes
- Test emails with a real (test) inbox before demo day.
- Don't send marketing-style emails — keep it friendly and low-frequency.

---

## Phase 9 — Frontend Excellence

**Tagline:** *"Make it look like a $10M product."*

### Goal
Apply the full polish set from `SKILLSTREAK_AI_PLANNING.md` §15.4 across the entire app.

### Prerequisites
- All feature phases (1–8) complete

### Tasks

#### Sprint I — Animations & Visual Polish (Week 9.1)
1. Install and configure **Framer Motion** globally.
2. Add page transitions on route changes (fade + slide).
3. Hero section on landing page: animated gradient background + Lottie illustration + headline animation.
4. Glassmorphism on chatbot panel, streak card, leaderboard cards.
5. Gradient borders on CTAs, badges, active states.
6. Custom illustrations for all empty states (no streak, no badges, no topics started).
7. Micro-interactions on every clickable element (hover lift, press scale).
8. Streak flame animation (CSS keyframes).
9. XP-gain animation: number tickers, bar fills smoothly.
10. Level-up burst animation.
11. Card-flip animation on quiz reveal.
12. Beautiful 404, 500, offline pages.

#### Sprint II — Mobile, Accessibility, Performance (Week 9.2)
13. Mobile audit: every page on iPhone 12 / Pixel viewport.
14. Mobile-first refactor where needed.
15. Bottom navigation bar on mobile.
16. Accessibility audit: keyboard navigation on every page.
17. Add focus rings (custom-styled, visible).
18. Add screen-reader labels to all icon-only buttons.
19. Color contrast audit (light + dark themes) — fix anything failing WCAG AA.
20. `prefers-reduced-motion` support: disable animations for users who set this.
21. Lighthouse audit on every page; target 95+ on Performance, Accessibility, Best Practices, SEO.
22. Image optimization: convert all PNGs to WebP/AVIF; use Next.js `<Image>`.
23. Code-split route-by-route; dynamic-import chatbot/quiz/admin.
24. Bundle size audit: each route < 200KB gzipped initial JS.
25. Font loading: `next/font` with display swap.

### Definition of Done
- [ ] Hero section animates beautifully on landing
- [ ] Page transitions are smooth across the app
- [ ] All micro-interactions feel premium
- [ ] All empty states have custom illustrations
- [ ] Mobile experience is fully usable
- [ ] Lighthouse: 95+ across all four categories on top 5 pages
- [ ] WCAG 2.1 AA on all pages
- [ ] `prefers-reduced-motion` respected
- [ ] Bundle size within budget
- [ ] No layout shifts (CLS < 0.1)

### Demoable Output
> "Open it on your phone. Try it on the desktop. Try it with reduced-motion on. Try keyboard-only. Run Lighthouse — 98, 100, 95, 100. This is the bar."

### Risks / Notes
- Polish always takes longer than expected. Start Sprint I exactly on schedule; don't slip.
- Lighthouse score of 95+ is hard to hit on Performance for a chat-heavy app. Be willing to tune. Aim 90+ as soft floor, 95+ as goal.

---

## Phase 10 — Testing & Hardening

**Tagline:** *"Break it before the examiner does."*

### Goal
Test coverage on the backend, manual QA across all flows, security review, edge-case fixes.

### Prerequisites
- Phase 9 complete — testing what's actually shipping

### Tasks

#### Automated Testing
1. Unit tests for backend services: auth, quiz scoring, streak logic, XP rules, intent router.
2. Integration tests for API endpoints with a test database.
3. Snapshot tests for LLM prompt outputs (regression check).
4. Aim for ~60% backend coverage.

#### Manual QA
5. Write a QA checklist covering all user flows (per planning doc §14).
6. Two team members run the full checklist independently.
7. Log every bug found in a `bugs.md` tracker.
8. Fix critical and major bugs.

#### Security Review
9. Verify password hashing (bcrypt cost ≥ 10).
10. Verify all `/admin/*` routes are role-gated.
11. Verify JWT expiry and refresh logic.
12. Verify input validation (Zod) on every endpoint.
13. Rate limiting on `/api/chat`, `/api/quiz/generate`, `/api/auth/*`.
14. CORS configured strictly to frontend origin in production.
15. SQL injection check (Prisma protects this; verify no raw queries).
16. XSS check: ensure all user-rendered content is sanitized (Markdown should escape HTML).
17. CSRF: not strictly needed for JWT in headers, but document the choice.
18. Check for prompt-injection guardrails in chatbot.

#### Edge Cases
19. New user with zero data: dashboard renders gracefully.
20. User with 100+ chat sessions: sidebar paginates.
21. Network failure during quiz submission: handles gracefully.
22. LLM API down: chatbot shows fallback message, not white screen.
23. Streak edge case: user crosses midnight while taking a quiz — handled correctly.

### Definition of Done
- [ ] Backend test coverage ≥ 60%
- [ ] All critical and major bugs fixed
- [ ] Security checklist all green
- [ ] All edge cases handled
- [ ] Two-person manual QA checklist signed off
- [ ] No console errors on any page

### Demoable Output
> "Here's our test report — 47 tests, all passing. Here's our security review — every box checked. We tried to break it for two days; here are the bugs we found and fixed."

### Risks / Notes
- Don't chase 100% coverage. Cover the critical paths well; skip trivial getters.
- Manual QA always finds bugs that tests miss. Plan for it.

---

## Phase 11 — Deployment & Demo Prep

**Tagline:** *"Ship it. Sell it."*

### Goal
Production deployment with monitoring; final report; recorded demo; viva preparation.

### Prerequisites
- All previous phases complete

### Tasks

#### Production Deployment
1. Move from staging URLs to production-quality (custom domain optional).
2. Set up Sentry (frontend + backend) for error monitoring.
3. Set up basic uptime monitoring (UptimeRobot free tier).
4. Run final database migration on production Postgres.
5. Verify environment variables are correct in production.
6. Run smoke tests on production after deploy.
7. Seed production database with all 5 deep domain roadmaps.

#### Documentation
8. Update README with deployed URLs, setup instructions, demo credentials.
9. Write `docs/architecture.md`, `docs/api.md`, `docs/database.md`.
10. Export final architecture diagram, ER diagram, DFDs, sequence diagrams as PNGs.
11. Update planning doc to reflect final reality.

#### Final Report (Academic Submission)
12. Cover page, abstract, table of contents.
13. Sections: Introduction, Literature Survey, Problem Statement, Proposed System, System Design, Implementation, Testing, Results, Conclusion, Future Scope, References.
14. Include screenshots from the deployed app.
15. Include diagrams from `/docs/diagrams/`.
16. Format per your university's submission guidelines.

#### Demo Preparation
17. Write a 5-minute demo script — exact flow, exact pages, exact words.
18. Pre-create demo accounts at different progress levels (new user, mid-progress, near-mastery).
19. Practice the demo at least 3 times with the team.
20. Record a polished video demo (with voiceover) as a backup.
21. Prepare slides for the final presentation (10–15 slides).
22. Prepare answers to expected viva questions (see appendix).

### Definition of Done
- [ ] Production deployment is stable and monitored
- [ ] All documentation written and committed
- [ ] Final report drafted, reviewed, formatted
- [ ] Slides ready for presentation
- [ ] Demo recorded as fallback
- [ ] Team has rehearsed live demo
- [ ] All academic submission deliverables packaged

### Demoable Output
> "Here's the production URL. Here's the report. Here's the recorded demo. Let me show you the live version."

### Risks / Notes
- **Always have a recorded demo backup.** Live demos fail at the worst moments.
- Don't change code in the last 48 hours before demo day. Freeze the build.

---

## Appendix A — Common Viva Questions to Prepare

Examiners commonly ask:

1. "Why is this AI? Show me where ML/AI is used beyond ChatGPT-style wrapping."
   → Answer: chatbot intent routing, structured outputs, embedding-based topic recommender, plus the entire LLM service layer.

2. "How does personalization actually work?"
   → Answer: Three mechanisms — onboarding survey, chatbot context injection, embedding recommender. Walk through one example end-to-end.

3. "What's the cost of running this at scale?"
   → Answer: Caching reduces LLM cost by ~70%; current cost per active user per day is ~$X. Discuss in Future Scope.

4. "How do you prevent the chatbot from hallucinating?"
   → Answer: System prompt rules; quiz validation pass; disclaimer to user; admin-flagged content can be regenerated.

5. "Why nine domains? Isn't that too broad?"
   → Answer: Five are deeply curated; four use the chatbot's on-demand generation. This is a deliberate "extensible architecture" design choice — proves the platform scales beyond the initial five.

6. "How is this different from Mimo / Sololearn / ChatGPT?"
   → Answer: Multi-domain, structured roadmaps with progress tracking, gamification, and a tutor that knows your level and current topic — vs. raw content (Mimo) or contextless chat (ChatGPT).

7. "What's your DB schema?"
   → Answer: Walk through the ER diagram from `SKILLSTREAK_AI_PLANNING.md` §12.1.

8. "Show me one full request lifecycle."
   → Answer: Walk through the chatbot example from §10.3.

---

## Appendix B — Phase Exit Checklist Template

Copy this for each phase as you complete it:

```
## Phase {N} — {Name} — Exit Review
Date completed: ____________
Lead: ____________

### Definition of Done — Verified
- [ ] All checkboxes ticked
- [ ] Deployed to staging
- [ ] No regressions in previous phases
- [ ] Demoable output recorded (screenshot or video)
- [ ] Bugs filed for any known issues
- [ ] Branch merged to main
```

---

## Appendix C — Parallelization Map

If you have a 2–4 person team, these can run in parallel:

| Combination | Notes |
|---|---|
| Phase 2 (content seeding) + Phase 3 (chatbot dev) | Content seeding is mostly LLM-assisted prep; chatbot dev is engineering. Different team members. |
| Phase 5 (analytics) + Phase 6 (gamification) | Both consume the same data; one builds dashboard widgets, the other builds streak/XP logic. |
| Phase 9 Sprint I (animations) + Phase 10 (backend testing) | Frontend dev polishes; backend dev writes tests. Zero conflict. |

Sequential dependencies that *cannot* parallelize:
- Phase 0 → Phase 1 (no auth, can't build anything)
- Phase 1 → Phase 2 (no users, can't have user_progress)
- Phase 4 (quizzes) → Phase 6 (gamification — needs quiz events for XP)
- Phase 9 → Phase 10 (test what ships, not prototype code)

---

**End of Battleplan**

Treat each phase as a contract: enter with prerequisites met, exit with Definition of Done verified. Do not proceed to Phase N+1 until Phase N is signed off.
