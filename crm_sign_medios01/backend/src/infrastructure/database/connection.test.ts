import assert from 'node:assert/strict';
import test from 'node:test';
import { validateDatabaseSchema } from './connection.js';

test('validateDatabaseSchema can be skipped for bootstrap initialization', async () => {
  const db = {
    query: async () => {
      throw new Error('schema validation should not run during bootstrap');
    },
    end: async () => undefined,
  };

  await assert.doesNotReject(async () => {
    await validateDatabaseSchema(db as never, { skipSchemaValidation: true });
  });
});
