import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../src/app';
import { prisma } from '../../src/config/database';
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
  await prisma.refreshToken.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.user.deleteMany();
});

const ITM_USER = { email: 'test.student@itm.edu.co', password: 'Password123!' };

describe('POST /api/v1/auth/register', () => {
  it('registers a valid ITM user', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: ITM_USER,
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.refreshToken).toBeDefined();
    expect(body.data.user.email).toBe(ITM_USER.email);
  });

  it('rejects non-ITM email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: 'user@gmail.com', password: 'Password123!' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects duplicate email', async () => {
    await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: ITM_USER });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: ITM_USER,
    });
    expect(res.statusCode).toBe(409);
  });

  it('rejects short password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: 'test@itm.edu.co', password: '123' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: ITM_USER });
  });

  it('logs in with valid credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: ITM_USER,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.refreshToken).toBeDefined();
  });

  it('rejects wrong password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: ITM_USER.email, password: 'wrongpassword' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects unknown email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'nobody@itm.edu.co', password: 'Password123!' },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('issues new access token with valid refresh token', async () => {
    const reg = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: ITM_USER,
    });
    const { refreshToken } = reg.json().data;

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.accessToken).toBeDefined();
  });

  it('rejects invalid refresh token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: 'this.is.not.valid' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('prevents refresh token reuse', async () => {
    const reg = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: ITM_USER,
    });
    const { refreshToken } = reg.json().data;

    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken },
    });

    // Second use should fail (token rotated)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/v1/auth/api-key', () => {
  it('requires authentication', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/api-key',
      payload: { name: 'My bot' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('creates API key for authenticated user', async () => {
    const reg = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: ITM_USER,
    });
    const { accessToken } = reg.json().data;

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/api-key',
      payload: { name: 'WhatsApp bot' },
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.data.key).toMatch(/^itm_/);
  });
});
