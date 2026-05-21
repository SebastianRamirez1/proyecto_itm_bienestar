import { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health/resources', {
    schema: { tags: ['health'], summary: 'List mental health resources' },
    handler: async (_req, reply) => reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming in Phase 2' } }),
  });

  app.get('/health/schedule', {
    schema: { tags: ['health'], summary: 'Psychology office hours' },
    handler: async (_req, reply) => reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming in Phase 2' } }),
  });

  app.get('/health/tips', {
    schema: { tags: ['health'], summary: 'Contextual tips based on academic calendar' },
    handler: async (_req, reply) => reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming in Phase 2' } }),
  });

  app.get('/health/emergency', {
    schema: { tags: ['health'], summary: 'Crisis hotlines and emergency contacts' },
    handler: async (_req, reply) => reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming in Phase 2' } }),
  });

  app.post('/health/appointment', {
    schema: { tags: ['health'], summary: 'Request psychology appointment', security: [{ bearerAuth: [] }] },
    handler: async (_req, reply) => reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming in Phase 2' } }),
  });
}
