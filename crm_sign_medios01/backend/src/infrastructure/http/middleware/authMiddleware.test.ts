import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSessionToken, revokeSessionToken, verifySessionToken } from '../../../application/userManagement.js';
import { PostgresUserRepository } from '../../../infrastructure/database/repositories.js';
import { authenticateRequest } from './authMiddleware.js';

test('authenticateRequest rejects requests without a valid bearer token', async () => {
  const req = { headers: {} } as any;
  let statusCode = 0;
  let payload: unknown;
  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: unknown) {
      payload = data;
      return this;
    },
  } as any;

  await authenticateRequest(req, res, () => {
    throw new Error('next should not be called');
  });

  assert.equal(statusCode, 401);
  assert.equal((payload as { error: string }).error, 'Token de sesión requerido');
});

test('authenticateRequest rejects revoked tokens', async () => {
  const repository = new PostgresUserRepository();
  const token = buildSessionToken('user-2', 'supervisor');
  await revokeSessionToken(token, repository);
  const req = { headers: { authorization: `Bearer ${token}` } } as any;
  let statusCode = 0;
  let payload: unknown;
  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: unknown) {
      payload = data;
      return this;
    },
  } as any;

  await authenticateRequest(req, res, () => {
    throw new Error('next should not be called');
  });

  assert.equal(statusCode, 401);
  assert.equal((payload as { error: string }).error, 'Token de sesión revocado');
});

test('authenticateRequest accepts a valid bearer token and exposes the user context', async () => {
  const token = buildSessionToken('user-1', 'admin');
  const req = { headers: { authorization: `Bearer ${token}` } } as any;
  let nextCalled = false;
  const res = {
    status() {
      throw new Error('res.status should not be called');
    },
    json() {
      throw new Error('res.json should not be called');
    },
  } as any;

  await authenticateRequest(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user?.userId, 'user-1');
  assert.equal(req.user?.role, 'admin');
  const verified = await verifySessionToken(token, new PostgresUserRepository());
  assert.ok(!('reason' in verified));
  assert.equal(verified.userId, 'user-1');
});
