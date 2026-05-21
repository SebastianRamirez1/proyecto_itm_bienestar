import { z } from 'zod';

export const EventCategoryEnum = z.enum([
  'cultural',
  'sport',
  'academic',
  'wellness',
  'workshop',
]);

export const EventsQuerySchema = z.object({
  category: EventCategoryEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type EventsQueryDto = z.infer<typeof EventsQuerySchema>;
