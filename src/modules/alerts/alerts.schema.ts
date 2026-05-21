import { z } from 'zod';

export const AlertSeverityEnum = z.enum(['info', 'warning', 'critical']);

export const CreateAlertSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  severity: AlertSeverityEnum,
  expiresAt: z.string().datetime().optional(),
});

export const AlertQuerySchema = z.object({
  severity: AlertSeverityEnum.optional(),
});

export type CreateAlertDto = z.infer<typeof CreateAlertSchema>;
export type AlertQueryDto = z.infer<typeof AlertQuerySchema>;
