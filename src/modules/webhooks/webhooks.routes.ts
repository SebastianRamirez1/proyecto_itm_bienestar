import { FastifyInstance } from 'fastify';
import { webhooksController } from './webhooks.controller';
import { requireAuth } from '../../shared/middleware/auth.middleware';

export async function webhooksRoutes(app: FastifyInstance) {
  app.post('/webhooks', {
    schema: {
      tags: ['webhooks'],
      summary: 'Register a webhook URL to receive critical alert notifications',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string', format: 'uri', description: 'HTTPS endpoint that will receive POST requests' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                url: { type: 'string' },
                active: { type: 'boolean' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    preHandler: requireAuth,
    handler: webhooksController.create,
  });

  app.get('/webhooks', {
    schema: {
      tags: ['webhooks'],
      summary: 'List your registered webhooks',
      security: [{ bearerAuth: [] }],
    },
    preHandler: requireAuth,
    handler: webhooksController.list,
  });

  app.post('/webhooks/:id/test', {
    schema: {
      tags: ['webhooks'],
      summary: 'Send a test payload to a webhook',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
    },
    preHandler: requireAuth,
    handler: webhooksController.test,
  });

  app.delete('/webhooks/:id', {
    schema: {
      tags: ['webhooks'],
      summary: 'Delete a webhook',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
    },
    preHandler: requireAuth,
    handler: webhooksController.remove,
  });
}
