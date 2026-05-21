import { describe, it, expect } from 'vitest';
import {
  requireAuth,
  requireAdmin,
  optionalAuth,
  requireApiKeyOrAuth,
} from '../../src/shared/middleware/auth.middleware';
import { signAccessToken } from '../../src/shared/utils/tokens';

// ── test doubles ────────────────────────────────────────────────────────────

function makeReply() {
  const reply = {
    sent: false,
    _status: 0 as number,
    _body: null as unknown,
    status(code: number) {
      this._status = code;
      return this;
    },
    send(body: unknown) {
      this._body = body;
      this.sent = true;
      return this;
    },
  };
  return reply;
}

function makeRequest(headers: Record<string, string> = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { headers, user: undefined as unknown } as any;
}

const studentToken = () =>
  signAccessToken({ sub: 'user-unit-1', email: 'student@itm.edu.co', role: 'student' });

const adminToken = () =>
  signAccessToken({ sub: 'admin-unit-1', email: 'admin@itm.edu.co', role: 'admin' });

// ── requireAuth ─────────────────────────────────────────────────────────────

describe('requireAuth', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const req = makeRequest();
    const reply = makeReply();

    await requireAuth(req, reply as never);

    expect(reply._status).toBe(401);
    expect((reply._body as { error: { code: string } }).error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when token is malformed', async () => {
    const req = makeRequest({ authorization: 'Bearer this.is.garbage' });
    const reply = makeReply();

    await requireAuth(req, reply as never);

    expect(reply._status).toBe(401);
    expect(reply.sent).toBe(true);
  });

  it('sets request.user and does not send a reply for a valid token', async () => {
    const token = studentToken();
    const req = makeRequest({ authorization: `Bearer ${token}` });
    const reply = makeReply();

    await requireAuth(req, reply as never);

    expect(reply.sent).toBe(false);
    expect(req.user).toBeDefined();
    expect(req.user.email).toBe('student@itm.edu.co');
    expect(req.user.role).toBe('student');
  });
});

// ── requireAdmin ────────────────────────────────────────────────────────────

describe('requireAdmin', () => {
  it('returns 401 when no token is provided', async () => {
    const req = makeRequest();
    const reply = makeReply();

    await requireAdmin(req, reply as never);

    expect(reply._status).toBe(401);
  });

  it('returns 403 when the authenticated user is a student', async () => {
    const token = studentToken();
    const req = makeRequest({ authorization: `Bearer ${token}` });
    const reply = makeReply();

    await requireAdmin(req, reply as never);

    expect(reply._status).toBe(403);
    expect((reply._body as { error: { code: string } }).error.code).toBe('FORBIDDEN');
  });

  it('passes through and sets request.user for an admin token', async () => {
    const token = adminToken();
    const req = makeRequest({ authorization: `Bearer ${token}` });
    const reply = makeReply();

    await requireAdmin(req, reply as never);

    expect(reply.sent).toBe(false);
    expect(req.user).toBeDefined();
    expect(req.user.role).toBe('admin');
  });
});

// ── optionalAuth ────────────────────────────────────────────────────────────

describe('optionalAuth', () => {
  it('calls done() without setting user when no Authorization header', () => {
    const req = makeRequest();
    const reply = makeReply();
    let doneCalled = false;

    optionalAuth(req, reply as never, () => {
      doneCalled = true;
    });

    expect(doneCalled).toBe(true);
    expect(req.user).toBeUndefined();
  });

  it('calls done() without setting user when token is invalid', () => {
    const req = makeRequest({ authorization: 'Bearer invalid.token.value' });
    const reply = makeReply();
    let doneCalled = false;

    optionalAuth(req, reply as never, () => {
      doneCalled = true;
    });

    expect(doneCalled).toBe(true);
    expect(req.user).toBeUndefined();
  });

  it('sets request.user and calls done() with a valid token', () => {
    const token = studentToken();
    const req = makeRequest({ authorization: `Bearer ${token}` });
    const reply = makeReply();
    let doneCalled = false;

    optionalAuth(req, reply as never, () => {
      doneCalled = true;
    });

    expect(doneCalled).toBe(true);
    expect(req.user).toBeDefined();
    expect(req.user.role).toBe('student');
  });
});

// ── requireApiKeyOrAuth ─────────────────────────────────────────────────────

describe('requireApiKeyOrAuth', () => {
  it('passes through immediately when x-api-key header is present', async () => {
    const req = makeRequest({ 'x-api-key': 'itm_somerawkey123' });
    const reply = makeReply();

    await requireApiKeyOrAuth(req, reply as never);

    expect(reply.sent).toBe(false);
  });

  it('falls back to requireAuth and returns 401 when no token or api-key', async () => {
    const req = makeRequest();
    const reply = makeReply();

    await requireApiKeyOrAuth(req, reply as never);

    expect(reply._status).toBe(401);
  });

  it('falls back to requireAuth and succeeds with a valid Bearer token', async () => {
    const token = studentToken();
    const req = makeRequest({ authorization: `Bearer ${token}` });
    const reply = makeReply();

    await requireApiKeyOrAuth(req, reply as never);

    expect(reply.sent).toBe(false);
    expect(req.user).toBeDefined();
    expect(req.user.email).toBe('student@itm.edu.co');
  });
});
