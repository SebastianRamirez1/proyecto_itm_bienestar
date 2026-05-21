# Contributing to ITM Bienestar API

Thank you for your interest in contributing! This document describes the workflow, conventions, and quality standards we follow.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local setup](#local-setup)
3. [Branch model](#branch-model)
4. [Commit conventions](#commit-conventions)
5. [Pull request checklist](#pull-request-checklist)
6. [Running tests](#running-tests)
7. [Code style](#code-style)
8. [Project structure](#project-structure)

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | `>= 20.12.0` |
| npm | `>= 10` |
| Docker + Docker Compose | any recent version |
| Git | any recent version |

---

## Local setup

```bash
# 1. Clone and install dependencies
git clone https://github.com/SebastianRamirez1/proyecto_itm_bienestar.git
cd proyecto_itm_bienestar
npm install

# 2. Copy and fill environment variables
cp .env.example .env
# Edit .env — the only required changes are DATABASE_URL and REDIS_URL for local dev

# 3. Start PostgreSQL and Redis
docker compose up -d

# 4. Apply the schema and seed demo data
npx prisma db push
npm run db:seed

# 5. Start the development server (hot-reload)
npm run dev
# → http://localhost:3000
# → Swagger UI: http://localhost:3000/docs
```

---

## Branch model

We follow a **GitHub Flow** variant with two protected long-lived branches:

```
main          ← production-ready, only merged via PR from develop
develop       ← integration branch, only merged via PR from feature/*
feature/*     ← one branch per feature / fix
```

### Step-by-step

```bash
# 1. Always branch from develop (never from main)
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# 2. Commit early and often (see conventions below)
git add src/...
git commit -m "feat(module): add X"

# 3. Keep your branch up to date via rebase (not merge)
git fetch origin
git rebase origin/develop

# 4. Push and open a PR targeting develop
git push -u origin feature/my-feature
# → open PR: feature/my-feature → develop
```

> **Never commit directly to `main` or `develop`.** Both branches have Ruleset protection requiring CI to pass before any PR can be merged.

### Merging order

PRs merge in this order once CI is green:

```
feature/* → develop  (squash or merge commit, your choice)
develop   → main     (merge commit — preserves history)
```

---

## Commit conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <imperative summary, ≤72 chars>

[optional body]

[optional footer: Co-Authored-By, Closes #issue, BREAKING CHANGE]
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature or endpoint |
| `fix` | Bug fix |
| `test` | Adding or fixing tests |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `docs` | Documentation only |
| `chore` | Build process, dependencies, CI config |
| `ci` | CI/CD workflow changes |

### Scopes (match module folder names)

`auth` · `alerts` · `cafeteria` · `health` · `library` · `events` · `shared` · `config` · `ci`

### Examples

```
feat(library): add room reservation conflict detection
fix(auth): prevent refresh token reuse across concurrent requests
test(middleware): add unit tests for requireAdmin and optionalAuth
docs: update README with Phase 2 endpoint table
ci: align job display names with Ruleset required checks
```

---

## Pull request checklist

Before marking your PR as ready for review, verify:

- [ ] Branch is based on latest `develop` (run `git rebase origin/develop` if needed)
- [ ] `npm run typecheck` exits with code 0
- [ ] `npm run lint` exits with code 0 (no errors, warnings are tolerated)
- [ ] `npm test` passes all tests
- [ ] New features have corresponding tests
- [ ] Response schemas declare all serialized properties explicitly (fast-json-stringify only serializes declared fields — `{ type: 'object' }` without `properties` emits `{}`)
- [ ] No `console.log` left in production code (use `app.log.*` or structured logging)
- [ ] PR title follows Conventional Commits format
- [ ] PR description explains *why*, not just *what*

---

## Running tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run a single file
npx vitest run tests/alerts/alerts.test.ts
```

### Test infrastructure notes

- Tests require a running **PostgreSQL** instance (via `DATABASE_URL`) and **Redis** (via `REDIS_URL`).
- The easiest way: `docker compose up -d` before running tests.
- Test files run **sequentially** (`fileParallelism: false`) to prevent cross-file DB race conditions.
- Each test file calls `deleteMany()` in `beforeEach` to reset only the tables it owns — **never** call `prisma.user.deleteMany()` without a filter, as it cascades and breaks other in-flight tests.
- Call `await redis.flushdb()` in `beforeEach` whenever your module uses the cache.

---

## Code style

ESLint + Prettier are configured. They run automatically in CI.

```bash
npm run lint        # check only
npm run lint:fix    # auto-fix
npm run format      # prettier write
```

Key rules in use:

- TypeScript strict mode (`strict: true`)
- No `any` without explicit cast + comment
- No unused variables
- Async functions must be awaited or explicitly `.catch()`-ed
- Zod for all input validation — never trust `request.body` directly

---

## Project structure

```
src/
├── app.ts                  # Fastify factory — registers plugins + routes
├── server.ts               # Entry point — calls buildApp() then listen()
├── config/
│   ├── database.ts         # PrismaClient singleton
│   └── env.ts              # Zod-validated environment schema
└── shared/
│   ├── cache/redis.ts      # ioredis client + getOrSet<T>() helper
│   ├── errors/AppError.ts  # Typed HTTP errors (400/401/403/404/409/500)
│   ├── jobs/               # Background cron jobs (not loaded in test env)
│   ├── middleware/         # Auth middleware (requireAuth, requireAdmin…)
│   ├── types/index.ts      # Shared TypeScript interfaces
│   └── utils/tokens.ts     # JWT sign / verify / API key generation
└── modules/
    ├── alerts/             # Campus-wide alerts (CRUD + Redis cache)
    ├── auth/               # Registration, login, refresh, API keys
    ├── cafeteria/          # Menu scraping + schedule
    ├── events/             # Campus events + registration
    ├── health/             # Mental health resources + appointments
    └── library/            # Book catalogue + room reservations
```

Each module follows the same internal structure:

```
<module>/
├── <module>.routes.ts      # Fastify route definitions + JSON schema
├── <module>.controller.ts  # Request parsing → service call → reply
├── <module>.service.ts     # Business logic + error throwing
├── <module>.repository.ts  # Prisma queries (data access layer)
└── <module>.schema.ts      # Zod schemas (input DTOs)
```

---

## Questions?

Open an issue or reach out to **Sebastian Ramirez** via GitHub.
