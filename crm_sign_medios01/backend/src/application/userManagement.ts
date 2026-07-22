import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import type { AuthUserModel, DeviceModel, UserModel } from '../domain/models.js';
import type { UserRepository } from '../domain/repositories.js';
import { createAuditEntry, createRoleHistoryEntry } from './audit.js';

const hashToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');

const buildAssignedPhone = (userId: string): string => {
  const normalized = userId.replace(/[^a-z0-9]/gi, '').slice(0, 12);
  const suffix = `${Date.now().toString().slice(-6)}${Math.random().toString().slice(2, 6)}`;
  return `+${normalized || 'user'}${suffix}`;
};

export const validateLoginPayload = (payload: unknown): { username: string; password: string } => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid login payload');
  }

  const candidate = payload as Record<string, unknown>;
  const username = typeof candidate.username === 'string' ? candidate.username.trim() : '';
  const password = typeof candidate.password === 'string' ? candidate.password : '';

  if (!username) {
    throw new Error('username is required');
  }

  if (!password) {
    throw new Error('password is required');
  }

  return { username, password };
};

export const listUsers = async (repository: UserRepository): Promise<UserModel[]> => {
  return repository.listUsers();
};

export const getUserById = async (repository: UserRepository, userId: string): Promise<UserModel | null> => {
  return repository.getUserById(userId);
};

const isBcryptHash = (value: string | undefined): boolean => {
  return typeof value === 'string' && value.startsWith('$2');
};

const hashPasswordIfNeeded = async (password: string): Promise<string> => {
  if (isBcryptHash(password)) {
    return password;
  }

  return bcrypt.hash(password, 10);
};

const passwordMatches = async (candidatePassword: string, storedPasswordHash: string | undefined): Promise<boolean> => {
  if (!storedPasswordHash) {
    return false;
  }

  if (isBcryptHash(storedPasswordHash)) {
    return bcrypt.compare(candidatePassword, storedPasswordHash);
  }

  return storedPasswordHash === candidatePassword;
};

const resolveActorUsername = async (repository: UserRepository, actorId: string): Promise<string> => {
  if (!actorId || actorId === 'system') {
    return actorId || 'system';
  }

  const actor = await repository.getUserById(actorId);
  return actor?.username || actorId;
};

const resolveUserLabel = (user: Pick<UserModel, 'username' | 'fullName' | 'role'>): string => {
  return user.role === 'agent' ? user.fullName : user.username;
};

const syncAuthIdentityAndDevice = async (repository: UserRepository, user: UserModel, authUser: AuthUserModel): Promise<void> => {
  if (typeof repository.upsertAuthUser === 'function') {
    await repository.upsertAuthUser(authUser);
  }

  if (typeof repository.upsertDevice === 'function') {
    const device: DeviceModel = {
      id: `device-${user.id}`,
      userId: user.id,
      brandModel: 'Migrated from legacy system',
      serialNumber1: `serial-${user.id}`,
      serialNumber2: null,
      assignedPhone: buildAssignedPhone(user.id),
    };
    await repository.upsertDevice(device);
  }
};

export const logAuditEvent = async (
  repository: UserRepository,
  entityType: string,
  entityId: string,
  action: string,
  userId: string,
  details: Record<string, unknown>,
): Promise<void> => {
  const auditEntry = createAuditEntry(entityType, entityId, action, userId, details);
  await repository.createAuditLog({
    id: auditEntry.id,
    entityType: auditEntry.entityType,
    entityId: auditEntry.entityId,
    action: auditEntry.action,
    userId: auditEntry.userId,
    details: auditEntry.details,
    createdAt: auditEntry.createdAt,
  });
};

