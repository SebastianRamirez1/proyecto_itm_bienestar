import { FastifyInstance } from 'fastify';
import { authController } from './auth.controller';
import { requireAuth } from '../../shared/middleware/auth.middleware';

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', {
    schema: {
      tags: ['auth'],
      summary: 'Register with institutional email (@itm.edu.co)',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', description: 'Must be @itm.edu.co' },
          password: { type: 'string', minLength: 8 },
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
                user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                },
              },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: authController.register,
  });

  app.post('/auth/login', {
    schema: {
      tags: ['auth'],
      summary: 'Login — returns access (15m) + refresh (7d) tokens',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
    },
    handler: authController.login,
  });

  app.post('/auth/refresh', {
    schema: {
      tags: ['auth'],
      summary: 'Exchange refresh token for a new access token',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: { refreshToken: { type: 'string' } },
      },
    },
    handler: authController.refresh,
  });

  app.post('/auth/logout', {
    schema: {
      tags: ['auth'],
      summary: 'Revoke refresh token',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: { refreshToken: { type: 'string' } },
      },
    },
    handler: authController.logout,
  });

  app.post('/auth/api-key', {
    schema: {
      tags: ['auth'],
      summary: 'Generate API key for external integrations',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', description: 'Descriptive name for the key (e.g. "WhatsApp bot")' },
          expiresAt: { type: 'string', format: 'date-time' },
        },
      },
    },
    preHandler: requireAuth,
    handler: authController.createApiKey as never,
  });
}
