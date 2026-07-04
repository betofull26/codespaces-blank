import test from 'node:test';
import assert from 'node:assert/strict';
import { createUser, changeUserRole, changeUserStatus, getUserById, listUsers, loginUser, updateUser } from './userManagement.js';
import bcrypt from 'bcrypt';
import type { UserRepository } from '../domain/repositories.js';
import type { UserModel, UserCredentialsModel } from '../domain/models.js';

test('createUser creates panel credentials when accessToPanel is true', async () => {
  let credential: UserCredentialsModel | null = null;

  const repository: UserRepository = {
    listUsers: async () => [],
    getUserById: async () => null,
    getUserByUsername: async () => null,
    getCredentialsByUsername: async () => null,
    createUser: async (user) => user,
    updateUser: async (user) => user,
    deleteUser: async () => undefined,
    updateUserRole: async (_id, _role, _actorId) => null,
    updateUserStatus: async (_id, _status) => null,
    upsertCredentials: async (entry: UserCredentialsModel) => {
      credential = entry;
      return entry;
    },
    createAuditLog: async () => undefined,
  };

  const result = await createUser(repository, {
    id: 'user-1',
    fullName: 'Ana Silva',
    username: 'ana.silva',
    passwordHash: 'hash-1',
    role: 'supervisor',
    status: 'active',
    accessToPanel: true,
    createdAt: '2026-07-03T00:00:00.000Z',
    updatedAt: '2026-07-03T00:00:00.000Z',
  } as UserModel, 'admin');

  assert.equal(result.accessToPanel, true);
  if (!credential) {
    throw new Error('Expected credentials to be created');
  }
  const storedCredential = credential as UserCredentialsModel;
  assert.equal(storedCredential.username, 'ana.silva');
});

test('loginUser accepts legacy plain-text passwords for stored users', async () => {
  const repository: UserRepository = {
    listUsers: async () => [],
    getUserById: async () => null,
    getUserByUsername: async () => ({
      id: 'user-legacy',
      fullName: 'Usuario Legacy',
      username: 'legacyuser',
      passwordHash: 'plain-password',
      role: 'admin',
      status: 'active',
      accessToPanel: true,
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    } as UserModel),
    getCredentialsByUsername: async () => ({
      id: 'cred-legacy',
      userId: 'user-legacy',
      username: 'legacyuser',
      passwordHash: 'plain-password',
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    } as UserCredentialsModel),
    createUser: async (user) => user,
    updateUser: async (user) => user,
    deleteUser: async () => undefined,
    updateUserRole: async (_id, _role, _actorId) => null,
    updateUserStatus: async (_id, _status) => null,
    upsertCredentials: async (entry) => entry,
    createAuditLog: async () => undefined,
  };

  const authenticated = await loginUser(repository, 'legacyuser', 'plain-password', 'admin');

  assert.equal(authenticated.user.username, 'legacyuser');
  assert.ok(authenticated.sessionToken.length > 0);
});

test('changeUserRole revokes panel access when role becomes agent', async () => {
  const repository: UserRepository = {
    listUsers: async () => [],
    getUserById: async () => ({
      id: 'user-2',
      fullName: 'Luis Pérez',
      username: 'luis.perez',
      passwordHash: 'hash-2',
      role: 'supervisor',
      status: 'active',
      accessToPanel: true,
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    } as UserModel),
    getUserByUsername: async () => null,
    getCredentialsByUsername: async () => null,
    createUser: async (user) => user,
    updateUser: async (user) => user,
    deleteUser: async () => undefined,
    updateUserRole: async (id, role, actorId) => ({
      id,
      fullName: 'Luis Pérez',
      username: 'luis.perez',
      passwordHash: 'hash-2',
      role,
      status: 'active',
      accessToPanel: role !== 'agent',
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
      changedBy: actorId,
    } as UserModel & { changedBy: string }),
    updateUserStatus: async (_id, _status) => null,
    upsertCredentials: async (entry) => entry,
    createAuditLog: async () => undefined,
  };

  const updated = await changeUserRole(repository, 'user-2', 'agent', 'admin');

  assert.equal(updated.role, 'agent');
  assert.equal(updated.accessToPanel, false);
});

test('listUsers returns the repository users', async () => {
  const repository: UserRepository = {
    listUsers: async () => [{
      id: 'user-4',
      fullName: 'Nora Vega',
      username: 'nora.vega',
      passwordHash: 'hash-4',
      role: 'supervisor',
      status: 'active',
      accessToPanel: true,
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    } as UserModel],
    getUserById: async () => null,
    getUserByUsername: async () => null,
    getCredentialsByUsername: async () => null,
    createUser: async (user) => user,
    updateUser: async (user) => user,
    deleteUser: async () => undefined,
    updateUserRole: async (_id, _role, _actorId) => null,
    updateUserStatus: async (_id, _status) => null,
    upsertCredentials: async (entry) => entry,
    createAuditLog: async () => undefined,
  };

  const users = await listUsers(repository);

  assert.equal(users.length, 1);
  assert.equal(users[0]?.username, 'nora.vega');
});