export const createUser = async (
  repository: UserRepository,
  userProfile: UserModel,
  authData: { username: string; passwordHash: string; role: 'admin' | 'agent' | 'supervisor'; accessToPanel?: boolean },
  actorId: string,
): Promise<UserModel> => {
  const now = new Date().toISOString();
  const userId = userProfile.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const passwordHash = await hashPasswordIfNeeded(authData.passwordHash);

  const userToCreate: UserModel = {
    ...userProfile,
    id: userId,
    createdAt: userProfile.createdAt || now,
    updatedAt: userProfile.updatedAt || now,
    online: userProfile.online ?? false,
  };

  const created = await repository.createUser(userToCreate);
  
  const authUser: AuthUserModel = {
    id: `auth-${userId}`,
    userId: userId,
    username: authData.username,
    passwordHash,
    role: authData.role,
    status: 'active',
    accessToPanel: authData.accessToPanel ?? (authData.role !== 'agent'),
    createdAt: now,
    updatedAt: now,
  };

  await syncAuthIdentityAndDevice(repository, created, authUser);

  const actorUsername = await resolveActorUsername(repository, actorId);

  await logAuditEvent(repository, 'user', created.id, 'create_user', actorId, {
    actorUsername,
    username: authData.username,
    fullName: created.fullName,
    role: authData.role,
    accessToPanel: authUser.accessToPanel,
  });

  return created;
};

