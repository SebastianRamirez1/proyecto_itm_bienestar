import type { FastifyInstance } from 'fastify';
import { getMetrics } from './metrics.controller';

export async function metricsRoutes(app: FastifyInstance) {
  app.get(
    '/metrics',
    {
      schema: {
        tags: ['metrics'],
        summary: 'API usage metrics',
        description:
          'Returns request counts per module, average response latency and server uptime. ' +
          'Counters are stored in Redis and persist across server restarts.',
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  uptime: {
                    type: 'object',
                    properties: {
                      seconds: { type: 'number' },
                      human:   { type: 'string' },
                    },
                  },
                  requests: {
                    type: 'object',
                    properties: {
                      total: { type: 'number' },
                      byModule: {
                        type: 'object',
                        additionalProperties: { type: 'number' },
                      },
                    },
                  },
                  latency: {
                    type: 'object',
                    properties: {
                      avgMs: {
                        type: 'object',
                        additionalProperties: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    getMetrics,
  );
}
