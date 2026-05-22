import { prisma } from '../../config/database';

export class WebhooksRepository {
  findAllActiveGlobal() {
    return prisma.webhook.findMany({ where: { active: true } });
  }

  findAllByUser(userId: string) {
    return prisma.webhook.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  findById(id: string) {
    return prisma.webhook.findUnique({ where: { id } });
  }

  create(userId: string, url: string) {
    return prisma.webhook.create({ data: { userId, url } });
  }

  delete(id: string) {
    return prisma.webhook.delete({ where: { id } });
  }
}
