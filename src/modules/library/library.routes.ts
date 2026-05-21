import { FastifyInstance } from 'fastify';
import { libraryController } from './library.controller';
import { requireAuth } from '../../shared/middleware/auth.middleware';

export async function libraryRoutes(app: FastifyInstance) {
  app.get('/library/books', {
    schema: {
      tags: ['library'],
      summary: 'Search books by title, author or ISBN',
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string', description: 'Search query (title, author or ISBN)' },
          category: { type: 'string' },
          available: { type: 'string', enum: ['true', 'false'], description: 'Filter by availability' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
        },
      },
    },
    handler: libraryController.searchBooks,
  });

  app.get('/library/books/:id', {
    schema: {
      tags: ['library'],
      summary: 'Get book details by ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
      },
    },
    handler: libraryController.getBookById,
  });

  app.get('/library/rooms', {
    schema: {
      tags: ['library'],
      summary: 'Get study room availability',
    },
    handler: libraryController.getRooms,
  });

  app.get('/library/schedule', {
    schema: {
      tags: ['library'],
      summary: 'Get library opening hours',
    },
    handler: libraryController.getSchedule,
  });

  app.post('/library/rooms/reserve', {
    schema: {
      tags: ['library'],
      summary: 'Reserve a study room (requires auth)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['roomId', 'startTime', 'endTime'],
        properties: {
          roomId: { type: 'string', format: 'uuid' },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time', description: 'Max 4 hours after startTime' },
        },
      },
    },
    preHandler: requireAuth,
    handler: libraryController.reserveRoom,
  });
}
