import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/tokens';
import { AppError } from '../errors/AppError';
import type { JwtPayload } from '../types';

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload;
  }
}

function extractToken(request: FastifyRequest): string | null {
  const auth = request.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const token = extractToken(request);
  if (!token) {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authorization token required' },
    });
  }
  try {
    request.user = verifyToken(token);
  } catch {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
    });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply);
  if (!reply.sent && request.user?.role !== 'admin') {
    return reply.status(403).send({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Admin access required' },
    });
  }
}

export function optionalAuth(request: FastifyRequest, _reply: FastifyReply, done: () => void) {
  const token = extractToken(request);
  if (token) {
    try {
      request.user = verifyToken(token);
    } catch {
      // token inválido, continúa sin usuario
    }
  }
  done();
}

export async function requireApiKeyOrAuth(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = request.headers['x-api-key'] as string | undefined;
  if (apiKey) return; // validado a nivel de servicio con hash lookup
  return requireAuth(request, reply);
}
