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
    const { sub: userId, email } = request.user;
    const body = request.body as {
      preferredDate: string;
      reason: string;
      modality?: string;
    };

    const appointment = await service.requestAppointment(userId, email, body);

    return reply.status(202).send({
      success: true,
      data: {
        message: 'Solicitud recibida. El equipo de psicología se comunicará contigo en 24 horas hábiles.',
        appointmentId: appointment.id,
        status: appointment.status,
        preferredDate: appointment.preferredDate,
        modality: appointment.modality,
        submittedAt: appointment.createdAt,
      },
    });
  },
};
