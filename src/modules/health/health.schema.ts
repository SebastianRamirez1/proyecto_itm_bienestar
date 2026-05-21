import { z } from 'zod';

export const HealthContextTypeEnum = z.enum([
  'normal',
  'midterm',
  'finals',
  'registration',
  'start_of_semester',
]);

export const HealthResourceTypeEnum = z.enum([
  'hotline',
  'guide',
  'service',
  'exercise',
  'video',
]);

export const CreateAppointmentSchema = z.object({
  preferredDate: z.string().datetime(),
  reason: z.string().min(10).max(500),
  modality: z.enum(['presencial', 'virtual']).default('presencial'),
});

export type CreateAppointmentDto = z.infer<typeof CreateAppointmentSchema>;
