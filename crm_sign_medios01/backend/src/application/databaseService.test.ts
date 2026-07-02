import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeDatabaseService } from './databaseService.js';

const fakeStatus = {
  connected: true,
  message: 'ok',
  tables: [],
};

const fakeRepo = {
  getStatus: async () => fakeStatus,
};

test('makeDatabaseService returns repo status via getDatabaseHealth', async () => {
  const svc = makeDatabaseService(fakeRepo as any);
  const status = await svc.getDatabaseHealth();
  assert.deepStrictEqual(status, fakeStatus);
});
