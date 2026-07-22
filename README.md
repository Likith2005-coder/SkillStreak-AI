# SkillStreak AI

**Learn tech skills the way you'd play a game — streaks, XP, and an AI tutor that never sleeps.**

SkillStreak AI is a full-stack, AI-powered learning platform. Pick a technology domain, follow a curated roadmap, chat with a streaming AI tutor, pass AI-generated quizzes, and keep your daily streak alive while you climb the leaderboard.

![Next.js](https://img.shields.io/badge/Next.js_14-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_+_pgvector-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)

---

## ✨ Features

| | Feature | What it does |
|---|---|---|
| 🤖 | **Streaming AI tutor** | Topic-aware, level-aware chat with intent-classified follow-ups. Every conversation persists; code blocks render with copy buttons. |
| 🗺️ | **Curated roadmaps** | 9 technology domains. Deeply-curated paths visualized as a Duolingo-style winding trail. |
| 📝 | **AI quizzes** | 5 MCQs per topic, generated then validated by a second LLM pass. Pass 3/5 to complete a topic. |
| 🔥 | **Streaks, XP & badges** | Daily streaks with auto-spent freezes, level math via `100·N·log₂(N+1)`, 8 unlockable badges, weekly leaderboard. |
| 📊 | **Progress analytics** | GitHub-style 90-day heatmap, per-domain progress rings, weak-area detection, score-trend charts. |
| 💀 | **Ethical Hacking Arsenal** | Every phase of a real penetration test with 37+ real tools and AI-generated field guides — inside a full hacker terminal UI. |
| 💼 | **Career paths & interview prep** | Role roadmaps per domain plus AI-driven interview practice. |
| 🎯 | **Personalized recommendations** | pgvector similarity matching surfaces the best next topic for each learner. |
| 🛠️ | **Admin console** | Separate admin app for metrics, topic management, users, and email digests. |

## 🏗️ Architecture

npm-workspaces monorepo with three apps:

```
skillstreak-ai/
├── frontend/     Next.js 14 learner app (Tailwind, shadcn/ui, Framer Motion, GSAP)  → :3000
├── backend/      Express + TypeScript API (Prisma, PostgreSQL + pgvector, Redis)    → :4000
├── admin/        Next.js admin console                                              → :3001
├── docs/         Architecture, API & database documentation
├── planning/     System design & engineering docs
└── docker-compose.yml   Local Postgres + Redis
```

**AI:** Google Gemini powers the tutor, quiz generation/validation, tool field guides, and interview prep. Embeddings + pgvector drive personalized recommendations. A circuit breaker guards all LLM calls.

**Gamification engine:** streak tracking with freeze auto-spend, XP economy, level curve, badge unlock rules, and weekly leaderboard aggregation — all server-side.

## 🚀 Getting Started

**Prerequisites:** Node.js ≥ 20, npm ≥ 10, Docker Desktop, Git

```powershell
# 1. Install dependencies (root + all workspaces)
npm install

# 2. Start Postgres + Redis
npm run db:up

# 3. Configure environment
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local

# 4. Run database migrations
npm --workspace backend run db:migrate

# 5. Start all three apps
npm run dev
```

| App | URL |
|---|---|
| Learner app | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Admin console | http://localhost:3001 |

## 📜 Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start frontend + backend + admin in parallel |
| `npm run dev:frontend` / `dev:backend` / `dev:admin` | Start a single app |
| `npm run build` | Production build (backend + frontend) |
| `npm run lint` | Lint all workspaces |
| `npm run test` | Run all test suites |
| `npm run type-check` | TypeScript check across all workspaces |
| `npm run db:up` / `db:down` / `db:logs` | Manage local Postgres + Redis containers |

## 📚 Documentation

- [`docs/architecture.md`](docs/architecture.md) — system architecture
- [`docs/api.md`](docs/api.md) — API reference
- [`docs/database.md`](docs/database.md) — database schema
- [`frontend/DESIGN.md`](frontend/DESIGN.md) — the **Signal** design system
- [`planning/`](planning/) — system design & engineering process docs

## 🧰 Tech Stack

**Frontend** — Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, GSAP + ScrollTrigger, Zustand, Spline (3D), Recharts
**Backend** — Express, TypeScript, Prisma, PostgreSQL + pgvector, Redis, Zod, JWT auth
**AI** — Google Gemini (chat, quiz gen + validation, embeddings), circuit-breaker-protected
**Infra** — Docker Compose (local), Supabase (Postgres hosting), GitHub Actions CI

## 📄 License

Academic / educational use.
