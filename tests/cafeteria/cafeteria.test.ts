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
  await prisma.cafeteriaMenu.deleteMany();
  await redis.flushdb();
});

describe('GET /api/v1/cafeteria/menu', () => {
  it('returns fallback menu when no data exists (stale header)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/cafeteria/menu' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    // When no real data, X-Data-Freshness should be stale
    expect(res.headers['x-data-freshness']).toBe('stale');
  });

  it('returns cached menu from DB without stale header', async () => {
    await prisma.cafeteriaMenu.create({
      data: {
        date: new Date(new Date().setHours(0, 0, 0, 0)),
        items: [{ name: 'Bandeja paisa', category: 'plato_principal' }],
        prices: { 'Almuerzo': 8500 },
        scrapedAt: new Date(),
      },
    });

    const res = await app.inject({ method: 'GET', url: '/api/v1/cafeteria/menu' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['x-data-freshness']).toBeUndefined();
    const body = res.json();
    const items = body.data.items as Array<{ name: string }>;
    expect(items[0].name).toBe('Bandeja paisa');
  });

  it('returns menu for specific date', async () => {
    const targetDate = '2026-06-01';
    await prisma.cafeteriaMenu.create({
      data: {
        date: new Date(`${targetDate}T00:00:00.000Z`),
        items: [{ name: 'Arroz con pollo', category: 'plato_principal' }],
        prices: {},
        scrapedAt: new Date(),
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/cafeteria/menu?date=${targetDate}`,
    });
    expect(res.statusCode).toBe(200);
  });

  it('rejects invalid date format', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/cafeteria/menu?date=not-a-date',
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/v1/cafeteria/schedule', () => {
  it('returns schedule object', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/cafeteria/schedule' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.weekdays).toBeDefined();
  });
});

describe('GET /api/v1/cafeteria/prices', () => {
  it('returns price table', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/cafeteria/prices' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(typeof body.data).toBe('object');
  });
});
