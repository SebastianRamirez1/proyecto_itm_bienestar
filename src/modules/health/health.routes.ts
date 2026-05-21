import { FastifyInstance } from 'fastify';
import { healthController } from './health.controller';
import { requireAuth } from '../../shared/middleware/auth.middleware';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health/resources', {
    schema: {
      tags: ['health'],
      summary: 'List all active mental health resources',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' },
          },
        },
      },
    },
    handler: healthController.getResources,
  });

  app.get('/health/tips', {
    schema: {
      tags: ['health'],
      summary: 'Contextual tips based on the current academic calendar period',
      description:
        'Returns resources relevant to the current moment: midterm tips during parciales, finals tips during finales, etc.',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                currentPeriod: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                  },
                },
                contextType: { type: 'string' },
                resources: { type: 'array' },
              },
            },
          },
        },
      },
    },
    handler: healthController.getTips,
  });

  app.get('/health/schedule', {
    schema: {
      tags: ['health'],
      summary: 'Psychology office hours and contact info',
    },
    handler: healthController.getSchedule,
  });

  app.get('/health/emergency', {
    schema: {
      tags: ['health'],
      summary: 'Crisis hotlines and emergency contacts — always available',
    },
    handler: healthController.getEmergency,
  });

  app.post('/health/appointment', {
    schema: {
      tags: ['health'],
      summary: 'Request a psychology appointment (requires auth)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['preferredDate', 'reason'],
        properties: {
          preferredDate: { type: 'string', format: 'date-time' },
          reason: { type: 'string', minLength: 10, maxLength: 500 },
          modality: { type: 'string', enum: ['presencial', 'virtual'] },
        },
      },
    },
    preHandler: requireAuth,
    handler: healthController.requestAppointment,
  });
}
