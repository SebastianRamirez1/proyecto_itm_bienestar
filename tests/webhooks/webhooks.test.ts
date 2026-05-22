import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, afterEach } from 'vitest';
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
  await prisma.webhook.deleteMany();
  await prisma.alert.deleteMany();
  await redis.flushdb();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── helpers ────────────────────────────────────────────────────────────────

const registerUser = async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: { email: `webhook.${Date.now()}@itm.edu.co`, password: 'Password123!' },
  });
  return res.json().data.accessToken as string;
};

// ── POST /api/v1/webhooks ──────────────────────────────────────────────────

describe('POST /api/v1/webhooks', () => {
  it('requires authentication', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks',
      payload: { url: 'https://example.com/hook' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('registers a webhook for an authenticated user', async () => {
    const token = await registerUser();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks',
      payload: { url: 'https://example.com/hook' },
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.url).toBe('https://example.com/hook');
    expect(res.json().data.active).toBe(true);
  });

  it('rejects an invalid URL', async () => {
    const token = await registerUser();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks',
      payload: { url: 'not-a-url' },
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ── GET /api/v1/webhooks ───────────────────────────────────────────────────

describe('GET /api/v1/webhooks', () => {
  it('requires authentication', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/webhooks' });
    expect(res.statusCode).toBe(401);
  });

  it('returns only webhooks belonging to the authenticated user', async () => {
    const tokenA = await registerUser();
    const tokenB = await registerUser();

    await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks',
      payload: { url: 'https://user-a.com/hook' },
      headers: { authorization: `Bearer ${tokenA}` },
    });
    await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks',
      payload: { url: 'https://user-b.com/hook' },
      headers: { authorization: `Bearer ${tokenB}` },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/webhooks',
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(1);
    expect(res.json().data[0].url).toBe('https://user-a.com/hook');
  });
});

// ── DELETE /api/v1/webhooks/:id ────────────────────────────────────────────

describe('DELETE /api/v1/webhooks/:id', () => {
  it('deletes an owned webhook', async () => {
    const token = await registerUser();

    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks',
      payload: { url: 'https://example.com/hook' },
      headers: { authorization: `Bearer ${token}` },
    });
    const { id } = created.json().data;

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/webhooks/${id}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(204);

    const list = await app.inject({
      method: 'GET',
      url: '/api/v1/webhooks',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(list.json().data).toHaveLength(0);
  });

  it('returns 403 when trying to delete another user\'s webhook', async () => {
    const tokenA = await registerUser();
    const tokenB = await registerUser();

    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks',
      payload: { url: 'https://example.com/hook' },
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const { id } = created.json().data;

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/webhooks/${id}`,
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 404 for a non-existent webhook', async () => {
    const token = await registerUser();
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/webhooks/00000000-0000-0000-0000-000000000000',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });
});

// ── Webhook firing on critical alert ──────────────────────────────────────

describe('Webhook delivery on critical alert', () => {
  it('fires fetch for each active webhook when a critical alert is created', async () => {
    const token = await registerUser();

    // Register a webhook
    await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks',
      payload: { url: 'https://example.com/critical-hook' },
      headers: { authorization: `Bearer ${token}` },
    });

    // Mock global fetch so we don't make real HTTP calls
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
    } as Response);

    // Create a critical alert
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/alerts',
      payload: { title: 'Critical!', body: 'Campus emergency', severity: 'critical' },
    });
    expect(res.statusCode).toBe(201);

    // Give the fire-and-forget a tick to execute
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://example.com/critical-hook');
    expect((options as RequestInit).method).toBe('POST');
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.event).toBe('alert.critical');
    expect(body.data.severity).toBe('critical');
  });

  it('does NOT fire webhooks for non-critical alerts', async () => {
    const token = await registerUser();
    await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks',
      payload: { url: 'https://example.com/hook' },
      headers: { authorization: `Bearer ${token}` },
    });

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response);

    await app.inject({
      method: 'POST',
      url: '/api/v1/alerts',
      payload: { title: 'Info alert', body: 'Just an info', severity: 'info' },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
