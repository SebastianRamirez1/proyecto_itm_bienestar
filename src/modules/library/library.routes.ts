import { FastifyInstance } from 'fastify';

export async function libraryRoutes(app: FastifyInstance) {
  app.get('/library/books', {
    schema: {
      tags: ['library'],
      summary: 'Search books',
      querystring: { type: 'object', properties: { q: { type: 'string' } } },
    },
    handler: async (_req, reply) => reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming in Phase 2' } }),
  });

  app.get('/library/books/:id', {
    schema: { tags: ['library'], summary: 'Get book details' },
    handler: async (_req, reply) => reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming in Phase 2' } }),
  });

  app.get('/library/rooms', {
    schema: { tags: ['library'], summary: 'Study room availability' },
    handler: async (_req, reply) => reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming in Phase 2' } }),
  });

  app.get('/library/schedule', {
    schema: { tags: ['library'], summary: 'Library opening hours' },
    handler: async (_req, reply) => reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming in Phase 2' } }),
  });

  app.post('/library/rooms/reserve', {
    schema: { tags: ['library'], summary: 'Reserve a study room', security: [{ bearerAuth: [] }] },
    handler: async (_req, reply) => reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming in Phase 2' } }),
  });
}
