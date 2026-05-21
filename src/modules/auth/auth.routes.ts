import { FastifyInstance } from 'fastify';

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', {
    schema: {
      tags: ['auth'],
      summary: 'Register with institutional email (@itm.edu.co)',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
    },
    handler: async (_req, reply) => reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming in Phase 1' } }),
  });

  app.post('/auth/login', {
    schema: {
      tags: ['auth'],
      summary: 'Login and receive JWT tokens',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string' },
        },
      },
    },
    handler: async (_req, reply) => reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming in Phase 1' } }),
  });

  app.post('/auth/refresh', {
    schema: { tags: ['auth'], summary: 'Refresh access token' },
    handler: async (_req, reply) => reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming in Phase 1' } }),
  });

  app.post('/auth/logout', {
    schema: { tags: ['auth'], summary: 'Invalidate refresh token', security: [{ bearerAuth: [] }] },
    handler: async (_req, reply) => reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming in Phase 1' } }),
  });
}
