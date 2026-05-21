import { FastifyRequest, FastifyReply } from 'fastify';
import { AlertsService } from './alerts.service';
import { AlertQuerySchema, CreateAlertSchema } from './alerts.schema';
import { AlertSeverity } from '@prisma/client';

const service = new AlertsService();

export const alertsController = {
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const query = AlertQuerySchema.parse(request.query);
    const { alerts, stale } = await service.getActiveAlerts(
      query.severity as AlertSeverity | undefined,
    );
    if (stale) reply.header('X-Data-Freshness', 'stale');
    return reply.send({ success: true, data: alerts });
  },

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const alert = await service.getAlertById(request.params.id);
    return reply.send({ success: true, data: alert });
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const dto = CreateAlertSchema.parse(request.body);
    const alert = await service.createAlert(dto);
    return reply.status(201).send({ success: true, data: alert });
  },

  async deactivate(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const alert = await service.deactivateAlert(request.params.id);
    return reply.send({ success: true, data: alert });
  },
};
