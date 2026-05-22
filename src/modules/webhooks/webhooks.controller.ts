import { FastifyRequest, FastifyReply } from 'fastify';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookSchema } from './webhooks.schema';

const service = new WebhooksService();

export const webhooksController = {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const dto = CreateWebhookSchema.parse(request.body);
    const webhook = await service.register(request.user.sub, dto);
    return reply.status(201).send({ success: true, data: webhook });
  },

  async list(request: FastifyRequest, reply: FastifyReply) {
    const webhooks = await service.listForUser(request.user.sub);
    return reply.send({ success: true, data: webhooks });
  },

  async remove(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await service.remove(request.params.id, request.user.sub);
    return reply.status(204).send();
  },
};
