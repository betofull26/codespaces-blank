import test from 'node:test';
import assert from 'node:assert/strict';
import { createUser, changeUserRole, changeUserStatus, getUserById, listUsers, loginUser, logAuditEvent, updateUser, validateLoginPayload } from './userManagement.js';
import bcrypt from 'bcrypt';
import type { UserRepository } from '../domain/repositories.js';
import type { UserModel } from '../domain/models.js';

test('validateLoginPayload rejects missing credentials', () => {
  assert.throws(() => validateLoginPayload({ password: 'secret' }), /username/i);
  assert.throws(() => validateLoginPayload({ username: 'admin' }), /password/i);
});

test('createUser preserves the user data when accessToPanel is true', async () => {

  const repository: UserRepository = {
    listUsers: async () => [],
    getUserById: async () => null,
    getUserByUsername: async () => null,
    createUser: async (user) => user,
    updateUser: async (user) => user,
    deleteUser: async () => undefined,
    updateUserRole: async (_id, _role, _actorId) => null,
    updateUserStatus: async (_id, _status) => null,
    createAuditLog: async () => undefined,
    createSession: async () => undefined,
    getSessionByTokenHash: async () => null,
    revokeSession: async () => undefined,
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
  assert.equal(result.username, 'ana.silva');
});

test('createUser writes an audit record for new user creation', async () => {
  let auditEntry: { action: string; entityId: string; performedBy: string } | null = null;

  const repository: UserRepository = {
    listUsers: async () => [],
    getUserById: async () => null,
    getUserByUsername: async () => null,
    createUser: async (user) => user,
    updateUser: async (user) => user,
    deleteUser: async () => undefined,
    updateUserRole: async (_id, _role, _actorId) => null,
    updateUserStatus: async (_id, _status) => null,
    createAuditLog: async (entry) => {
      auditEntry = {
        action: entry.action,
        entityId: entry.entityId,
        performedBy: entry.performedBy,
      };
    },
    createSession: async () => undefined,
    getSessionByTokenHash: async () => null,
    revokeSession: async () => undefined,
  };

  await createUser(repository, {
    id: 'user-create-audit',
    fullName: 'Ana Silva',
    username: 'ana.silva.audit',
    passwordHash: 'hash-create',
    role: 'supervisor',
    status: 'active',
    accessToPanel: true,
    createdAt: '2026-07-03T00:00:00.000Z',
    updatedAt: '2026-07-03T00:00:00.000Z',
  } as UserModel, 'admin');

  assert.ok(auditEntry);
  assert.equal(auditEntry?.action, 'create_user');
  assert.equal(auditEntry?.entityId, 'user-create-audit');
  assert.equal(auditEntry?.performedBy, 'admin');
});

test('loginUser authenticates through auth_users and migrates plain-text passwords', async () => {
  let updatedUser: UserModel | null = null;
  let updatedAuthUser: { passwordHash: string } | null = null;

  const repository: UserRepository = {
    listUsers: async () => [],
    getUserById: async () => ({
      id: 'user-auth-flow',
      fullName: 'Usuario Nuevo',
      username: 'usuario.nuevo',
      passwordHash: 'plain-password',
      role: 'admin',
      status: 'active',
      accessToPanel: true,
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    } as UserModel),
    getUserByUsername: async () => {
      throw new Error('legacy user lookup should not be used');
    },
    createUser: async (user) => user,
    updateUser: async (user) => {
      updatedUser = user;
      return user;
    },
    deleteUser: async () => undefined,
    updateUserRole: async (_id, _role, _actorId) => null,
    updateUserStatus: async (_id, _status) => null,
    createAuditLog: async () => undefined,
    createSession: async () => undefined,
    getSessionByTokenHash: async () => null,
    revokeSession: async () => undefined,
    getAuthUserByUsername: async (username) => ({
      id: 'auth-user-flow',
      userId: 'user-auth-flow',
      username,
      passwordHash: 'plain-password',
      role: 'admin',
      status: 'active',
      accessToPanel: true,
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    }),
    upsertAuthUser: async (authUser) => {
      updatedAuthUser = authUser;
      return authUser;
    },
  };

  const authenticated = await loginUser(repository, 'usuario.nuevo', 'plain-password', 'admin');

  assert.equal(authenticated.user.username, 'usuario.nuevo');
  assert.ok(authenticated.sessionToken.length > 0);
  assert.ok(updatedUser?.passwordHash?.startsWith('$2'));
  assert.ok(updatedAuthUser?.passwordHash?.startsWith('$2'));
});

test('loginUser returns a structured session token after a successful login', async () => {
  const passwordHash = await bcrypt.hash('secret123', 10);
  const repository: UserRepository = {
    listUsers: async () => [],
    getUserById: async () => ({
      id: 'user-token',
      fullName: 'Token User',
      username: 'token.user',
      passwordHash,
      role: 'supervisor',
      status: 'active',
      accessToPanel: true,
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    } as UserModel),
    getUserByUsername: async () => null,
    createUser: async (user) => user,
    updateUser: async (user) => user,
    deleteUser: async () => undefined,
    updateUserRole: async (_id, _role, _actorId) => null,
    updateUserStatus: async (_id, _status) => null,
    createAuditLog: async () => undefined,
    createSession: async () => undefined,
    getSessionByTokenHash: async () => null,
    revokeSession: async () => undefined,
    getAuthUserByUsername: async (username) => ({
      id: 'auth-user-token',
      userId: 'user-token',
      username,
      passwordHash,
      role: 'supervisor',
      status: 'active',
      accessToPanel: true,
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    }),
  };

  const authenticated = await loginUser(repository, 'token.user', 'secret123', 'admin');

  assert.match(authenticated.sessionToken, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
});

test('loginUser rejects when auth_users has no matching identity', async () => {
  const repository: UserRepository = {
    listUsers: async () => [],
    getUserById: async () => null,
    getUserByUsername: async () => {
      throw new Error('legacy user lookup should not be used');
    },
    createUser: async (user) => user,
    updateUser: async (user) => user,
    deleteUser: async () => undefined,
    updateUserRole: async () => null,
    updateUserStatus: async () => null,
    createAuditLog: async () => undefined,
    createSession: async () => undefined,
    getSessionByTokenHash: async () => null,
    revokeSession: async () => undefined,
    getAuthUserByUsername: async () => null,
  };

  await assert.rejects(() => loginUser(repository, 'usuario.sin.auth', 'secret', 'admin'), /Unauthorized/);
});

test('createUser persists the new user identity and device metadata in the new model', async () => {
  const createdAuthUsers: Array<NonNullable<UserRepository['upsertAuthUser']> extends (arg: infer A) => any ? A : never> = [];
  const createdDevices: Array<NonNullable<UserRepository['upsertDevice']> extends (arg: infer A) => any ? A : never> = [];
  const createdUsers: UserModel[] = [];
  const repository: UserRepository = {
    listUsers: async () => [],
    getUserById: async () => null,
    getUserByUsername: async () => null,
    createUser: async (user) => {
      createdUsers.push(user);
      return user;
    },
    updateUser: async (user) => user,
    deleteUser: async () => undefined,
    updateUserRole: async () => null,
    updateUserStatus: async () => null,
    createAuditLog: async () => undefined,
    createSession: async () => undefined,
    getSessionByTokenHash: async () => null,
    revokeSession: async () => undefined,
    upsertAuthUser: async (authUser) => {
      createdAuthUsers.push(authUser);
      return authUser;
    },
    upsertDevice: async (device) => {
      createdDevices.push(device);
      return device;
    },
  };

  await createUser(repository, {
    id: 'user-9',
    fullName: 'Diana Torres',
    username: 'diana.torres',
    passwordHash: 'plain-password',
    role: 'agent',
    status: 'active',
    accessToPanel: false,
    createdAt: '2026-07-03T00:00:00.000Z',
    updatedAt: '2026-07-03T00:00:00.000Z',
    assignedPhone: '+584145550120',
    deviceModel: 'Samsung A54',
    serialNumber: 'SER-001',
    serialNumber2: 'SER-002',
  } as UserModel, 'admin');

  assert.equal(createdUsers[0]?.username, 'diana.torres');
  assert.equal(createdUsers[0]?.passwordHash?.startsWith('$2'), true);
  assert.equal(createdAuthUsers[0]?.username, 'diana.torres');
  assert.equal(createdAuthUsers[0]?.userId, 'user-9');
  assert.equal(createdDevices[0]?.assignedPhone, '+584145550120');
  assert.equal(createdDevices[0]?.brandModel, 'Samsung A54');
});

test('loginUser resolves credentials from auth_users when the new auth identity is available', async () => {
  const passwordHash = await bcrypt.hash('secret', 10);
  const repository: UserRepository = {
    listUsers: async () => [],
    getUserById: async () => ({
      id: 'user-10',
      fullName: 'Marta Díaz',
      username: 'marta.diaz',
      passwordHash,
      role: 'admin',
      status: 'active',
      accessToPanel: true,
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    } as UserModel),
    getUserByUsername: async () => null,
    createUser: async (user) => user,
    updateUser: async (user) => user,
    deleteUser: async () => undefined,
    updateUserRole: async () => null,
    updateUserStatus: async () => null,
    createAuditLog: async () => undefined,
    createSession: async () => undefined,
    getSessionByTokenHash: async () => null,
    revokeSession: async () => undefined,
    getAuthUserByUsername: async (username) => ({
      id: 'auth-user-10',
      userId: 'user-10',
      username,
      passwordHash,
      role: 'admin',
      status: 'active',
      accessToPanel: true,
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    }),
  };

  const authenticated = await loginUser(repository, 'marta.diaz', 'secret', 'admin');

  assert.equal(authenticated.user.id, 'user-10');
  assert.equal(authenticated.user.username, 'marta.diaz');
});

test('logAuditEvent persists a real audit entry through the repository', async () => {
  let persistedEntry: { action: string; entityId: string; performedBy: string } | null = null;
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
      persistedEntry = { action: entry.action, entityId: entry.entityId, performedBy: entry.performedBy };
    },
    createSession: async () => undefined,
    getSessionByTokenHash: async () => null,
    revokeSession: async () => undefined,
  };

  await logAuditEvent(repository, 'device', 'user-7', 'update_device', 'admin', { source: 'real-route' });

  assert.equal(persistedEntry?.action, 'update_device');
  assert.equal(persistedEntry?.entityId, 'user-7');
  assert.equal(persistedEntry?.performedBy, 'admin');
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
    createAuditLog: async () => undefined,
    createSession: async () => undefined,
    getSessionByTokenHash: async () => null,
    revokeSession: async () => undefined,
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
    createUser: async (user) => user,
    updateUser: async (user) => user,
    deleteUser: async () => undefined,
    updateUserRole: async (_id, _role, _actorId) => null,
    updateUserStatus: async (_id, _status) => null,
    createAuditLog: async () => undefined,
    createSession: async () => undefined,
    getSessionByTokenHash: async () => null,
    revokeSession: async () => undefined,
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
    createUser: async (user) => user,
    updateUser: async (user) => user,
    deleteUser: async () => undefined,
    updateUserRole: async (_id, _role, _actorId) => null,
    updateUserStatus: async (_id, _status) => null,
    createAuditLog: async () => undefined,
    createSession: async () => undefined,
    getSessionByTokenHash: async () => null,
    revokeSession: async () => undefined,
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
    createUser: async (user) => user,
    updateUser: async (user) => user,
    deleteUser: async () => undefined,
    updateUserRole: async (_id, _role, _actorId) => null,
    updateUserStatus: async (_id, _status) => null,
    createAuditLog: async () => undefined,
    createSession: async () => undefined,
    getSessionByTokenHash: async () => null,
    revokeSession: async () => undefined,
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
    createAuditLog: async (entry: { action: string }) => {
      auditEntry = entry.action;
    },
    createSession: async () => undefined,
    getSessionByTokenHash: async () => null,
    revokeSession: async () => undefined,
  };

  const updated = await changeUserStatus(repository, 'user-5', 'suspended', 'admin');
  const action = auditEntry ?? '';

  assert.equal(updated.status, 'suspended');
  assert.equal(action, 'change_status');
});

