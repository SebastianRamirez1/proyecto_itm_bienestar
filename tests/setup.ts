import { prisma } from '../src/config/database';
import { redis } from '../src/shared/cache/redis';

beforeAll(async () => {
  await redis.connect().catch(() => {});
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
  await redis.quit();
});
