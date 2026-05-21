import { FastifyInstance } from 'fastify';
import { alertsController } from './alerts.controller';

export async function alertsRoutes(app: FastifyInstance) {
  app.get('/alerts', {
    schema: {
      tags: ['alerts'],
      summary: 'Get all active campus alerts',
      querystring: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['info', 'warning', 'critical'] },
        },
      },
    },
    handler: alertsController.getAll,
  });

  app.get('/alerts/:id', {
    schema: {
      tags: ['alerts'],
      summary: 'Get alert by ID',
      params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    },
    handler: alertsController.getById,
  });

  app.post('/alerts', {
    schema: {
      tags: ['alerts'],
      summary: 'Create a new alert (admin only)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['title', 'body', 'severity'],
        properties: {
          title: { type: 'string' },
          body: { type: 'string' },
          severity: { type: 'string', enum: ['info', 'warning', 'critical'] },
          expiresAt: { type: 'string', format: 'date-time' },
        },
      },
    },
    handler: alertsController.create,
  });

  app.patch('/alerts/:id/deactivate', {
    schema: {
      tags: ['alerts'],
      summary: 'Deactivate an alert (admin only)',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    },
    handler: alertsController.deactivate,
  });
}
