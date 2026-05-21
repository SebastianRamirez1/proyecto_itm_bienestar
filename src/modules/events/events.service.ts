import { EventCategory } from '@prisma/client';
import { EventsRepository } from './events.repository';
import { EventsQueryDto } from './events.schema';
import { getOrSet, CacheTTL, redis } from '../../shared/cache/redis';
import { AppError } from '../../shared/errors/AppError';

export class EventsService {
  constructor(private readonly repo = new EventsRepository()) {}

  async getEvents(dto: EventsQueryDto) {
    const skip = (dto.page - 1) * dto.limit;
    const { events, total } = await this.repo.findAll({
      category: dto.category as EventCategory | undefined,
      skip,
      take: dto.limit,
    });

    return {
      events,
      meta: {
        page: dto.page,
        limit: dto.limit,
        total,
        totalPages: Math.ceil(total / dto.limit),
      },
    };
  }

  async getUpcoming() {
    const { data } = await getOrSet('events:upcoming', CacheTTL.EVENTS, () =>
      this.repo.findUpcoming(7),
    );
    return data;
  }

  async getEventById(id: string) {
    const event = await this.repo.findById(id);
    if (!event) throw AppError.notFound(`Event ${id} not found`);
    return event;
  }

  async registerToEvent(eventId: string, userId: string) {
    const event = await this.repo.findById(eventId);
    if (!event) throw AppError.notFound(`Event ${eventId} not found`);
    if (!event.active) throw AppError.badRequest('Event is no longer active');

    const alreadyRegistered = await this.repo.isRegistered(eventId, userId);
    if (alreadyRegistered) throw AppError.conflict('Already registered for this event');

    try {
      await this.repo.registerUserToEvent(eventId, userId);
      await redis.del('events:upcoming');
      return { message: `Successfully registered for "${event.title}"`, eventId };
    } catch (err) {
      if ((err as Error).message === 'CAPACITY_FULL') {
        throw AppError.conflict('Event has reached maximum capacity');
      }
      throw err;
    }
  }
}
