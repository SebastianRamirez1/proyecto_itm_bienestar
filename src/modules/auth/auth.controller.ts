import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import {
  RegisterSchema,
  LoginSchema,
  RefreshSchema,
  CreateApiKeySchema,
} from './auth.schema';

const service = new AuthService();

export const authController = {
  async register(request: FastifyRequest, reply: FastifyReply) {
    const dto = RegisterSchema.parse(request.body);
    const result = await service.register(dto);
    return reply.status(201).send({ success: true, data: result });
  },

  async login(request: FastifyRequest, reply: FastifyReply) {
    const dto = LoginSchema.parse(request.body);
    const result = await service.login(dto);
    return reply.send({ success: true, data: result });
  },

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const dto = RefreshSchema.parse(request.body);
    const tokens = await service.refresh(dto);
    return reply.send({ success: true, data: tokens });
  },

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const dto = RefreshSchema.parse(request.body);
    await service.logout(dto.refreshToken);
    return reply.status(204).send();
  },

  async createApiKey(
    request: FastifyRequest & { user: { sub: string } },
    reply: FastifyReply,
  ) {
    const dto = CreateApiKeySchema.parse(request.body);
    const result = await service.createApiKey(request.user.sub, dto);
    return reply.status(201).send({ success: true, data: result });
  },
};
