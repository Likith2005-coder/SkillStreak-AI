# Security Review — Phase 10

**Reviewed:** 2026-05-05
**Reviewer:** Likith
**Branch:** main
**Method:** Code audit against the BATTLEPLAN §10 security checklist + manual probes.

---

## Summary

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | bcrypt cost ≥ 10 | PASS | `env.BCRYPT_ROUNDS` defaults to 10, used by `hashPassword` |
| 2 | All `/admin/*` routes role-gated | PASS | Router-level `requireAuth, requireAdmin` |
| 3 | JWT expiry + verification | PASS | 7-day default, signature + structural checks |
| 4 | Zod validation on every endpoint | PASS | All write/read endpoints use `validate()` middleware |
| 5 | Rate limiting on hot paths | PASS | Per-route limiters on auth (30/15min), chat (20/min), quiz gen (10/min), explain (30/min); global 120/min |
| 6 | CORS strict to frontend origin | PASS | `origin: env.FRONTEND_ORIGIN, credentials: true` |
| 7 | SQL injection | PASS (with note) | All inputs parameterized; one inline interpolation reviewed and judged safe (DB-controlled identifiers + integer-coerced limit) |
| 8 | XSS in user-rendered content | PASS | ReactMarkdown without `rehype-raw` → raw HTML is escaped to text |
| 9 | CSRF | DOCUMENTED | Bearer-token auth in `Authorization: Bearer …` header, not cookies — CSRF not applicable |
| 10 | Prompt-injection guardrails | PASS | `sanitizeChatInput` blocks 7 injection patterns (regex-based); system prompt also instructs model to ignore role-override attempts |

All items: **PASS**.

---

## 1. Password hashing

`backend/src/utils/password.util.ts:4` calls `bcrypt.hash(plain, env.BCRYPT_ROUNDS)`.
`backend/src/config/env.ts:16` sets `BCRYPT_ROUNDS` default to 10 (Zod-validated positive int).

```ts
BCRYPT_ROUNDS: z.coerce.number().int().positive().default(10),
```

Verified hash format starts with `$2[aby]$10$` in unit tests (`tests/utils/password.test.ts`).

Test coverage: round-trip, wrong-password rejection, prefix format, salt randomness.

## 2. Admin route gating

`backend/src/routes/admin.routes.ts:10` applies router-wide middleware:

```ts
router.use(requireAuth, requireAdmin);
```

`requireAdmin` (auth.middleware.ts:21) checks `req.user.role === "admin"` and throws 403 otherwise. Both auth + admin checks must pass before any admin handler runs.

**Manual probe:** logged in as a non-admin user, hitting `GET /api/admin/metrics` returns `403 Admin only`.

## 3. JWT lifecycle

`signToken` uses `expiresIn: env.JWT_EXPIRES_IN` (default `"7d"`).
`verifyToken` validates:
- Signature (via `jsonwebtoken.verify`)
- Payload shape (`sub`, `email`, `role` all present and well-typed)

Tests cover: round-trip, tampered-signature rejection, foreign-secret rejection, expired-token rejection (`tests/utils/jwt.test.ts`).

**Note on refresh:** No refresh-token rotation. Single 7-day JWT, re-issued only on login. Acceptable for an academic demo; documented as future work.

## 4. Zod validation

The `validate(schema, source)` middleware is imported in every route file. Surveyed:

| Route | Validators |
|-------|------------|
| `/auth/register`, `/auth/login`, `/auth/me/profile`, `/auth/me/settings` | `registerSchema`, `loginSchema`, `profileSchema`, `settingsSchema` |
| `/chat/sessions` (POST/GET/PATCH/DELETE), `/chat/sessions/:id/messages` | `createSessionSchema`, `idParamSchema`, `renameSchema`, `sendMessageSchema` |
| `/quiz/topics/:id/generate`, `/quiz/topics/:id/submit` | `idParamSchema`, `generateBodySchema`, `submitBodySchema` |
| `/topics/:id`, `/topics/:id/explain`, `/topics/:id/complete` | `idParamSchema` |
| `/admin/topics/:id` (PATCH/DELETE) | `idParamSchema`, `updateTopicSchema` |

Numeric inputs are `z.coerce.number().int()` to prevent float/NaN injection.
Quiz answers validated as `0..3` integers (defense-in-depth — `submitAttempt` re-validates).

## 5. Rate limiting

| Endpoint | Limit | Window | File |
|----------|-------|--------|------|
| Global | 120 | 1 min | `app.ts:28` |
| `/auth/register`, `/auth/login` | 30 | 15 min | `auth.routes.ts:11` |
| `/chat/sessions/:id/messages` | 20 | 1 min | `chat.routes.ts:11` |
| `/quiz/topics/:id/generate` | 10 | 1 min | `quiz.routes.ts:11` |
| `/topics/:id/explain` | 30 | 1 min | `topic.routes.ts:12` |

