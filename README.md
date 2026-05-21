# ITM Bienestar API

API centralizada de servicios de bienestar del Instituto Tecnológico Metropolitano (ITM) — Medellín.

Resuelve el problema de la información dispersa: menú de cafetería en WhatsApp, eventos en Instagram, psicología en otra página. Esta API es el punto de entrada único.

## Stack

- **Runtime:** Node.js 20 LTS
- **Framework:** Fastify 5 + TypeScript
- **Base de datos:** PostgreSQL 16 + Prisma ORM
- **Cache:** Redis 7
- **Documentación:** OpenAPI 3.0 / Swagger UI

## Módulos

| Módulo | Endpoints | Estado |
|---|---|---|
| Alerts | `GET /api/v1/alerts` | ✅ Fase 1 |
| Auth | `POST /api/v1/auth/*` | 🔄 Fase 1 |
| Cafetería | `GET /api/v1/cafeteria/*` | 🔄 Fase 1 |
| Health | `GET /api/v1/health/*` | 📋 Fase 2 |
| Library | `GET /api/v1/library/*` | 📋 Fase 2 |
| Events | `GET /api/v1/events/*` | 📋 Fase 2 |

## Desarrollo local

### Requisitos

- Node.js >= 20.0.0
- Docker + Docker Compose

### Setup

```bash
# 1. Clonar e instalar
git clone https://github.com/SebastianRamirez1/proyecto_itm_bienestar.git
cd proyecto_itm_bienestar
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Levantar base de datos y cache
docker compose up -d

# 4. Migraciones y seed
npm run db:migrate
npm run db:seed

# 5. Iniciar servidor en modo desarrollo
npm run dev
```

El servidor corre en `http://localhost:3000`.
Swagger UI disponible en `http://localhost:3000/docs`.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor con hot-reload |
| `npm run build` | Compilar a `dist/` |
| `npm test` | Ejecutar tests |
| `npm run test:coverage` | Tests con reporte de cobertura |
| `npm run db:migrate` | Aplicar migraciones |
| `npm run db:seed` | Poblar BD con datos de ejemplo |
| `npm run db:studio` | Abrir Prisma Studio |

## Estructura del proyecto

```
src/
├── config/          # Variables de entorno y base de datos
├── shared/          # Kernel compartido (cache, errores, tipos)
└── modules/
    ├── alerts/      # Alertas del campus
    ├── auth/        # Autenticación JWT + API Keys
    ├── cafeteria/   # Menú y horarios de cafetería
    ├── health/      # Recursos de salud mental
    ├── library/     # Biblioteca y salas de estudio
    └── events/      # Eventos del campus
```

## Autor

**Sebastian Ramirez** — ITM Medellín · 2026

---

*Proyecto de portafolio · Licencia MIT*
