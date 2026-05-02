# Database

Provider: **PostgreSQL 16** with the **pgvector** extension.
ORM: **Prisma**.

## Phase 0 — Schema

Only the `users` table exists. See `backend/prisma/schema.prisma`.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `email` | String | Unique |
| `password_hash` | String | bcrypt hash |
| `name` | String | |
| `role` | String | `user` \| `admin` |
| `level` | Int | Default 1 |
| `xp` | Int | Default 0 |
| `created_at` | DateTime | Default now() |
| `updated_at` | DateTime | Auto-updated |

The full schema (domains, topics, progress, quiz, chat, streaks, badges, etc.) is documented in `planning/SKILLSTREAK_AI_PLANNING.md` §12.2 and will be added incrementally per the battleplan.

## Local development

```powershell
npm run db:up                           # Start Postgres + Redis containers
npm --workspace backend run db:migrate  # Run Prisma migrations
npm --workspace backend run db:studio   # Visual DB browser
```