export const changeUserRole = async (
  repository: UserRepository,
  userId: string,
  nextRole: 'admin' | 'agent' | 'supervisor',
  actorId: string,
): Promise<UserModel> => {
  const current = await repository.getUserById(userId);
  if (!current) {
    throw new Error('User not found');
  }

  const updated = await repository.updateUserRole(userId, nextRole, actorId);
  if (!updated) {
    throw new Error('Failed to update role');
  }

  const authUser: AuthUserModel = {
    id: `auth-${userId}`,
    userId: userId,
    username: '',
    passwordHash: '',
    role: nextRole,
    status: 'active',
    accessToPanel: nextRole !== 'agent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await syncAuthIdentityAndDevice(repository, updated, authUser);

  const actorUsername = await resolveActorUsername(repository, actorId);
  const targetUserLabel = current.fullName;
  await logAuditEvent(repository, 'user', updated.id, 'change_role', actorId, {
    actorUsername,
    targetUserLabel,
    newRole: nextRole,
  });

  return updated;
};

export const updateUser = async (
  repository: UserRepository,
  userProfile: UserModel,
  actorId: string,
): Promise<UserModel> => {
  const current = await repository.getUserById(userProfile.id);
  if (!current) {
    throw new Error('User not found');
  }

  const userToUpdate: UserModel = {
    ...userProfile,
    updatedAt: new Date().toISOString(),
  };

  const updated = await repository.updateUser(userToUpdate);
  const actorUsername = await resolveActorUsername(repository, actorId);

  await repository.createAuditLog({
    id: `audit-update-${updated.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    entityType: 'user',
    entityId: updated.id,
    action: 'update_user',
    userId: actorId,
    details: JSON.stringify({
      actorUsername,
      fullName: updated.fullName,
      previousName: current.fullName,
    }),
    createdAt: updated.updatedAt || new Date().toISOString(),
  });

  return updated;
};

export const changeUserStatus = async (
  repository: UserRepository,
  userId: string,
  nextStatus: 'active' | 'inactive' | 'suspended',
  actorId: string,
): Promise<UserModel> => {
  const current = await repository.getUserById(userId);
  if (!current) {
    throw new Error('User not found');
  }

  const updated = await repository.updateUserStatus(userId, nextStatus);
  if (!updated) {
    throw new Error('Failed to update status');
  }

  const authUser: AuthUserModel = {
    id: `auth-${userId}`,
    userId: userId,
    username: '',
    passwordHash: '',
    role: 'agent',
    status: nextStatus,
    accessToPanel: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await syncAuthIdentityAndDevice(repository, updated, authUser);

  const actorUsername = await resolveActorUsername(repository, actorId);
  await logAuditEvent(repository, 'user', updated.id, 'change_status', actorId, {
    actorUsername,
    newStatus: nextStatus,
  });

  return updated;
};

export const deleteUser = async (
  repository: UserRepository,
  userId: string,
  actorId: string,
): Promise<void> => {
  const current = await repository.getUserById(userId);
  if (!current) {
    throw new Error('User not found');
  }

  const actorUsername = await resolveActorUsername(repository, actorId);
  await repository.deleteUser(userId);

  await logAuditEvent(repository, 'user', userId, 'delete_user', actorId, {
    actorUsername,
    deletedUser: current.fullName,
  });
};

export const buildSessionToken = (userId: string, role: string): string => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: userId, role, iat: Math.floor(Date.now() / 1000) })).toString('base64url');
  const signature = crypto.createHash('sha256').update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
};

export const createSessionRecord = async (repository: UserRepository, token: string, authUserId: string): Promise<void> => {
  if (typeof repository.createSession !== 'function') {
    return;
  }

  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString();
  await repository.createSession({
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    authUserId,
    tokenHash: hashToken(token),
    expiresAt,
    createdAt: now,
    updatedAt: now,
    revokedAt: null,
  });
};

export const revokeSessionToken = async (token: string, repository: UserRepository): Promise<void> => {
  if (typeof repository.revokeSession === 'function') {
    await repository.revokeSession(hashToken(token));
  }
};

export const logLogoutAudit = async (repository: UserRepository, userId: string, actorId: string): Promise<void> => {
  const auditEntry = createAuditEntry('credential', userId, 'logout', actorId, { userId });
  await repository.createAuditLog({
    id: auditEntry.id,
    entityType: auditEntry.entityType,
    entityId: auditEntry.entityId,
    action: auditEntry.action,
    userId: auditEntry.userId,
    details: auditEntry.details,
    createdAt: auditEntry.createdAt,
  });
};

export const verifySessionToken = async (
  token: string,
  repository: UserRepository,
): Promise<{ userId: string; role: string } | { reason: 'invalid' | 'revoked' | 'expired' }> => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { reason: 'invalid' };
  }

  const [header, payload, signature] = parts;
  const expectedSignature = crypto.createHash('sha256').update(`${header}.${payload}`).digest('base64url');
  if (signature !== expectedSignature) {
    return { reason: 'invalid' };
  }

  try {
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { sub?: string; role?: string };
    if (!decodedPayload.sub || !decodedPayload.role) {
      return { reason: 'invalid' };
    }

    if (typeof repository.getSessionByTokenHash !== 'function') {
      return { userId: decodedPayload.sub, role: decodedPayload.role };
    }

    try {
      const session = await repository.getSessionByTokenHash(hashToken(token));
      if (!session) {
        return { userId: decodedPayload.sub, role: decodedPayload.role };
      }
      if (session.revokedAt) {
        return { reason: 'revoked' };
      }
      if (new Date(session.expiresAt) <= new Date()) {
        return { reason: 'expired' };
      }

      return { userId: decodedPayload.sub, role: decodedPayload.role };
    } catch (error) {
      console.warn('[verifySessionToken] Session lookup failed:', error);
      return { userId: decodedPayload.sub, role: decodedPayload.role };
    }
  } catch {
    return { reason: 'invalid' };
  }
};

export const loginUser = async (
  repository: UserRepository,
  username: string,
  password: string,
  actorId: string,
): Promise<{ user: UserProfileModel; sessionToken: string }> => {
  const authUser = typeof repository.getAuthUserByUsername === 'function'
    ? await repository.getAuthUserByUsername(username)
    : null;

  const user = authUser?.userId
    ? await repository.getUserById(authUser.userId)
    : null;

  if (!user || !authUser || authUser.status !== 'active' || !authUser.accessToPanel) {
    throw new Error('Unauthorized');
  }

  const storedPasswordHash = authUser.passwordHash;
  const matches = await passwordMatches(password, storedPasswordHash);

  if (!matches) {
    throw new Error('Unauthorized');
  }

  const nextHashedPassword = await hashPasswordIfNeeded(password);
  const needsPasswordMigration = !isBcryptHash(storedPasswordHash);

  if (needsPasswordMigration && typeof repository.upsertAuthUser === 'function') {
    await repository.upsertAuthUser({
      ...authUser,
      passwordHash: nextHashedPassword,
      updatedAt: new Date().toISOString(),
    });
  }

  await logAuditEvent(repository, 'credential', user.id, 'login', actorId, { username });

  const sessionToken = buildSessionToken(user.id, authUser.role);
  if (typeof repository.createSession === 'function') {
    await createSessionRecord(repository, sessionToken, authUser.id);
  }

  return {
    user,
    sessionToken,
  };
};
