import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { AuthRepository } from './auth.repository';
import {
  RegisterDto,
  LoginDto,
  RefreshDto,
  CreateApiKeyDto,
} from './auth.schema';
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  generateApiKey,
} from '../../shared/utils/tokens';
import { AppError } from '../../shared/errors/AppError';
import { env } from '../../config/env';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export class AuthService {
  constructor(private readonly repo = new AuthRepository()) {}

  async register(dto: RegisterDto) {
    const exists = await this.repo.findUserByEmail(dto.email);
    if (exists) throw AppError.conflict('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, env.API_KEY_SALT_ROUNDS);
    const user = await this.repo.createUser(dto.email, passwordHash);

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return { user: { id: user.id, email: user.email, role: user.role }, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.repo.findUserByEmail(dto.email);
    if (!user) throw AppError.unauthorized('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw AppError.unauthorized('Invalid credentials');

    await this.repo.deleteExpiredRefreshTokens(user.id);
    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return { user: { id: user.id, email: user.email, role: user.role }, ...tokens };
  }

  async refresh(dto: RefreshDto) {
    let payload: ReturnType<typeof verifyToken>;
    try {
      payload = verifyToken(dto.refreshToken);
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(dto.refreshToken);
    const stored = await this.repo.findRefreshToken(tokenHash);
    if (!stored || stored.expiresAt < new Date()) {
      throw AppError.unauthorized('Refresh token revoked or expired');
    }

    const user = await this.repo.findUserById(payload.sub);
    if (!user) throw AppError.unauthorized('User not found');

    await this.repo.deleteRefreshToken(tokenHash);
    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return tokens;
  }

  async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    await this.repo.deleteRefreshToken(tokenHash);
  }

  async createApiKey(userId: string, dto: CreateApiKeyDto) {
    const rawKey = generateApiKey();
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;
    await this.repo.createApiKey(userId, keyHash, dto.name, expiresAt);
    return { key: rawKey, name: dto.name, message: 'Store this key securely — it will not be shown again.' };
  }

  private async issueTokens(userId: string, email: string, role: string) {
    const accessToken = signAccessToken({ sub: userId, email, role: role as 'student' | 'admin' });
    const rawRefresh = signRefreshToken({ sub: userId });
    const tokenHash = hashToken(rawRefresh);

    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 7);
    await this.repo.saveRefreshToken(userId, tokenHash, refreshExpiry);

    return { accessToken, refreshToken: rawRefresh };
  }
}
