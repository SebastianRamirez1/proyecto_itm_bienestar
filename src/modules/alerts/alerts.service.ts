import { AlertSeverity } from '@prisma/client';
import { AlertsRepository } from './alerts.repository';
import { CreateAlertDto } from './alerts.schema';
import { getOrSet, CacheTTL, redis } from '../../shared/cache/redis';
import { AppError } from '../../shared/errors/AppError';
import { WebhooksService } from '../webhooks/webhooks.service';

const webhooksService = new WebhooksService();

const CACHE_KEY = 'alerts:active';

export class AlertsService {
  constructor(private readonly repo = new AlertsRepository()) {}

  async getActiveAlerts(severity?: AlertSeverity) {
    const cacheKey = severity ? `${CACHE_KEY}:${severity}` : CACHE_KEY;
    const { data, stale } = await getOrSet(cacheKey, CacheTTL.ALERTS, () =>
      this.repo.findAllActive(severity),
    );
    return { alerts: data, stale };
  }

  async getAlertById(id: string) {
    const alert = await this.repo.findById(id);
    if (!alert) throw AppError.notFound(`Alert ${id} not found`);
    return alert;
  }

  async createAlert(dto: CreateAlertDto) {
    const alert = await this.repo.create(dto);
    await redis.del(CACHE_KEY);
    await redis.del(`${CACHE_KEY}:${alert.severity}`);
    if (alert.severity === 'critical') webhooksService.fireForCriticalAlert(alert);
    return alert;
  }

  async deactivateAlert(id: string) {
    await this.getAlertById(id);
    const alert = await this.repo.deactivate(id);
    await redis.del(CACHE_KEY);
    await redis.del(`${CACHE_KEY}:${alert.severity}`);
    return alert;
  }
}
