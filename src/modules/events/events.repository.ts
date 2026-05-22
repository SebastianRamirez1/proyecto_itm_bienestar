import { Event, EventCategory } from '@prisma/client';
import { prisma } from '../../config/database';

export class EventsRepository {
  async findAll(opts: {
    category?: EventCategory;
    skip: number;
    take: number;
  }): Promise<{ events: Event[]; total: number }> {
    const where = {
      active: true,
      ...(opts.category && { category: opts.category }),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: opts.skip,
        take: opts.take,
        orderBy: { startDate: 'asc' },
      }),
      prisma.event.count({ where }),
    ]);

    return { events, total };
  }

  async findUpcoming(days = 7): Promise<Event[]> {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return prisma.event.findMany({
      where: {
        active: true,
        startDate: { gte: now, lte: future },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async findById(id: string): Promise<Event | null> {
    return prisma.event.findUnique({ where: { id } });
  }

  async isRegistered(eventId: string, userId: string): Promise<boolean> {
    const reg = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    return !!reg;
  }

  async upsertScrapedEvents(events: import('./events.scraper').ScrapedEvent[]): Promise<number> {
    let created = 0;
    for (const ev of events) {
      const existing = await prisma.event.findFirst({
        where: { title: ev.title, startDate: ev.startDate },
      });
      if (!existing) {
        await prisma.event.create({ data: ev });
        created++;
      }
    }
    return created;
  }

  async registerUserToEvent(eventId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) return null;

      if (event.maxCapacity !== null && event.registeredCount >= event.maxCapacity) {
        throw new Error('CAPACITY_FULL');
      }

      const registration = await tx.eventRegistration.create({
        data: { eventId, userId },
      });

      await tx.event.update({
        where: { id: eventId },
        data: { registeredCount: { increment: 1 } },
      });

      return registration;
    });
  }
}
