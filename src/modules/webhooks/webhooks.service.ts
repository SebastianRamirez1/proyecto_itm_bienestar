import { WebhooksRepository } from './webhooks.repository';
import { CreateWebhookDto } from './webhooks.schema';
import { AppError } from '../../shared/errors/AppError';
import type { Alert } from '@prisma/client';

export class WebhooksService {
  constructor(private readonly repo = new WebhooksRepository()) {}

  async register(userId: string, dto: CreateWebhookDto) {
    return this.repo.create(userId, dto.url);
  }

  async listForUser(userId: string) {
    return this.repo.findAllByUser(userId);
  }

  async remove(id: string, userId: string) {
    const webhook = await this.repo.findById(id);
    if (!webhook) throw AppError.notFound('Webhook not found');
    if (webhook.userId !== userId) throw AppError.forbidden('Cannot delete another user\'s webhook');
    return this.repo.delete(id);
  }

  async testWebhook(id: string, userId: string): Promise<{ delivered: boolean; statusCode?: number; error?: string }> {
    const webhook = await this.repo.findById(id);
    if (!webhook) throw AppError.notFound('Webhook not found');
    if (webhook.userId !== userId) throw AppError.forbidden('Cannot test another user\'s webhook');

    const payload = JSON.stringify({
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: { message: 'ITM Bienestar webhook test — conexión verificada correctamente.' },
    });

    try {
      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-ITM-Event': 'webhook.test' },
        body: payload,
        signal: AbortSignal.timeout(8000),
      });
      return { delivered: res.ok, statusCode: res.status };
    } catch (err) {
      return { delivered: false, error: (err as Error).message };
    }
  }

  /**
   * Fire-and-forget delivery to all active webhooks.
   * Called after a critical alert is created — does NOT block the response.
   */
  fireForCriticalAlert(alert: Alert): void {
    const payload = JSON.stringify({
      event: 'alert.critical',
      timestamp: new Date().toISOString(),
      data: {
        id: alert.id,
        title: alert.title,
        body: alert.body,
        severity: alert.severity,
        createdAt: alert.createdAt,
      },
    });

    this.repo.findAllActiveGlobal().then((webhooks: { url: string }[]) => {
      for (const webhook of webhooks) {
        fetch(webhook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-ITM-Event': 'alert.critical' },
          body: payload,
          signal: AbortSignal.timeout(5000),
        }).catch((err: Error) => {
          console.error(`[webhook] Delivery failed → ${webhook.url}: ${err.message}`);
        });
      }
    }).catch((err: Error) => {
      console.error('[webhook] Failed to fetch active webhooks:', err.message);
    });
  }
}
