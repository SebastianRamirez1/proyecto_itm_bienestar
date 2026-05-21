import { CafeteriaMenu } from '@prisma/client';
import { prisma } from '../../config/database';
import type { MenuItem } from './cafeteria.schema';

export class CafeteriaRepository {
  async findMenuByDate(date: Date): Promise<CafeteriaMenu | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return prisma.cafeteriaMenu.findFirst({ where: { date: startOfDay } });
  }

  async findLatestMenu(): Promise<CafeteriaMenu | null> {
    return prisma.cafeteriaMenu.findFirst({ orderBy: { date: 'desc' } });
  }

  async upsertMenu(
    date: Date,
    items: MenuItem[],
    prices: Record<string, number>,
  ): Promise<CafeteriaMenu> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    return prisma.cafeteriaMenu.upsert({
      where: { date: startOfDay },
      create: { date: startOfDay, items, prices, scrapedAt: new Date() },
      update: { items, prices, scrapedAt: new Date() },
    });
  }
}
