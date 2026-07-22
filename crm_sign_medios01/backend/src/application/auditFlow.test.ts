import test from 'node:test';
import assert from 'node:assert/strict';
import { logAuditEvent } from './userManagement.js';
import type { UserRepository } from '../domain/repositories.js';

test('logAuditEvent records the expected audit payload for the new model', async () => {
  const entries: Array<{ entityType: string; entityId: string; action: string; performedBy: string; details: string }> = [];
  const repository: UserRepository = {
    listUsers: async () => [],
    getUserById: async () => null,
    getUserByUsername: async () => null,
    createUser: async (user) => user,
    updateUser: async (user) => user,
    deleteUser: async () => undefined,
    updateUserRole: async () => null,
    updateUserStatus: async () => null,
    createAuditLog: async (entry) => {
      entries.push({
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        performedBy: entry.performedBy,
        details: entry.details,
      });
    },
    createSession: async () => undefined,
    getSessionByTokenHash: async () => null,
    revokeSession: async () => undefined,
    listDevices: async () => [],
    getDeviceByUserId: async () => null,
  };

  await logAuditEvent(repository, 'contact', 'contact-1', 'create_contact', 'admin-user', { source: 'new-model' });

  assert.equal(entries[0]?.action, 'create_contact');
  assert.equal(entries[0]?.entityId, 'contact-1');
  assert.equal(entries[0]?.performedBy, 'admin-user');
  assert.match(entries[0]?.details ?? '', /new-model/);
});
