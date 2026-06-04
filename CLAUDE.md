# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

```bash
# Local dev (requires Docker services running)
docker compose up -d          # start Postgres + Redis
npm run dev                   # tsx watch — hot reload

# Quality checks (run before opening a PR)
npm run typecheck             # tsc --noEmit
npm run lint                  # eslint . (real linter — not an alias for typecheck)

# Tests — require Postgres + Redis to be reachable
npm test                      # all tests, no coverage
npm test -- --coverage        # with coverage (enforces thresholds)
npm test -- tests/auth/auth.test.ts          # single file
npm test -- --reporter=verbose               # verbose per-test output

# Database
npm run db:generate           # after editing schema.prisma
npm run db:migrate            # creates a new migration (dev only)
npm run db:migrate:prod       # deploys existing migrations (Railway)
npm run db:seed               # seed static data (books, contacts, tips)
npm run db:studio             # Prisma Studio GUI
```

**Node requirement:** `>=20.19.0` — rolldown (vitest 4.x internal) requires this exact minimum. Tests will fail silently on earlier versions. Run `nvm use` to pick up `.nvmrc`.

**Env file:** copy `.env.example` → `.env`. All variables are validated at startup via Zod; the process exits immediately if any required variable is missing.

---

## Architecture

### Request lifecycle

```
HTTP → Fastify route (routes.ts)
         ↓  Fastify schema validation (JSON Schema inline)
         ↓  preHandler: requireAuth / requireAdmin (auth.middleware.ts)
         → controller.ts   (parse request, call service, send reply)
         → service.ts      (business logic, orchestrates repo + cache)
         → repository.ts   (Prisma queries only — no logic)
```

Every module (`alerts`, `auth`, `cafeteria`, `events`, `health`, `library`, `metrics`, `webhooks`) owns exactly these five files: `controller`, `service`, `repository`, `routes`, `schema`. Modules **never import another module's repository** — cross-module data access goes through the other module's service.

### Validation in two layers

1. **Fastify JSON Schema** (inline in `routes.ts`) — runs before the handler reaches TypeScript; rejects malformed requests with a 400 before any TS code runs.
2. **Zod** (in `schema.ts`) — provides typed DTOs consumed by the service. Use `CreateAlertSchema.parse(request.body)` inside the controller.

### Error handling

Throw `AppError` static helpers anywhere in service/repository code:

```typescript
throw AppError.notFound('Event not found');   // 404 NOT_FOUND
throw AppError.forbidden('Admin only');        // 403 FORBIDDEN
throw AppError.conflict('Email already used'); // 409 CONFLICT
```

The global `errorHandler` (registered in `app.ts`) converts `AppError` instances to the `ApiResponse` shape. Anything else becomes a 500. **Never** send raw error messages to the client.

### Redis caching

Use the `getOrSet` helper from `src/shared/cache/redis.ts`:

```typescript
return getOrSet(
  `cafeteria:menu:${dateStr}`,
  CacheTTL.CAFETERIA,          // pre-defined TTL constants
  () => this.repo.findByDate(dateStr),
);
```

`getOrSet` returns `{ data, stale: boolean }`. The `stale` flag is used by the cafeteria cron retry job.

### Auth middleware

Three preHandlers available from `src/shared/middleware/auth.middleware.ts`:

- `requireAuth` — validates Bearer JWT, attaches `request.user: JwtPayload`
- `requireAdmin` — calls `requireAuth` then checks `role === 'admin'`
- `optionalAuth` — parses token if present, continues without one

### Background jobs

`src/shared/jobs/scraping.job.ts` runs two cron jobs started in `src/server.ts`:
- Cafetería menu: weekdays 07:30, retry at 11:00 if stale
- Events (Agenda ITM): every Monday 06:00

### Metrics

Every response triggers `metricsService.record(module, elapsedMs)` via Fastify's `onResponse` hook. Counters and latency sums are stored in Redis with `pipeline.exec()` (single round-trip). The `/api/v1/metrics` endpoint (admin only) reads them back in one pipeline.

---

## Test patterns

Tests use `app.inject()` (Fastify's built-in HTTP simulation — no real network). Tests **do not** use supertest.

```typescript
// Minimal integration test structure
let app: FastifyInstance;
beforeAll(async () => { app = await buildApp(); await app.ready(); });
afterAll(async () => { await app.close(); });
beforeEach(async () => {
  // Clean ONLY this module's tables + always flush Redis
  await prisma.myModel.deleteMany();
  await redis.flushdb();
});
```

**Isolation rule (critical):** `fileParallelism: false` means files run sequentially, but `beforeEach` must still only delete the tables the current file owns. Never `prisma.user.deleteMany()` in a non-auth test file — it causes FK violations when tests run close together.

**Unique users in tests:** `email: \`test.${Date.now()}@itm.edu.co\``

---

## Git workflow

Branch protection is active on both `main` and `develop`. Direct pushes are rejected.

```
feature/* or fix/*  →  PR → develop  →  CI must pass  →  merge (squash)
                                                 ↓
                                    develop → main  (sync PR)
```

After a squash-merge cycle, `develop` and `main` diverge (different commit hashes, same content). Fix with a `sync/main-into-develop` PR rather than a force-push.

Commit format: `feat(module):`, `fix(module):`, `chore:`, `test(module):`, `refactor(module):`

---

## CI

`.github/workflows/ci.yml` — two jobs, `lint-and-typecheck` then `Tests` (requires Postgres 16 + Redis 7 services). Node version is pinned via `node-version-file: '.nvmrc'`. Coverage thresholds are enforced by vitest — CI fails if any metric drops below the floor defined in `vitest.config.ts`.

Dependabot runs weekly npm updates targeting `develop`.
