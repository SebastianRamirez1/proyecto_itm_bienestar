import { Alert, AlertSeverity } from '@prisma/client';
import { prisma } from '../../config/database';
import { CreateAlertDto } from './alerts.schema';

export class AlertsRepository {
  async findAllActive(severity?: AlertSeverity): Promise<Alert[]> {
    return prisma.alert.findMany({
      where: {
        active: true,
        ...(severity && { severity }),
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findById(id: string): Promise<Alert | null> {
    return prisma.alert.findUnique({ where: { id } });
  }

  async create(data: CreateAlertDto): Promise<Alert> {
    return prisma.alert.create({
      data: {
        title: data.title,
        body: data.body,
        severity: data.severity,
        ...(data.expiresAt && { expiresAt: new Date(data.expiresAt) }),
      },
    });
  }

  async deactivate(id: string): Promise<Alert> {
    return prisma.alert.update({ where: { id }, data: { active: false } });
  }
}
