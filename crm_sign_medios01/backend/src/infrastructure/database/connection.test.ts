import test from 'node:test';
import assert from 'node:assert/strict';
import { getDatabaseStatus, makePgDatabaseRepository } from './connection.js';

const mockClient = {
  query: async () => [
    { table_name: 'agents' },
    { table_name: 'conversations' },
    { table_name: 'messages' },
  ],
  end: async () => {},
};

test('getDatabaseStatus adapta filas de pg a DatabaseStatus', async () => {
  const status = await getDatabaseStatus(async () => mockClient);

  assert.deepStrictEqual(status, {
    connected: true,
    message: 'Conexión a base de datos establecida',
    tables: [
      { name: 'agents', exists: true },
      { name: 'conversations', exists: true },
      { name: 'messages', exists: true },
    ],
  });
});

test('makePgDatabaseRepository implementa DatabaseRepository y retorna estado', async () => {
  const repo = makePgDatabaseRepository(async () => mockClient);
  const status = await repo.getStatus();

  assert.strictEqual(status.connected, true);
  assert.strictEqual(status.message, 'Conexión a base de datos establecida');
  assert.deepStrictEqual(status.tables.map((row) => row.name), ['agents', 'conversations', 'messages']);
});