test('getUserById returns the requested user', async () => {
  const repository: UserRepository = {
    listUsers: async () => [],
    getUserById: async () => ({
      id: 'user-6',
      fullName: 'Sara López',
      username: 'sara.lopez',
      passwordHash: 'hash-6',
      role: 'supervisor',
      status: 'active',
      accessToPanel: true,
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    } as UserModel),
    getUserByUsername: async () => null,
    getCredentialsByUsername: async () => null,
    createUser: async (user) => user,
    updateUser: async (user) => user,
    deleteUser: async () => undefined,
    updateUserRole: async (_id, _role, _actorId) => null,
    updateUserStatus: async (_id, _status) => null,
    upsertCredentials: async (entry) => entry,
    createAuditLog: async () => undefined,
  };

  const user = await getUserById(repository, 'user-6');

  assert.equal(user?.username, 'sara.lopez');
});

test('updateUser edits the stored user data', async () => {
  const repository: UserRepository = {
    listUsers: async () => [],
    getUserById: async () => ({
      id: 'user-7',
      fullName: 'Tomás Ruiz',
      username: 'tomas.ruiz',
      passwordHash: 'hash-7',
      role: 'agent',
      status: 'active',
      accessToPanel: false,
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    } as UserModel),
    getUserByUsername: async () => null,
    getCredentialsByUsername: async () => null,
    createUser: async (user) => user,
    updateUser: async (user) => user,
    deleteUser: async () => undefined,
    updateUserRole: async (_id, _role, _actorId) => null,
    updateUserStatus: async (_id, _status) => null,
    upsertCredentials: async (entry) => entry,
    createAuditLog: async () => undefined,
  };

  const updated = await updateUser(repository, {
    id: 'user-7',
    fullName: 'Tomás Ruiz',
    username: 'tomas.ruiz.updated',
    passwordHash: 'hash-7',
    role: 'agent',
    status: 'active',
    accessToPanel: false,
    createdAt: '2026-07-03T00:00:00.000Z',
    updatedAt: '2026-07-03T00:00:00.000Z',
  } as UserModel, 'admin');

  assert.equal(updated.username, 'tomas.ruiz.updated');
});

test('changeUserStatus updates the account status and emits an audit event', async () => {
  let auditEntry: string | null = null;

  const repository: UserRepository = {
    listUsers: async () => [],
    getUserById: async () => ({
      id: 'user-5',
      fullName: 'Pablo Ruiz',
      username: 'pablo.ruiz',
      passwordHash: 'hash-5',
      role: 'agent',
      status: 'active',
      accessToPanel: false,
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    } as UserModel),
    getUserByUsername: async () => null,
    getCredentialsByUsername: async () => null,
    createUser: async (user) => user,
    updateUser: async (user) => user,
    deleteUser: async () => undefined,
    updateUserRole: async (_id, _role, _actorId) => null,
    updateUserStatus: async (_id, _status) => ({
      id: 'user-5',
      fullName: 'Pablo Ruiz',
      username: 'pablo.ruiz',
      passwordHash: 'hash-5',
      role: 'agent',
      status: _status,
      accessToPanel: false,
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    } as UserModel),
    upsertCredentials: async (entry) => entry,
    createAuditLog: async (entry: { action: string }) => {
      auditEntry = entry.action;
    },
  };

  const updated = await changeUserStatus(repository, 'user-5', 'suspended', 'admin');
  const action = auditEntry ?? '';

  assert.equal(updated.status, 'suspended');
  assert.equal(action, 'change_status');
});

test('loginUser authenticates only active users with panel access', async () => {
  const repository: UserRepository = {
    listUsers: async () => [],
    getUserById: async () => null,
    getUserByUsername: async () => ({
      id: 'user-3',
      fullName: 'Marta Díaz',
      username: 'marta.diaz',
      passwordHash: 'hash-3',
      role: 'admin',
      status: 'active',
      accessToPanel: true,
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    } as UserModel),
    getCredentialsByUsername: async () => ({
      id: 'cred-3',
      userId: 'user-3',
      username: 'marta.diaz',
      passwordHash: await bcrypt.hash('secret', 10),
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    } as UserCredentialsModel),
    createUser: async (user) => user,
    updateUser: async (user) => user,
    deleteUser: async () => undefined,
    updateUserRole: async (_id, _role, _actorId) => null,
    updateUserStatus: async (_id, _status) => null,
    upsertCredentials: async (entry) => entry,
    createAuditLog: async () => undefined,
  };

  const authenticated = await loginUser(repository, 'marta.diaz', 'secret', 'admin');

  assert.equal(authenticated.user.username, 'marta.diaz');
  assert.ok(authenticated.sessionToken.length > 0);
});
