import { FastifyRequest, FastifyReply } from 'fastify';
import { HealthService } from './health.service';

const service = new HealthService();

export const healthController = {
  async getResources(_request: FastifyRequest, reply: FastifyReply) {
    const { data: resources, stale } = await service.getResources();
    if (stale) reply.header('X-Data-Freshness', 'stale');
    return reply.send({ success: true, data: resources });
  },

  async getTips(_request: FastifyRequest, reply: FastifyReply) {
    const result = await service.getTips();
    return reply.send({ success: true, data: result });
  },

  async getSchedule(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, data: service.getSchedule() });
  },

  async getEmergency(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, data: service.getEmergencyContacts() });
  },

  async requestAppointment(request: FastifyRequest, reply: FastifyReply) {
    // Appointment logic will be expanded in Phase 3 with email/notification
    return reply.status(202).send({
      success: true,
      data: {
        message: 'Solicitud recibida. El equipo de psicología se comunicará contigo en 24 horas hábiles.',
        submittedAt: new Date().toISOString(),
        user: (request as never as { user: { email: string } }).user?.email,
      },
    });
  },
};
