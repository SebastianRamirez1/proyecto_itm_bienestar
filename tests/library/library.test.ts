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
  await prisma.libraryRoomReservation.deleteMany();
  await prisma.libraryRoom.deleteMany();
  await prisma.libraryBook.deleteMany();
  await redis.flushdb();
});

const seedBook = (overrides = {}) =>
  prisma.libraryBook.create({
    data: {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: null, // null avoids unique-constraint collisions; provide explicitly when the test needs a specific ISBN
      availableCopies: 2,
      totalCopies: 3,
      category: 'Ingeniería de software',
      ...overrides,
    },
  });

const seedRoom = (overrides = {}) =>
  prisma.libraryRoom.create({
    data: {
      name: 'Sala A',
      capacity: 6,
      available: true,
      schedule: { weekdays: '07:00-20:00' },
      ...overrides,
    },
  });

const getToken = async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: { email: `lib.test.${Date.now()}@itm.edu.co`, password: 'Password123!' },
  });
  return res.json().data.accessToken as string;
};

describe('GET /api/v1/library/books', () => {
  it('returns empty list when no books exist', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/library/books' });
    expect(res.statusCode).toBe(200);
    expect(res.json().books).toEqual([]);
    expect(res.json().meta.total).toBe(0);
  });

  it('searches by title (case-insensitive)', async () => {
    await seedBook({ title: 'Clean Architecture' });
    await seedBook({ title: 'Design Patterns' });

    const res = await app.inject({ method: 'GET', url: '/api/v1/library/books?q=clean' });
    expect(res.statusCode).toBe(200);
    expect(res.json().books).toHaveLength(1);
    expect(res.json().books[0].title).toBe('Clean Architecture');
  });

  it('filters by availability', async () => {
    await seedBook({ title: 'Available Book', availableCopies: 1 });
    await seedBook({ title: 'Unavailable Book', availableCopies: 0 });

    const res = await app.inject({ method: 'GET', url: '/api/v1/library/books?available=true' });
    expect(res.statusCode).toBe(200);
    expect(res.json().books).toHaveLength(1);
    expect(res.json().books[0].title).toBe('Available Book');
  });

  it('paginates results', async () => {
    await Promise.all(Array.from({ length: 5 }, (_, i) => seedBook({ title: `Book ${i}`, isbn: `isbn${i}` })));

    const res = await app.inject({ method: 'GET', url: '/api/v1/library/books?limit=2&page=1' });
    expect(res.statusCode).toBe(200);
    expect(res.json().books).toHaveLength(2);
    expect(res.json().meta.total).toBe(5);
    expect(res.json().meta.totalPages).toBe(3);
  });
});

describe('GET /api/v1/library/books/:id', () => {
  it('returns book details', async () => {
    const book = await seedBook();
    const res = await app.inject({ method: 'GET', url: `/api/v1/library/books/${book.id}` });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.id).toBe(book.id);
  });

  it('returns 404 for unknown book', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/library/books/00000000-0000-0000-0000-000000000000',
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /api/v1/library/rooms/reserve', () => {
  it('requires authentication', async () => {
    const room = await seedRoom();
    const start = new Date(Date.now() + 3600000);
    const end = new Date(Date.now() + 7200000);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/library/rooms/reserve',
      payload: { roomId: room.id, startTime: start.toISOString(), endTime: end.toISOString() },
    });
    expect(res.statusCode).toBe(401);
  });

  it('creates a reservation successfully', async () => {
    const token = await getToken();
    const room = await seedRoom();
    const start = new Date(Date.now() + 3600000);
    const end = new Date(Date.now() + 5400000);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/library/rooms/reserve',
      payload: { roomId: room.id, startTime: start.toISOString(), endTime: end.toISOString() },
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.reservation.roomId).toBe(room.id);
  });

  it('rejects conflicting reservation', async () => {
    const token = await getToken();
    const room = await seedRoom();
    const start = new Date(Date.now() + 3600000);
    const end = new Date(Date.now() + 7200000);

    await app.inject({
      method: 'POST',
      url: '/api/v1/library/rooms/reserve',
      payload: { roomId: room.id, startTime: start.toISOString(), endTime: end.toISOString() },
      headers: { authorization: `Bearer ${token}` },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/library/rooms/reserve',
      payload: { roomId: room.id, startTime: start.toISOString(), endTime: end.toISOString() },
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(409);
  });

  it('rejects reservation exceeding 4 hours', async () => {
    const token = await getToken();
    const room = await seedRoom();
    const start = new Date(Date.now() + 3600000);
    const end = new Date(start.getTime() + 5 * 3600000); // 5 hours

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/library/rooms/reserve',
      payload: { roomId: room.id, startTime: start.toISOString(), endTime: end.toISOString() },
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(400);
  });
});
