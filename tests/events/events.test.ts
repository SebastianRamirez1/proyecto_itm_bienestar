import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../src/app';
import { prisma } from '../../src/config/database';
import { redis } from '../../src/shared/cache/redis';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await prisma.eventRegistration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  await redis.flushdb();
});

const seedEvent = (overrides = {}) =>
  prisma.event.create({
    data: {
      title: 'Test Event',
      description: 'A test event',
      category: 'academic',
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 90000000),
      location: 'Bloque 10',
      ...overrides,
    },
  });

const getToken = async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: { email: `ev.test.${Date.now()}@itm.edu.co`, password: 'Password123!' },
  });
  return res.json().data.accessToken as string;
};

describe('GET /api/v1/events', () => {
  it('returns empty list when no events exist', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/events' });
    expect(res.statusCode).toBe(200);
    expect(res.json().events).toEqual([]);
  });

  it('filters by category', async () => {
    await seedEvent({ category: 'sport', title: 'Futbol' });
    await seedEvent({ category: 'cultural', title: 'Teatro' });

    const res = await app.inject({ method: 'GET', url: '/api/v1/events?category=sport' });
    expect(res.statusCode).toBe(200);
    expect(res.json().events).toHaveLength(1);
    expect(res.json().events[0].title).toBe('Futbol');
  });

  it('returns pagination meta', async () => {
    await Promise.all(Array.from({ length: 5 }, (_, i) => seedEvent({ title: `Event ${i}` })));

    const res = await app.inject({ method: 'GET', url: '/api/v1/events?limit=2' });
    expect(res.json().meta.total).toBe(5);
    expect(res.json().meta.totalPages).toBe(3);
  });

  it('does not return inactive events', async () => {
    await seedEvent({ active: false });
    const res = await app.inject({ method: 'GET', url: '/api/v1/events' });
    expect(res.json().events).toHaveLength(0);
  });
});

describe('GET /api/v1/events/upcoming', () => {
  it('returns only events in the next 7 days', async () => {
    await seedEvent({ title: 'Upcoming', startDate: new Date(Date.now() + 86400000) });
    await seedEvent({ title: 'Far future', startDate: new Date(Date.now() + 30 * 86400000) });

    const res = await app.inject({ method: 'GET', url: '/api/v1/events/upcoming' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(1);
    expect(res.json().data[0].title).toBe('Upcoming');
  });
});

describe('GET /api/v1/events/:id', () => {
  it('returns event details', async () => {
    const event = await seedEvent();
    const res = await app.inject({ method: 'GET', url: `/api/v1/events/${event.id}` });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.id).toBe(event.id);
  });

  it('returns 404 for unknown event', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/events/00000000-0000-0000-0000-000000000000',
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /api/v1/events/:id/register', () => {
  it('requires authentication', async () => {
    const event = await seedEvent();
    const res = await app.inject({ method: 'POST', url: `/api/v1/events/${event.id}/register` });
    expect(res.statusCode).toBe(401);
  });

  it('registers user for event', async () => {
    const token = await getToken();
    const event = await seedEvent();

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/events/${event.id}/register`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.eventId).toBe(event.id);
  });

  it('rejects duplicate registration', async () => {
    const token = await getToken();
    const event = await seedEvent();

    await app.inject({
      method: 'POST',
      url: `/api/v1/events/${event.id}/register`,
      headers: { authorization: `Bearer ${token}` },
    });

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/events/${event.id}/register`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(409);
  });

  it('rejects registration when event is at capacity', async () => {
    const token = await getToken();
    const event = await seedEvent({ maxCapacity: 0, registeredCount: 0 });

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/events/${event.id}/register`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(409);
  });
});
