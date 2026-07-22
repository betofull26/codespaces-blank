import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAssignedPhone, PostgresAgentRepository } from './repositories.js';

test('PostgresAgentRepository can be instantiated and used as a repository contract', async () => {
  const repository = new PostgresAgentRepository();
  assert.ok(repository);
  const agents = await repository.list();
  assert.ok(Array.isArray(agents));
});

test('buildAssignedPhone creates unique values for different device inserts', () => {
  const first = buildAssignedPhone('user-1');
  const second = buildAssignedPhone('user-2');

  assert.ok(first.startsWith('+'));
  assert.ok(second.startsWith('+'));
  assert.notEqual(first, second);
});
