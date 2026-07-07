import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessAdminModule, canManageUsers, ensureAuthorized } from './authorization.js';

test('agents cannot access admin modules', () => {
  assert.equal(canAccessAdminModule('agent'), false);
  assert.equal(canManageUsers('agent'), false);
});

test('supervisors can view but not manage critical users', () => {
  assert.equal(canAccessAdminModule('supervisor'), true);
  assert.equal(canManageUsers('supervisor'), false);
});

test('admins can manage users and admin modules', () => {
  assert.equal(canAccessAdminModule('admin'), true);
  assert.equal(canManageUsers('admin'), true);
});

test('supervisors can view backups but cannot manage them', () => {
  assert.doesNotThrow(() => ensureAuthorized('supervisor', 'view-backups'));
  assert.throws(() => ensureAuthorized('supervisor', 'manage-backups'), /Unauthorized/);
});

test('supervisors can access audit logs and templates', () => {
  assert.doesNotThrow(() => ensureAuthorized('supervisor', 'view-audit-logs'));
  assert.doesNotThrow(() => ensureAuthorized('supervisor', 'manage-templates'));
});

test('ensureAuthorized rejects unauthorized roles', () => {
  assert.throws(() => ensureAuthorized('agent', 'manage-users'), /Unauthorized/);
  assert.doesNotThrow(() => ensureAuthorized('admin', 'manage-users'));
});
