# SkillStreak AI — Manual QA Checklist

**Phase 10 — Testing & Hardening**
Run this checklist end-to-end. Log every bug you find in `bugs.md`.

---

## How to use

- One run = one tester, one fresh browser profile (or incognito).
- Mark each item: `[x]` pass, `[F]` fail (open a row in `bugs.md`), `[~]` pass with caveat.
- Run twice: once on desktop (Chrome 120+), once on mobile viewport (375 px wide).
- Test against `npm run dev` with both servers up. Test against the deployed build before tagging release.

---

## 1. Auth & Onboarding (BATTLEPLAN §1)

### 1.1 Signup
- [ ] Landing page loads with hero + CTAs visible
- [ ] "Get Started" routes to `/register`
- [ ] Register with valid email + password (≥ 8 chars) → success
- [ ] Register with invalid email → form rejects with error
- [ ] Register with short password (< 8 chars) → rejected
- [ ] Register with email already in use → 409 with friendly message
- [ ] After signup, auto-redirected to `/onboarding`

### 1.2 Onboarding survey
- [ ] All 3 questions render (prior level, goal, pace)
- [ ] Cannot submit without answering all 3
- [ ] Successful submit → redirect to `/domains`
- [ ] User profile persists (refresh → still onboarded)

### 1.3 Login & logout
- [ ] Login with correct credentials → redirect to `/dashboard`
- [ ] Login with wrong password → 401 with non-leaky error ("invalid credentials")
- [ ] Login with non-existent email → same generic 401 (no user enumeration)
- [ ] Logout button clears session, redirects to `/`
- [ ] Hitting protected route while logged out → redirect to `/login`

### 1.4 Session persistence
- [ ] Refresh on `/dashboard` while logged in → still logged in
- [ ] JWT cookie has `HttpOnly` and (in prod) `Secure` flags
- [ ] Session survives browser restart for the cookie's TTL

---

## 2. Domains & Roadmaps (BATTLEPLAN §2)

- [ ] `/domains` shows all 9 domains with progress bars
- [ ] Each domain card shows topic count + completion %
- [ ] Click a domain → roadmap page renders
- [ ] Roadmap shows ~60 topics in 3 phases (Foundations / Core / Advanced)
- [ ] Topic statuses (locked / not_started / in_progress / completed) render correctly
- [ ] Locked topics cannot be opened by clicking
- [ ] First topic is unlocked for new users

## 3. Topic Page (BATTLEPLAN §3)

- [ ] Open a topic → explanation, prerequisites, learning objectives all render
- [ ] Markdown is rendered (headings, code blocks, lists)
- [ ] HTML in topic content is escaped (no XSS)
- [ ] "Mark complete" button appears
- [ ] Marking complete → topic transitions to completed, next unlocks
- [ ] XP banner / toast fires on completion

## 4. Chatbot (BATTLEPLAN §3)

- [ ] Click chat icon (or `/chatbot` route) → chat opens
- [ ] Send a message → streamed response appears
- [ ] Intent router classifies correctly:
  - [ ] "quiz me on X" → quiz intent
  - [ ] "roadmap for Y" → roadmap intent
  - [ ] "recommend videos on Z" → recommend intent
  - [ ] "I'm stuck on a bug" → doubt intent
  - [ ] "I'm losing motivation" → motivational intent
- [ ] Chat history persists (refresh → previous messages still there)
- [ ] Sidebar lists previous sessions
- [ ] Rename / delete session works
- [ ] New chat creates a new session
- [ ] Prompt injection attempts are rejected ("ignore previous instructions" etc.)
- [ ] Empty/whitespace messages rejected with friendly error
- [ ] Long messages (> 2000 chars) rejected with friendly error
- [ ] Follow-up suggestions appear after assistant response (best-effort)

## 5. Quiz (BATTLEPLAN §4)

- [ ] Open `/quiz/[topicId]` → 5 questions, 4 options each
- [ ] Submit answers → score reveals + per-question explanations
- [ ] Score ≥ 3/5 → topic marks completed
- [ ] Score < 3/5 → topic stays in_progress
- [ ] Network failure during submit → graceful error, no lost data
- [ ] Refreshing mid-quiz reloads questions (cached for 7 days)
- [ ] Re-take with `?fresh=1` produces a new question set
- [ ] Quiz answers must be integers 0..3 (server rejects garbage)

## 6. Progress / Dashboard (BATTLEPLAN §5)

- [ ] Dashboard shows streak banner with current count + freezes
- [ ] Heatmap renders (52 weeks)
- [ ] Weak areas section lists topics with low scores
- [ ] Score trend chart renders
- [ ] New user (zero data) → no blank/error states; friendly empty messages
- [ ] All numbers match backend data (verify via DB)

## 7. Gamification (BATTLEPLAN §6)

- [ ] Completing a topic awards XP + streak day
- [ ] Perfect quiz (5/5) awards bonus XP
- [ ] First topic of the day → first_topic_of_day bonus
- [ ] Level-up animation/toast fires when crossing a level boundary
- [ ] Streak count increments on consecutive UTC days
- [ ] Spending a freeze deducts from `freezesAvailable`
- [ ] No freezes → spending request returns 409
- [ ] Midnight crossing during a quiz → handled correctly (streak ticks for the new day)

## 8. Resources (BATTLEPLAN §7)

- [ ] Topic page shows curated videos + docs
- [ ] Recommender returns ranked list per topic
- [ ] Broken/dead links flagged or filtered
- [ ] No-key fallback (YouTube API down) → page still renders

## 9. Notifications & Admin (BATTLEPLAN §8)

- [ ] Settings → notification preferences toggle correctly
- [ ] Email send (when Resend key present) succeeds; no-key path is a quiet no-op
- [ ] `/admin` is gated to role=admin (regular user → 403)
- [ ] Admin panel lists users + content stats
- [ ] Admin trigger buttons (e.g. send streak reminders) fire without errors

## 10. Frontend polish (BATTLEPLAN §9)

- [ ] 404 page renders with CTAs
- [ ] All routes have `loading.tsx` skeletons
- [ ] Skip-to-content link visible on keyboard tab
- [ ] Mobile chatbot sidebar hides on small screens
- [ ] Dark theme renders consistently
- [ ] No console errors on any page
- [ ] No console warnings except known framework noise

## 11. Edge cases

- [ ] New user with no data on dashboard → friendly empty states everywhere
- [ ] User with 100+ chat sessions → sidebar paginates / scrolls without lag
- [ ] LLM API down → chatbot shows fallback message, not white screen
- [ ] LLM returns malformed JSON → graceful error in quiz generation
- [ ] Rate limit exceeded on `/api/chat` → 429 with retry-after hint
- [ ] Database connection lost mid-request → 500 with no internal stack trace leaked

---

## Sign-off

| Tester | Date | Pass count | Fail count | Notes |
|--------|------|------------|------------|-------|
| | | | | |
| | | | | |
