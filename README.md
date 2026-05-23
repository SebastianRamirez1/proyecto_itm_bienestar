# ITM Bienestar API

[![CI](https://github.com/SebastianRamirez1/proyecto_itm_bienestar/actions/workflows/ci.yml/badge.svg)](https://github.com/SebastianRamirez1/proyecto_itm_bienestar/actions/workflows/ci.yml)

**🚀 Live:** https://proyectoitmbienestar-production.up.railway.app  
**📖 Docs:** https://proyectoitmbienestar-production.up.railway.app/docs

API centralizada de servicios de bienestar del **Instituto Tecnológico Metropolitano (ITM)** — Medellín, Colombia.

Resuelve el problema de la información dispersa: menú de cafetería en WhatsApp, eventos en Instagram, psicología en otra página. Esta API es el punto de entrada único para todos los servicios de bienestar estudiantil.

---

## Stack

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Fastify 5 + TypeScript 5 |
| Base de datos | PostgreSQL 16 + Prisma ORM |
| Cache | Redis 7 + ioredis |
| Validación | Zod |
| Tests | Vitest + cobertura V8 |
| CI/CD | GitHub Actions |
| Docs | OpenAPI 3.0 / Swagger UI |
| Deploy | Railway (Nixpacks) |

---

## Módulos

| Módulo | Endpoints principales | Estado |
|---|---|---|
| **Auth** | `POST /auth/register` · `/login` · `/refresh` · `/api-key` | ✅ Completo |
| **Alerts** | `GET /alerts` · `GET /alerts/:id` · `POST /alerts` · `PATCH /alerts/:id/deactivate` | ✅ Completo |
| **Cafetería** | `GET /cafeteria/menu` · `GET /cafeteria/today` · `GET /cafeteria/schedule` | ✅ Completo |
| **Salud Mental** | `GET /health/resources` · `/tips` · `/schedule` · `/emergency` · `POST /health/appointment` | ✅ Completo |
| **Biblioteca** | `GET /library/books` · `GET /library/books/:id` · `POST /library/rooms/reserve` | ✅ Completo |
| **Eventos** | `GET /events` · `GET /events/:id` · `POST /events/:id/register` · `DELETE /events/:id/register` | ✅ Completo |
| **Webhooks** | `POST /webhooks` · `GET /webhooks` · `DELETE /webhooks/:id` · `POST /webhooks/test` | ✅ Completo |
| **Métricas** | `GET /metrics` | ✅ Completo |

Todos los endpoints están documentados en Swagger UI en `/docs`.

---

## Highlights técnicos

### Autenticación dual
JWT con rotación de refresh tokens + API Keys con prefijo `itm_` hasheadas en BD. El middleware `requireAuth` acepta ambos esquemas de forma transparente.

### Cache por capas con TTL semántico
`getOrSet<T>(key, ttl, fn)` abstrae Redis: si la clave existe devuelve el valor cacheado, si no ejecuta `fn`, persiste y retorna. Cada módulo define su propio TTL (`CacheTTL.HEALTH`, `CacheTTL.EVENTS`, etc.). Las respuestas cacheadas llevan el header `X-Data-Freshness: stale` cuando la BD fue actualizada después del último cache.

### Scraping automático de eventos
`events.scraper.ts` parsea la [Agenda ITM](https://www.itm.edu.co/agenda-itm/) con Cheerio, extrae fechas en español (`"2-3 de abril"`, `"Todos los miércoles"` → ignorado) y las normaliza a `{ startDate, endDate }`. Un cron semanal (lunes 6am) llama `scrapeAndStore()` → upsert en BD → invalida cache.

### Métricas en Redis sin overhead
Un hook `onResponse` registra en background cada request: `INCR requests:total`, `INCR requests:<modulo>`, `INCRBYFLOAT latency:sum:<modulo>`, `INCR latency:count:<modulo>`. `GET /metrics` lee todo con un único pipeline de Redis y calcula `avgMs = sum / count` en memoria.

### Tips contextuales por período académico
`GET /health/tips` consulta `AcademicCalendar` para determinar el período actual (`normal`, `midterm`, `finals`, `registration`) y filtra recursos de salud mental por ese contexto. El calendario 2025-2026 está precargado en BD.

### Webhooks para alertas críticas
Los webhooks reciben un payload firmado con HMAC-SHA256 (`X-ITM-Signature`) cada vez que se crea una alerta de prioridad `critical`. Se reintenta hasta 3 veces con backoff antes de marcar el webhook como fallido.

---

## Desarrollo local

### Requisitos

- Node.js >= 20.12.0
- Docker + Docker Compose

### Setup

```bash
# 1. Clonar e instalar
git clone https://github.com/SebastianRamirez1/proyecto_itm_bienestar.git
cd proyecto_itm_bienestar
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env — mínimo: DATABASE_URL y REDIS_URL

# 3. Levantar base de datos y cache
docker compose up -d

# 4. Aplicar schema y seed con datos reales del ITM
npx prisma db push
npm run db:seed

# 5. Iniciar servidor en modo desarrollo
npm run dev
```

El servidor corre en `http://localhost:3000`.  
Swagger UI disponible en `http://localhost:3000/docs`.

### Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/bienestar` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret para firmar JWT (≥32 chars) | `my_super_secret_at_least_32_chars` |
| `JWT_ACCESS_EXPIRES_IN` | Duración del access token | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Duración del refresh token | `7d` |

---

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor con hot-reload (tsx watch) |
| `npm run build` | Compilar TypeScript a `dist/` |
| `npm test` | Ejecutar suite de tests |
| `npm run test:coverage` | Tests con reporte de cobertura |
| `npm run typecheck` | Verificar tipos sin compilar |
| `npm run db:seed` | Poblar BD con datos reales del ITM |
| `npm run db:studio` | Abrir Prisma Studio |

---

## Autenticación

La API usa **JWT** con rotación de refresh tokens y soporte de **API Keys** con prefijo `itm_`.

```http
# Registro (solo emails @itm.edu.co / @correo.itm.edu.co)
POST /api/v1/auth/register
{ "email": "usuario@itm.edu.co", "password": "Password123!" }

# Login
POST /api/v1/auth/login
{ "email": "usuario@itm.edu.co", "password": "Password123!" }

# Usar el access token
GET /api/v1/events
Authorization: Bearer <accessToken>

# Generar API Key
POST /api/v1/auth/api-key
Authorization: Bearer <accessToken>
{ "name": "WhatsApp bot" }

# Usar API Key directamente
GET /api/v1/cafeteria/menu
X-API-Key: itm_xxxxxxxxxxxx
```

---

## Estructura del proyecto

```
src/
├── app.ts                   # Fastify factory + hooks de métricas
├── server.ts                # Entry point
├── config/                  # Env + DB config
├── shared/                  # Kernel compartido
│   ├── cache/               # Redis + getOrSet<T>()
│   ├── errors/              # AppError (400/401/403/404/409)
│   ├── jobs/                # Cron jobs (scraper cafetería + scraper eventos)
│   ├── middleware/          # requireAuth · requireAdmin · optionalAuth
│   └── utils/               # JWT helpers, API key generator
└── modules/
    ├── alerts/
    ├── auth/
    ├── cafeteria/
    ├── events/
    ├── health/
    ├── library/
    ├── metrics/
    └── webhooks/

tests/
├── alerts/
├── auth/
├── cafeteria/
├── events/
├── health/
├── library/
├── metrics/
├── middleware/              # Unit tests para auth middleware
├── unit/                    # Unit tests puros (scraper, mappers)
└── webhooks/
```

---

## Tests

```bash
# Correr todos los tests
npm test

# Con cobertura
npm run test:coverage
```

La suite tiene **140+ tests** de integración y unitarios. Los tests de integración usan una base de datos PostgreSQL dedicada (`bienestar_itm_test`) y un Redis aislado.

> Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para guía completa de contribución, convenciones de commits y workflow de Git.

---

## Autor

**Sebastian Ramirez** — ITM Medellín · 2026

---

*Proyecto de portafolio · Licencia MIT*
