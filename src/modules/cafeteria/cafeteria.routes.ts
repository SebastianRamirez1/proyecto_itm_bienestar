import { FastifyInstance } from 'fastify';
import { cafeteriaController } from './cafeteria.controller';

export async function cafeteriaRoutes(app: FastifyInstance) {
  app.get('/cafeteria/menu', {
    schema: {
      tags: ['cafeteria'],
      summary: "Get today's menu (or by date). Returns X-Data-Freshness: stale if scraping failed.",
      querystring: {
        type: 'object',
        properties: { date: { type: 'string', description: 'YYYY-MM-DD format' } },
      },
    },
    handler: cafeteriaController.getMenu,
  });

  app.get('/cafeteria/schedule', {
    schema: {
      tags: ['cafeteria'],
      summary: 'Get cafeteria opening hours',
    },
    handler: cafeteriaController.getSchedule,
  });

  app.get('/cafeteria/prices', {
    schema: {
      tags: ['cafeteria'],
      summary: 'Get current price table',
    },
    handler: cafeteriaController.getPrices,
  });
}
