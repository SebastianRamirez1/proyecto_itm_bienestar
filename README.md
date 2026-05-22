# ITM Bienestar API

[![CI](https://github.com/SebastianRamirez1/proyecto_itm_bienestar/actions/workflows/ci.yml/badge.svg)](https://github.com/SebastianRamirez1/proyecto_itm_bienestar/actions/workflows/ci.yml)

**🚀 Live:** https://proyectoitmbienestar-production.up.railway.app  
**📖 Docs:** https://proyectoitmbienestar-production.up.railway.app/docs

API centralizada de servicios de bienestar del **Instituto Tecnológico Metropolitano (ITM)** — Medellín, Colombia.

Resuelve el problema de la información dispersa: menú de cafetería en WhatsApp, eventos en Instagram, psicología en otra página. Esta API es el punto de entrada único para todos los servicios de bienestar.

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

Todos los endpoints están documentados en Swagger UI en `/docs`.

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

# 4. Aplicar schema y seed de datos demo
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
| `npm run lint` | ESLint |
| `npm run db:seed` | Poblar BD con datos demo realistas |
| `npm run db:studio` | Abrir Prisma Studio |

---

## Autenticación

La API usa **JWT** con rotación de refresh tokens y soporte de **API Keys** con prefijo `itm_`.

```http
# Registro
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
```

Solo se permiten emails `@itm.edu.co` y `@correo.itm.edu.co`.

---

## Estructura del proyecto

```
src/
├── app.ts                   # Fastify factory
├── server.ts                # Entry point
├── config/                  # Env + DB config
├── shared/                  # Kernel compartido
│   ├── cache/               # Redis + getOrSet<T>()
│   ├── errors/              # AppError (400/401/403/404/409)
│   ├── jobs/                # Cron jobs (cafetería scraper)
│   ├── middleware/          # requireAuth · requireAdmin · optionalAuth
│   └── utils/               # JWT helpers, API key generator
└── modules/
    ├── alerts/
    ├── auth/
    ├── cafeteria/
    ├── events/
    ├── health/
    └── library/

tests/
├── alerts/
├── auth/
├── cafeteria/
├── events/
├── health/
├── library/
├── middleware/              # Unit tests para auth middleware
└── unit/                   # Unit tests puros (sin DB/Redis)
```

---

## Tests

```bash
# Correr todos los tests
npm test

# Con cobertura
npm run test:coverage
```

La suite tiene **54+ tests** de integración y unitarios. Los tests de integración usan una base de datos PostgreSQL dedicada (`bienestar_itm_test`) y un Redis aislado.

> Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para guía completa de contribución, convenciones de commits y workflow de Git.

---

## Autor

**Sebastian Ramirez** — ITM Medellín · 2026

---

*Proyecto de portafolio · Licencia MIT*
