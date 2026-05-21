import { FastifyInstance } from 'fastify';

export async function eventsRoutes(app: FastifyInstance) {
  app.get('/events', {
    schema: {
      tags: ['events'],
      summary: 'List events (paginated)',
      querystring: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['cultural', 'sport', 'academic', 'wellness', 'workshop'] },
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
        },
      },
    },
    handler: async (_req, reply) => reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming in Phase 2' } }),
  });

  app.get('/events/upcoming', {
    schema: { tags: ['events'], summary: 'Events in the next 7 days' },
    handler: async (_req, reply) => reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming in Phase 2' } }),
  });

  app.get('/events/:id', {
    schema: { tags: ['events'], summary: 'Get event details' },
    handler: async (_req, reply) => reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming in Phase 2' } }),
  });

  app.post('/events/:id/register', {
    schema: { tags: ['events'], summary: 'Register for an event', security: [{ bearerAuth: [] }] },
    handler: async (_req, reply) => reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming in Phase 2' } }),
  });
}
