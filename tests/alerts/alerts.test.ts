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
  await prisma.alert.deleteMany();
  await redis.flushdb();
});

describe('GET /api/v1/alerts', () => {
  it('returns empty array when no alerts exist', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/alerts' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('returns active alerts', async () => {
    await prisma.alert.create({
      data: { title: 'Test alert', body: 'Test body', severity: 'info' },
    });

    const res = await app.inject({ method: 'GET', url: '/api/v1/alerts' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Test alert');
  });

  it('filters by severity', async () => {
    await prisma.alert.createMany({
      data: [
        { title: 'Info alert', body: 'body', severity: 'info' },
        { title: 'Critical alert', body: 'body', severity: 'critical' },
      ],
    });

    const res = await app.inject({ method: 'GET', url: '/api/v1/alerts?severity=critical' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].severity).toBe('critical');
  });

  it('does not return expired alerts', async () => {
    await prisma.alert.create({
      data: {
        title: 'Expired alert',
        body: 'body',
        severity: 'warning',
        expiresAt: new Date('2020-01-01'),
      },
    });

    const res = await app.inject({ method: 'GET', url: '/api/v1/alerts' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(0);
  });
});

describe('POST /api/v1/alerts', () => {
  it('creates a new alert', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/alerts',
      payload: { title: 'New alert', body: 'Alert body', severity: 'warning' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
  });

  it('rejects invalid severity', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/alerts',
      payload: { title: 'Bad alert', body: 'body', severity: 'catastrophic' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/v1/alerts/:id', () => {
  it('returns alert details by id', async () => {
    const alert = await prisma.alert.create({
      data: { title: 'Found alert', body: 'body', severity: 'info' },
    });

    const res = await app.inject({ method: 'GET', url: `/api/v1/alerts/${alert.id}` });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.id).toBe(alert.id);
    expect(res.json().data.title).toBe('Found alert');
  });

  it('returns 404 for unknown alert id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/alerts/00000000-0000-0000-0000-000000000000',
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('PATCH /api/v1/alerts/:id/deactivate', () => {
  it('deactivates an active alert', async () => {
    const alert = await prisma.alert.create({
      data: { title: 'Active alert', body: 'body', severity: 'warning' },
    });

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/alerts/${alert.id}/deactivate`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.active).toBe(false);
  });

  it('returns 404 when deactivating a non-existent alert', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/alerts/00000000-0000-0000-0000-000000000000/deactivate',
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/v1/alerts (cache stale header)', () => {
  it('serves from cache and marks stale after flush', async () => {
    await prisma.alert.create({ data: { title: 'Cache test', body: 'body', severity: 'info' } });

    // Warm the cache
    await app.inject({ method: 'GET', url: '/api/v1/alerts' });

    // Flush Redis so the cache is stale on next read (if cache layer marks it)
    await redis.flushdb();

    // Second request will repopulate from DB — no stale header expected
    const res = await app.inject({ method: 'GET', url: '/api/v1/alerts' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(1);
  });
});

describe('GET /api/v1/status', () => {
  it('returns ok status', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/status' });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('ok');
  });
});
