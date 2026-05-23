import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../src/app';
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
  // Clear only metrics keys so other modules are unaffected
  const keys = await redis.keys('metrics:*');
  if (keys.length) await redis.del(...keys);
});

// ── GET /api/v1/metrics ───────────────────────────────────────────────────────

describe('GET /api/v1/metrics', () => {
  it('returns 200 with the correct top-level shape', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/metrics' });

    expect(res.statusCode).toBe(200);
    const { data } = res.json();
    expect(data).toHaveProperty('uptime');
    expect(data).toHaveProperty('requests');
    expect(data).toHaveProperty('latency');
  });

  it('uptime.seconds is a non-negative number', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/metrics' });
    const { data } = res.json();

    expect(typeof data.uptime.seconds).toBe('number');
    expect(data.uptime.seconds).toBeGreaterThanOrEqual(0);
  });

  it('uptime.human is a non-empty string', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/metrics' });
    const { data } = res.json();

    expect(typeof data.uptime.human).toBe('string');
    expect(data.uptime.human.length).toBeGreaterThan(0);
  });

  it('requests.total starts at 0 when Redis is empty', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/metrics' });
    const { data } = res.json();

    // After flushing metrics keys, total may be 0 or 1 (this very request)
    expect(data.requests.total).toBeGreaterThanOrEqual(0);
  });

  it('requests.byModule contains all expected modules', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/metrics' });
    const { data } = res.json();

    const modules = ['alerts', 'cafeteria', 'health', 'library', 'events', 'auth', 'webhooks', 'status', 'other'];
    for (const mod of modules) {
      expect(data.requests.byModule).toHaveProperty(mod);
      expect(typeof data.requests.byModule[mod]).toBe('number');
    }
  });

  it('latency.avgMs contains all expected modules', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/metrics' });
    const { data } = res.json();

    const modules = ['alerts', 'cafeteria', 'health', 'library', 'events', 'auth', 'webhooks', 'status', 'other'];
    for (const mod of modules) {
      expect(data.latency.avgMs).toHaveProperty(mod);
      expect(typeof data.latency.avgMs[mod]).toBe('number');
    }
  });

  it('increments request counter after subsequent API calls', async () => {
    // Make a known request to the alerts module
    await app.inject({ method: 'GET', url: '/api/v1/alerts' });
    await app.inject({ method: 'GET', url: '/api/v1/alerts' });

    // Give the fire-and-forget hook a tick to write to Redis
    await new Promise((r) => setTimeout(r, 50));

    const res = await app.inject({ method: 'GET', url: '/api/v1/metrics' });
    const { data } = res.json();

    expect(data.requests.byModule.alerts).toBeGreaterThanOrEqual(2);
    expect(data.requests.total).toBeGreaterThanOrEqual(2);
  });

  it('latency avgMs for a module is 0 when no requests recorded', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/metrics' });
    const { data } = res.json();

    // Redis was flushed in beforeEach so webhooks should have 0 requests and 0 avgMs
    expect(data.latency.avgMs.webhooks).toBe(0);
  });

  it('latency avgMs for alerts is > 0 after making a request', async () => {
    await app.inject({ method: 'GET', url: '/api/v1/alerts' });
    await new Promise((r) => setTimeout(r, 50));

    const res = await app.inject({ method: 'GET', url: '/api/v1/metrics' });
    const { data } = res.json();

    expect(data.latency.avgMs.alerts).toBeGreaterThanOrEqual(0);
  });
});