Battleplan §10.13 requires limiters on `/api/chat`, `/api/quiz/generate`, `/api/auth/*` — all covered.

**Note:** `express-rate-limit` is in-memory; production deployment should swap to a Redis-backed store (`rate-limit-redis`) before going live, since multi-instance deployments would otherwise allow the limit to be circumvented by hitting different instances.

## 6. CORS

`backend/src/app.ts:14`:

```ts
cors({ origin: env.FRONTEND_ORIGIN, credentials: true })
```

`env.FRONTEND_ORIGIN` is Zod-validated as a URL. Single-origin only — no wildcards.

For production, set `FRONTEND_ORIGIN` to the deployed frontend URL.

## 7. SQL injection

Prisma's typed query API is used everywhere except the recommender service, which uses pgvector and needs `$queryRawUnsafe` for vector ops.

**Reviewed:** `backend/src/services/recommender.service.ts`

| Line | Pattern | Verdict |
|------|---------|---------|
| 35–41 | `LIMIT ${BACKFILL_PER_CALL}` | Safe — constant integer literal |
| 48–52 | `WHERE "id" = $2` | Safe — parameterized |
| 83–89 | `WHERE p."user_id" = $1` | Safe — parameterized |
| 92 | `completedIdsSql = completed.map(c => "'${c.id}'").join(",")` | **Reviewed: low risk.** Values come from a previous query's results (DB-issued cuids), never from user input. |
| 109–133 | `LIMIT ${Number(limit) | 0}` | Safe — `Number(...) \| 0` coerces to a clean 32-bit integer |

No raw queries elsewhere in the codebase (verified via grep for `queryRaw|executeRaw`).

**Recommendation (non-blocking):** swap line 92 to `prisma.$queryRaw\`… NOT IN (${Prisma.join(ids)})\`` to remove the inline interpolation entirely.

## 8. XSS

User-supplied content rendered:
- Chat messages → `<ReactMarkdown remarkPlugins={[remarkGfm]}>` in `MessageBubble.tsx`
- Topic explanations (LLM-generated) → `<ReactMarkdown>` in `topic/[id]/page.tsx`

ReactMarkdown does **not** render raw HTML by default. `rehype-raw` is **not** imported anywhere in the app, and `allowDangerousHtml` is never set. Verified via grep.

**Probe:** sending `<script>alert(1)</script>` as a chat message renders as plain text — no execution.

## 9. CSRF

Auth uses `Authorization: Bearer <jwt>` header, not cookies. CSRF attacks rely on browsers automatically attaching credentials cross-origin, which only happens with cookies. Bearer headers are not auto-attached.

**Decision:** No CSRF tokens needed. Documented per battleplan §10.17.

If we ever migrate to cookie-based auth (e.g. for SSE without query-string token), revisit and add `SameSite=strict` + CSRF tokens on state-changing routes.

## 10. Prompt injection

`backend/src/utils/sanitize.util.ts` defines 7 regex patterns blocking common injection phrasings:

- "ignore [all/previous/above/...] instructions/rules/prompts"
- "disregard [all/previous/above/...] instructions/rules/prompts"
- "forget everything / your instructions / the system prompt"
- "reveal your/the system prompt"
- "print the system prompt/instructions"
- "you are now/actually a(n) …"
- "act as a(n) …" (allow-list: tutor, teacher, mentor, coach)

Bug found and fixed during review: the original `(all|previous|above)` group only matched a single qualifier, so "ignore all previous instructions" slipped past. Now `(?:all |previous |above |any |the |prior )*` accepts any combination. Test coverage in `tests/utils/sanitize.test.ts`.

**Defense in depth:** the system prompt (`buildSystemPrompt`) explicitly instructs the model to refuse role-override and prompt-leak requests.

---

## Findings & fixes

| ID | Finding | Severity | Fix |
|----|---------|----------|-----|
| SEC-01 | Sanitize regex too narrow — common injection phrasing slipped through | Medium | Updated regex to allow chained qualifiers; tests added |
| SEC-02 | Recommender uses inline interpolation for already-DB-validated UUIDs | Low (non-blocking) | Documented; recommend `Prisma.join()` migration before production |
| SEC-03 | Rate limiter is in-memory — would not survive multi-instance deployment | Low (non-blocking) | Documented for Phase 11; swap to Redis store before scale-out |

All MEDIUM findings are fixed. LOW findings are documented for Phase 11.

---

## Recommendations for Phase 11 (deployment)

1. Switch `express-rate-limit` to `rate-limit-redis`.
2. Migrate the recommender's inline interpolation to `Prisma.join`.
3. Add Sentry for both backend and frontend.
4. Set `FRONTEND_ORIGIN` to the production URL.
5. Set `JWT_SECRET` from a strong random source (32+ bytes, base64).
6. Confirm `BCRYPT_ROUNDS` ≥ 12 in production (raise from default 10).