test('loginUser does not expose password hashes in the returned user payload', async () => {
  const passwordHash = await bcrypt.hash('secret', 10);
  const repository: UserRepository = {
    listUsers: async () => [],
    getUserById: async () => ({
      id: 'user-3',
      fullName: 'Marta Díaz',
      username: 'marta.diaz',
      passwordHash,
      role: 'admin',
      status: 'active',
      accessToPanel: true,
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    } as UserModel),
    getUserByUsername: async () => null,
    createUser: async (user) => user,
    updateUser: async (user) => user,
    deleteUser: async () => undefined,
    updateUserRole: async (_id, _role, _actorId) => null,
    updateUserStatus: async (_id, _status) => null,
    createAuditLog: async () => undefined,
    createSession: async () => undefined,
    getSessionByTokenHash: async () => null,
    revokeSession: async () => undefined,
    getAuthUserByUsername: async (username) => ({
      id: 'auth-user-3',
      userId: 'user-3',
      username,
      passwordHash,
      role: 'admin',
      status: 'active',
      accessToPanel: true,
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    }),
  };

  const authenticated = await loginUser(repository, 'marta.diaz', 'secret', 'admin');

  assert.equal(authenticated.user.username, 'marta.diaz');
  assert.equal('passwordHash' in authenticated.user, false);
  assert.ok(authenticated.sessionToken.length > 0);
});

