import { FastifyRequest, FastifyReply } from 'fastify';
import { LibraryService } from './library.service';
import { BookSearchSchema, ReserveRoomSchema } from './library.schema';
import type { JwtPayload } from '../../shared/types';

const service = new LibraryService();

export const libraryController = {
  async searchBooks(request: FastifyRequest, reply: FastifyReply) {
    const dto = BookSearchSchema.parse(request.query);
    const result = await service.searchBooks(dto);
    return reply.send({ success: true, ...result });
  },

  async getBookById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const book = await service.getBookById(request.params.id);
    return reply.send({ success: true, data: book });
  },

  async getRooms(_request: FastifyRequest, reply: FastifyReply) {
    const rooms = await service.getRooms();
    return reply.send({ success: true, data: rooms });
  },

  async getSchedule(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, data: service.getSchedule() });
  },

  async reserveRoom(request: FastifyRequest, reply: FastifyReply) {
    const dto = ReserveRoomSchema.parse(request.body);
    const user = (request as FastifyRequest & { user: JwtPayload }).user;
    const result = await service.reserveRoom(dto, user.sub);
    return reply.status(201).send({ success: true, data: result });
  },
};
