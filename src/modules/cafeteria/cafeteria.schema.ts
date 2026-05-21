import { z } from 'zod';

export const MenuDateQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    .optional(),
});

export const MenuItemSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  category: z.enum(['entrada', 'plato_principal', 'bebida', 'postre', 'otro']),
});

export const MenuSchema = z.object({
  date: z.string(),
  items: z.array(MenuItemSchema),
  prices: z.record(z.string(), z.number()),
  scrapedAt: z.string(),
});

export type MenuDateQueryDto = z.infer<typeof MenuDateQuerySchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;
export type MenuDto = z.infer<typeof MenuSchema>;
