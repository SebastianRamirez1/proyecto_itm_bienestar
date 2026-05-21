import { FastifyInstance } from 'fastify';
import { eventsController } from './events.controller';
import { requireAuth } from '../../shared/middleware/auth.middleware';

export async function eventsRoutes(app: FastifyInstance) {
  app.get('/events', {
    schema: {
      tags: ['events'],
      summary: 'List all active events (paginated)',
      querystring: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['cultural', 'sport', 'academic', 'wellness', 'workshop'],
          },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
      },
    },
    handler: eventsController.getAll,
  });

  app.get('/events/upcoming', {
    schema: {
      tags: ['events'],
      summary: 'Events in the next 7 days (cached 12h)',
    },
    handler: eventsController.getUpcoming,
  });

  app.get('/events/:id', {
    schema: {
      tags: ['events'],
      summary: 'Get event details by ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
      },
    },
    handler: eventsController.getById,
  });

  app.post('/events/:id/register', {
    schema: {
      tags: ['events'],
      summary: 'Register for an event (requires auth)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
      },
    },
    preHandler: requireAuth,
    handler: eventsController.register,
  });
}
