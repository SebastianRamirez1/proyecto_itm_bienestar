import { z } from 'zod';

export const BookSearchSchema = z.object({
  q: z.string().min(1, 'Search query required').max(100).optional(),
  category: z.string().optional(),
  available: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const ReserveRoomSchema = z.object({
  roomId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  { message: 'endTime must be after startTime', path: ['endTime'] },
).refine(
  (data) => {
    const durationMs = new Date(data.endTime).getTime() - new Date(data.startTime).getTime();
    return durationMs <= 4 * 60 * 60 * 1000;
  },
  { message: 'Reservation cannot exceed 4 hours', path: ['endTime'] },
);

export type BookSearchDto = z.infer<typeof BookSearchSchema>;
export type ReserveRoomDto = z.infer<typeof ReserveRoomSchema>;
