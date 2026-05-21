import { FastifyInstance } from 'fastify';

export async function cafeteriaRoutes(app: FastifyInstance) {
  app.get('/cafeteria/menu', {
    schema: {
      tags: ['cafeteria'],
      summary: "Get today's menu or menu by date",
      querystring: {
        type: 'object',
        properties: { date: { type: 'string', format: 'date' } },
      },
    },
    handler: async (_req, reply) => reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming in Phase 1' } }),
  });

  app.get('/cafeteria/schedule', {
    schema: { tags: ['cafeteria'], summary: 'Get cafeteria opening hours' },
    handler: async (_req, reply) => reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming in Phase 1' } }),
  });

  app.get('/cafeteria/prices', {
    schema: { tags: ['cafeteria'], summary: 'Get price table' },
    handler: async (_req, reply) => reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming in Phase 1' } }),
  });
}
