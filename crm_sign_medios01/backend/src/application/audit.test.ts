import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoleHistoryEntry, createAuditEntry } from './audit.js';

test('createRoleHistoryEntry formats the change payload', () => {
  const entry = createRoleHistoryEntry('user-1', 'agent', 'supervisor', 'admin', 'Cambio de rol');
  assert.equal(entry.userId, 'user-1');
  assert.equal(entry.newRole, 'supervisor');
  assert.equal(entry.changedBy, 'admin');
});

test('createAuditEntry builds a traceable audit record', () => {
  const entry = createAuditEntry('user', 'user-1', 'change_role', 'admin', { reason: 'promoted' });
  assert.equal(entry.entityType, 'user');
  assert.equal(entry.action, 'change_role');
  assert.equal(entry.performedBy, 'admin');
});
