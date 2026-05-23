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
  await prisma.appointment.deleteMany();
  await prisma.healthResource.deleteMany();
  await prisma.academicCalendar.deleteMany();
  await redis.flushdb();
});

describe('GET /api/v1/health/resources', () => {
  it('returns empty array when no resources exist', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/health/resources' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toEqual([]);
  });

  it('returns only active resources', async () => {
    await prisma.healthResource.createMany({
      data: [
        { title: 'Active resource', description: 'desc', type: 'guide', contextType: 'normal', active: true },
        { title: 'Inactive resource', description: 'desc', type: 'guide', contextType: 'normal', active: false },
      ],
    });

    const res = await app.inject({ method: 'GET', url: '/api/v1/health/resources' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(1);
    expect(res.json().data[0].title).toBe('Active resource');
  });
});

describe('GET /api/v1/health/tips', () => {
  it('returns normal context when no academic period is active', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/health/tips' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.contextType).toBe('normal');
    expect(body.data.currentPeriod).toBeDefined();
  });

  it('returns midterm context during parciales period', async () => {
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    await prisma.academicCalendar.create({
      data: {
        periodName: 'Semana de parciales test',
        startDate: yesterday,
        endDate: tomorrow,
        periodType: 'midterm',
      },
    });

    await prisma.healthResource.create({
      data: {
        title: 'Tip para parciales',
        description: 'Manejo del estrés',
        type: 'guide',
        contextType: 'midterm',
        active: true,
      },
    });

    const res = await app.inject({ method: 'GET', url: '/api/v1/health/tips' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.contextType).toBe('midterm');
    expect(body.data.currentPeriod.type).toBe('midterm');
    const titles = body.data.resources.map((r: { title: string }) => r.title);
    expect(titles).toContain('Tip para parciales');
  });
});

describe('GET /api/v1/health/schedule', () => {
  it('returns schedule with required fields', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/health/schedule' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.attention).toBeDefined();
    expect(body.data.phone).toBeDefined();
    expect(body.data.email).toBeDefined();
  });
});

describe('GET /api/v1/health/emergency', () => {
  it('returns emergency contacts', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/health/emergency' });
    expect(res.statusCode).toBe(200);
    const contacts = res.json().data;
    expect(contacts.length).toBeGreaterThan(0);
    expect(contacts[0].phone).toBeDefined();
  });
});

describe('POST /api/v1/health/appointment', () => {
  it('requires authentication', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/health/appointment',
      payload: { preferredDate: new Date().toISOString(), reason: 'Necesito apoyo psicológico urgente' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 202 with appointment details', async () => {
    const reg = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: `health.test.${Date.now()}@itm.edu.co`, password: 'Password123!' },
    });
    const { accessToken } = reg.json().data;

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/health/appointment',
      payload: {
        preferredDate: new Date(Date.now() + 86400000).toISOString(),
        reason: 'Necesito apoyo para manejar el estrés de los finales',
        modality: 'virtual',
      },
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(202);
    const { data } = res.json();
    expect(data.message).toBeDefined();
    expect(data.appointmentId).toBeDefined();
    expect(data.status).toBe('pending');
    expect(data.modality).toBe('virtual');
  });

  it('persists appointment in the database', async () => {
    const reg = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: `health.persist.${Date.now()}@itm.edu.co`, password: 'Password123!' },
    });
    const { accessToken } = reg.json().data;

    await app.inject({
      method: 'POST',
      url: '/api/v1/health/appointment',
      payload: {
        preferredDate: new Date(Date.now() + 86400000).toISOString(),
        reason: 'Quiero hablar con alguien sobre el estrés académico',
      },
      headers: { authorization: `Bearer ${accessToken}` },
    });

    const appointments = await prisma.appointment.findMany();
    expect(appointments).toHaveLength(1);
    expect(appointments[0].status).toBe('pending');
    expect(appointments[0].modality).toBe('presencial'); // default
    expect(appointments[0].reason).toBe('Quiero hablar con alguien sobre el estrés académico');
  });

  it('defaults modality to presencial when not specified', async () => {
    const reg = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: `health.default.${Date.now()}@itm.edu.co`, password: 'Password123!' },
    });
    const { accessToken } = reg.json().data;

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/health/appointment',
      payload: {
        preferredDate: new Date(Date.now() + 86400000).toISOString(),
        reason: 'Apoyo para manejar la ansiedad ante los exámenes',
      },
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(202);
    expect(res.json().data.modality).toBe('presencial');
  });
});
