import type { FastifyRequest, FastifyReply } from 'fastify';
import { MetricsService } from './metrics.service';

const metricsService = new MetricsService();

export async function getMetrics(_request: FastifyRequest, reply: FastifyReply) {
  const data = await metricsService.getMetrics();
  return reply.send({ data });
}
