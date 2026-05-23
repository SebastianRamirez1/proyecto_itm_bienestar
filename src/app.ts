import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from './config/env';
import { errorHandler } from './shared/errors/errorHandler';
import { redis } from './shared/cache/redis';

// Module routes
import { alertsRoutes } from './modules/alerts/alerts.routes';
import { cafeteriaRoutes } from './modules/cafeteria/cafeteria.routes';
import { healthRoutes } from './modules/health/health.routes';
import { libraryRoutes } from './modules/library/library.routes';
import { eventsRoutes } from './modules/events/events.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { webhooksRoutes } from './modules/webhooks/webhooks.routes';
import { metricsRoutes } from './modules/metrics/metrics.routes';
import { MetricsService } from './modules/metrics/metrics.service';

const metricsService = new MetricsService();

/** Extracts the module name from a request URL.
 *  /api/v1/alerts/123  →  "alerts"
 *  /api/v1/status      →  "status"
 *  /docs/...           →  "other"
 */
function extractModule(url: string): string {
  const match = url.match(/\/api\/v\d+\/([^/?]+)/);
  return match?.[1] ?? 'other';
}

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'test' ? 'silent' : 'info',
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
    ajv: {
      customOptions: {
        removeAdditional: false,
        coerceTypes: true,
        allErrors: true,
      },
    },
  });

  // Security
  await app.register(helmet, { contentSecurityPolicy: false });

  // In production, allow the official ITM domain, the Railway PUBLIC_URL,
  // the Vercel frontend, and localhost for local development.
  // In development, reflect all origins (origin: true) for convenience.
  const corsOrigins: string[] = [
    'https://itm.edu.co',
    'https://proyecto-itm-bienestar-frontend.vercel.app',
    'http://localhost:5173',
  ];
  if (env.PUBLIC_URL) corsOrigins.push(env.PUBLIC_URL);
  await app.register(cors, {
    origin: env.NODE_ENV === 'production' ? corsOrigins : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true,
  });

  // Rate limiting
  await app.register(rateLimit, {
    global: true,
    max: env.RATE_LIMIT_MAX_ANONYMOUS,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    redis,
    keyGenerator: (request) =>
      request.headers['x-forwarded-for'] as string ?? request.ip,
  });

  // OpenAPI / Swagger
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'ITM Bienestar API',
        description:
          'API centralizada de servicios de bienestar del Instituto Tecnológico Metropolitano. ' +
          'Provee acceso unificado a cafetería, biblioteca, eventos, alertas y recursos de salud mental.',
        version: '1.0.0',
        contact: {
          name: 'Sebastian Ramirez',
          url: 'https://github.com/SebastianRamirez1/proyecto_itm_bienestar',
        },
        license: { name: 'MIT' },
      },
      servers: [
        ...(env.PUBLIC_URL ? [{ url: env.PUBLIC_URL, description: 'Production' }] : []),
        { url: `http://localhost:${env.PORT}`, description: 'Development' },
      ],
      tags: [
        { name: 'status', description: 'Health check' },
        { name: 'auth', description: 'Authentication & authorization' },
        { name: 'alerts', description: 'Campus alerts' },
        { name: 'cafeteria', description: 'Cafeteria menu & schedule' },
        { name: 'health', description: 'Mental health resources' },
        { name: 'library', description: 'Library books & study rooms' },
        { name: 'events', description: 'Campus events' },
        { name: 'webhooks', description: 'Webhook subscriptions for critical alert notifications' },
        { name: 'metrics', description: 'API usage metrics: request counts, latency and uptime' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          apiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
    staticCSP: true,
  });

  // Global error handler
  app.setErrorHandler(errorHandler);

  // Metrics hook — records every request after the response is sent
  app.addHook('onResponse', async (request, reply) => {
    const module  = extractModule(request.url);
    const elapsed = Math.round(reply.elapsedTime);
    metricsService.record(module, elapsed).catch(() => {/* non-blocking */});
  });

  // Status endpoint
  app.get(
    '/api/v1/status',
    {
      schema: {
        tags: ['status'],
        summary: 'API health check',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              version: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      return reply.send({
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });
    },
  );

  const prefix = `/api/${env.API_VERSION}`;
  await app.register(authRoutes, { prefix });
  await app.register(alertsRoutes, { prefix });
  await app.register(cafeteriaRoutes, { prefix });
  await app.register(healthRoutes, { prefix });
  await app.register(libraryRoutes, { prefix });
  await app.register(eventsRoutes, { prefix });
  await app.register(webhooksRoutes, { prefix });
  await app.register(metricsRoutes, { prefix });

  return app;
}
