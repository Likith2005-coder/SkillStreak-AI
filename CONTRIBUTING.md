# Contributing

Thanks for your interest in SkillStreak AI. This document covers how the project is
set up and the conventions to follow when changing it.

## Getting set up

See [Getting Started](README.md#-getting-started) in the README. In short: `npm install`,
`npm run db:up`, copy the two `.env` examples, `npm --workspace backend run db:migrate`,
then `npm run dev`.

You need a `GEMINI_API_KEY` in `backend/.env` for anything AI-powered (tutor, quizzes,
onboarding assessment, plan generation, interview prep). The rest of the app runs without it.

## Repository layout

This is an npm-workspaces monorepo. Run workspace commands from the repo root:

```bash
npm --workspace frontend run type-check
npm --workspace backend run test
```

| Workspace | Purpose | Port |
|---|---|---|
| `frontend` | Next.js 14 learner app | 3000 |
| `backend` | Express + Prisma API | 4000 |
| `admin` | Next.js admin console | 3001 |

## Before you open a pull request

```bash
npm run lint
npm run type-check
npm run test
```

All three must pass — CI runs the same commands on every push and pull request.

## Database changes

Prisma migrations are applied with `migrate deploy`, not the interactive `migrate dev`.
To add a migration:

```bash
npm --workspace backend exec -- prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/<timestamp>_<name>/migration.sql

npm --workspace backend exec -- prisma migrate deploy
npm --workspace backend exec -- prisma generate
```

Stop the dev servers before running `prisma generate` — a running server holds a lock on
the query engine binary on Windows.

## Conventions

**Commits** follow [Conventional Commits](https://www.conventionalcommits.org/):
`feat(scope):`, `fix(scope):`, `docs:`, `refactor:`, `chore:`. Keep the subject under
72 characters and explain the *why* in the body.

**TypeScript** is strict everywhere. Prefer inference over annotation, and don't reach for
`any` — if a type genuinely can't be expressed, leave a comment explaining why.

**Design.** The frontend follows the **Signal** design system documented in
[`frontend/DESIGN.md`](frontend/DESIGN.md). Two rules are non-negotiable:

1. Every animation needs a `prefers-reduced-motion: reduce` fallback.
2. Body text and placeholders must clear 4.5:1 contrast against their surface.

**AI-generated content.** Prompts that produce learning resources must never invent URLs.
Either reference a well-known stable page, or emit a search query string for the UI to
resolve. Every LLM call goes through the circuit-breaker-protected service in
`backend/src/services/llm.service.ts`.

## Reporting bugs

Open an issue using the bug report template. Include what you expected, what happened,
and the steps to reproduce it.
