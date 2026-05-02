# SkillStreak AI

AI-powered learning platform that helps users master modern technology domains through structured roadmaps, an AI chatbot tutor, gamified streaks, and curated resources.

## Architecture

Monorepo with two apps:

- **`frontend/`** — Next.js 14 + Tailwind + shadcn/ui
- **`backend/`** — Express + TypeScript + Prisma + PostgreSQL (with pgvector) + Redis

See [`planning/SKILLSTREAK_AI_PLANNING.md`](planning/SKILLSTREAK_AI_PLANNING.md) for the full system design and [`planning/BATTLEPLAN.md`](planning/BATTLEPLAN.md) for the phased build plan.

## Prerequisites

- Node.js >= 20
- npm >= 10
- Docker Desktop (for local Postgres + Redis)
- Git

## Quick Start

```powershell
# 1. Install dependencies (root + workspaces)
npm install

# 2. Start Postgres + Redis in Docker
npm run db:up

# 3. Set up backend env vars
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local

# 4. Run first Prisma migration
npm --workspace backend run db:migrate

# 5. Start both dev servers in parallel
npm run dev
```

Frontend will run on http://localhost:3000 and backend on http://localhost:4000.

The landing page should show a green "Backend connected" indicator when both apps are running.

## Available Scripts (root)

| Script | What it does |
|---|---|
| `npm run dev` | Start frontend + backend in parallel |
| `npm run dev:frontend` | Start frontend only |
| `npm run dev:backend` | Start backend only |
| `npm run build` | Build both apps for production |
| `npm run lint` | Lint both apps |
| `npm run test` | Run tests in both apps |
| `npm run db:up` | Start Postgres + Redis containers |
| `npm run db:down` | Stop containers |
| `npm run db:logs` | Tail container logs |

## Project Layout

```
skillstreak-ai/
├── frontend/              Next.js 14 app
├── backend/               Express + Prisma API
├── planning/              Project planning + battleplan
├── docs/                  Architecture, API, DB docs
├── docker-compose.yml     Local Postgres + Redis
└── package.json           Workspaces root
```

## Status

**Current phase:** Phase 0 — Foundation Setup (per `planning/BATTLEPLAN.md`).

## License

Academic / educational use.
