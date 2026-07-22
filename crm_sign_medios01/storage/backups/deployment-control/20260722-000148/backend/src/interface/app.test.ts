import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './app.js';
import { buildSessionToken } from '../application/userManagement.js';

const withTestServer = async <T>(callback: (port: number) => Promise<T>): Promise<T> => {
  const app = createApp();
  const server = app.listen(0);

  try {
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Server did not bind to a port');
    }

    return await callback(address.port);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
};

test('createApp exposes the health endpoint', async () => {
  await withTestServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(response.status, 200);

    const body = await response.json() as { success: boolean };
    assert.equal(body.success, true);
  });
});

test('protected routes reject requests without a valid session token', async () => {
  await withTestServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`);
    assert.equal(response.status, 401);
  });
});

test('protected routes return 403 when the token is valid but permissions are insufficient', async () => {
  await withTestServer(async (port) => {
    const token = buildSessionToken('user-1', 'agent');
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(response.status, 403);
  });
});

test('audit logs are available to authorized users', async () => {
  await withTestServer(async (port) => {
    const token = buildSessionToken('user-1', 'admin');
    const response = await fetch(`http://127.0.0.1:${port}/api/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(response.status, 200);

    const body = await response.json() as { success: boolean; data: unknown[] };
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
  });
});
