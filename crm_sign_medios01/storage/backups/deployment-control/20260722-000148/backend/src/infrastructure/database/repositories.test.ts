import test from 'node:test';
import assert from 'node:assert/strict';
import { PostgresAgentRepository } from './repositories.js';

test('PostgresAgentRepository can be instantiated and used as a repository contract', async () => {
  const repository = new PostgresAgentRepository();
  assert.ok(repository);
  const agents = await repository.list();
  assert.ok(Array.isArray(agents));
});