test('loginUser authenticates only active users with panel access', async () => {
  const passwordHash = await bcrypt.hash('secret', 10);
  const repository: UserRepository = {
    listUsers: async () => [],
    getUserById: async () => ({
      id: 'user-3',
      fullName: 'Marta Díaz',
      username: 'marta.diaz',
      passwordHash,
      role: 'admin',
      status: 'active',
      accessToPanel: true,
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    } as UserModel),
    getUserByUsername: async () => null,
    createUser: async (user) => user,
    updateUser: async (user) => user,
    deleteUser: async () => undefined,
    updateUserRole: async (_id, _role, _actorId) => null,
    updateUserStatus: async (_id, _status) => null,
    createAuditLog: async () => undefined,
    createSession: async () => undefined,
    getSessionByTokenHash: async () => null,
    revokeSession: async () => undefined,
    getAuthUserByUsername: async (username) => ({
      id: 'auth-user-active',
      userId: 'user-3',
      username,
      passwordHash,
      role: 'admin',
      status: 'active',
      accessToPanel: true,
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    }),
  };

  const authenticated = await loginUser(repository, 'marta.diaz', 'secret', 'admin');

  assert.equal(authenticated.user.username, 'marta.diaz');
  assert.ok(authenticated.sessionToken.length > 0);
});
