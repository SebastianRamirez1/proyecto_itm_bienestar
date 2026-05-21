import { FastifyRequest, FastifyReply } from 'fastify';
import { EventsService } from './events.service';
import { EventsQuerySchema } from './events.schema';
import type { JwtPayload } from '../../shared/types';

const service = new EventsService();

export const eventsController = {
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const dto = EventsQuerySchema.parse(request.query);
    const result = await service.getEvents(dto);
    return reply.send({ success: true, ...result });
  },

  async getUpcoming(_request: FastifyRequest, reply: FastifyReply) {
    const events = await service.getUpcoming();
    return reply.send({ success: true, data: events });
  },

  async getById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const event = await service.getEventById(request.params.id);
    return reply.send({ success: true, data: event });
  },

  async register(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const user = (request as FastifyRequest & { user: JwtPayload }).user;
    const result = await service.registerToEvent(request.params.id, user.sub);
    return reply.status(201).send({ success: true, data: result });
  },
};
