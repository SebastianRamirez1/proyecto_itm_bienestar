import { User, ApiKey, RefreshToken } from '@prisma/client';
import { prisma } from '../../config/database';

export class AuthRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async createUser(email: string, passwordHash: string): Promise<User> {
    return prisma.user.create({ data: { email, passwordHash } });
  }

  async saveRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    return prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
  }

  async findRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  async deleteRefreshToken(tokenHash: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }

  async deleteExpiredRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });
  }

  async createApiKey(
    userId: string,
    keyHash: string,
    name: string,
    expiresAt?: Date,
  ): Promise<ApiKey> {
    return prisma.apiKey.create({ data: { userId, keyHash, name, expiresAt } });
  }

  async findApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
    return prisma.apiKey.findUnique({ where: { keyHash } });
  }

  async updateApiKeyLastUsed(id: string): Promise<void> {
    await prisma.apiKey.update({ where: { id }, data: { lastUsedAt: new Date() } });
  }
}
