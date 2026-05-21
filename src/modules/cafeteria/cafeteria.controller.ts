import { FastifyRequest, FastifyReply } from 'fastify';
import { CafeteriaService } from './cafeteria.service';
import { MenuDateQuerySchema } from './cafeteria.schema';

const service = new CafeteriaService();

export const cafeteriaController = {
  async getMenu(request: FastifyRequest, reply: FastifyReply) {
    const query = MenuDateQuerySchema.parse(request.query);
    const { menu, stale } = await service.getMenu(query.date);
    if (stale) reply.header('X-Data-Freshness', 'stale');
    return reply.send({ success: true, data: menu });
  },

  async getSchedule(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, data: service.getSchedule() });
  },

  async getPrices(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, data: service.getPrices() });
  },
};
