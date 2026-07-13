import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import type { UserModel } from '../domain/models.js';
import type { UserRepository } from '../domain/repositories.js';
import { createAuditEntry, createRoleHistoryEntry } from './audit.js';
import { getDatabaseClient } from '../infrastructure/database/connection.js';

const hashToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');

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

export const createUser = async (
  repository: UserRepository,
  user: UserModel,
  actorId: string,
): Promise<UserModel> => {
  const now = new Date().toISOString();
  const userId = user.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const passwordHash = await hashPasswordIfNeeded(user.passwordHash);

  // Generate username for agents if empty
  const roleLower = user.role?.toLowerCase?.();
  const isAgent = roleLower === 'agente' || roleLower === 'agent';
  const generatedUsername = !user.username || !user.username.trim() 
    ? (isAgent ? `agent_${userId.replace(/[^a-z0-9]/g, '')}` : user.username)
    : user.username;

  const userToCreate: UserModel = {
    ...user,
    id: userId,
    username: generatedUsername,
    passwordHash,
    createdAt: user.createdAt || now,
    updatedAt: user.updatedAt || now,
  };

  const created = await repository.createUser(userToCreate);

  // If the user is created with role "Agente" or "agent", also create an agent record
  if (isAgent && created.id) {
    const db = await getDatabaseClient();
    await db.query(
      'INSERT INTO agents (id, name, role, online) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
      [created.id, created.fullName, 'agent', false]
    );
  }

  const actorUsername = await resolveActorUsername(repository, actorId);

  const auditEntry = createAuditEntry('user', created.id, 'create_user', actorId, {
    actorUsername,
    username: created.username,
    fullName: created.fullName,
    role: created.role,
    accessToPanel: created.accessToPanel,
  });

  await repository.createAuditLog({
    id: auditEntry.id,
    entityType: auditEntry.entityType,
    entityId: auditEntry.entityId,
    action: auditEntry.action,
    performedBy: auditEntry.performedBy,
    details: auditEntry.details,
    createdAt: auditEntry.createdAt,
  });

  return created;
};

export const changeUserRole = async (
  repository: UserRepository,
  userId: string,
  nextRole: UserModel['role'],
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

  // If the role is changed to "Agente", create or update the agent record
  const roleLower = nextRole?.toLowerCase?.();
  if ((roleLower === 'agente' || roleLower === 'agent') && updated.id) {
    const db = await getDatabaseClient();
    // Check if agent already exists
    const existingAgent = await db.query('SELECT id FROM agents WHERE id = $1', [updated.id]);
    
    if (!existingAgent || existingAgent.length === 0) {
      // Create new agent record
      await db.query(
        'INSERT INTO agents (id, name, role, online) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
        [updated.id, updated.fullName, 'agent', false]
      );
    }
  }

  const actorUsername = await resolveActorUsername(repository, actorId);
  const targetUserLabel = resolveUserLabel(updated);
  const roleHistoryEntry = createRoleHistoryEntry(updated.id, current.role, updated.role, actorId, 'Cambio de rol');
  await repository.createAuditLog({
    id: `audit-role-${updated.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    entityType: 'user',
    entityId: updated.id,
    action: 'change_role',
    performedBy: actorId,
    details: JSON.stringify({
      actorUsername,
      targetUserLabel,
      previousRole: current.role,
      newRole: updated.role,
      historyId: roleHistoryEntry.id,
    }),
    createdAt: updated.updatedAt,
  });

  return updated;
};

export const updateUser = async (
  repository: UserRepository,
  user: UserModel,
  actorId: string,
): Promise<UserModel> => {
  const current = await repository.getUserById(user.id);
  if (!current) {
    throw new Error('User not found');
  }

  const passwordHash = await hashPasswordIfNeeded(user.passwordHash);

  const userToUpdate: UserModel = {
    ...user,
    passwordHash,
    updatedAt: new Date().toISOString(),
  };

  const updated = await repository.updateUser(userToUpdate);
  const actorUsername = await resolveActorUsername(repository, actorId);

  await repository.createAuditLog({
    id: `audit-update-${updated.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    entityType: 'user',
    entityId: updated.id,
    action: 'update_user',
    performedBy: actorId,
    details: JSON.stringify({
      actorUsername,
      previousUsername: current.username,
      newUsername: updated.username,
    }),
    createdAt: updated.updatedAt,
  });

  return updated;
};

export const changeUserStatus = async (
  repository: UserRepository,
  userId: string,
  nextStatus: UserModel['status'],
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

  const actorUsername = await resolveActorUsername(repository, actorId);
  const auditEntry = createAuditEntry('user', updated.id, 'change_status', actorId, {
    actorUsername,
    previousStatus: current.status,
    newStatus: updated.status,
  });
  await repository.createAuditLog({
    id: auditEntry.id,
    entityType: auditEntry.entityType,
    entityId: auditEntry.entityId,
    action: auditEntry.action,
    performedBy: auditEntry.performedBy,
    details: auditEntry.details,
    createdAt: auditEntry.createdAt,
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
  const targetUserLabel = resolveUserLabel(current);
  await repository.deleteUser(userId);

  const auditEntry = createAuditEntry('user', userId, 'delete_user', actorId, {
    actorUsername,
    targetUserLabel,
    deletedUser: current.fullName,
    previousRole: current.role,
    previousStatus: current.status,
    accessToPanelRevoked: current.accessToPanel,
  });

  await repository.createAuditLog({
    id: auditEntry.id,
    entityType: auditEntry.entityType,
    entityId: auditEntry.entityId,
    action: auditEntry.action,
    performedBy: auditEntry.performedBy,
    details: auditEntry.details,
    createdAt: auditEntry.createdAt,
  });
};

export const buildSessionToken = (userId: string, role: string): string => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: userId, role, iat: Math.floor(Date.now() / 1000) })).toString('base64url');
  const signature = crypto.createHash('sha256').update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
};

export const createSessionRecord = async (repository: UserRepository, token: string, userId: string, role: UserModel['role']): Promise<void> => {
  if (typeof repository.createSession !== 'function') {
    return;
  }

  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString();
  await repository.createSession({
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    userId,
    tokenHash: hashToken(token),
    role,
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
  } catch {
    return { reason: 'invalid' };
  }
};

export const loginUser = async (
  repository: UserRepository,
  username: string,
  password: string,
  actorId: string,
): Promise<{ user: Omit<UserModel, 'passwordHash'>; sessionToken: string }> => {
  const user = await repository.getUserByUsername(username);
  if (!user || user.status !== 'active' || !user.accessToPanel) {
    throw new Error('Unauthorized');
  }

  const matches = await passwordMatches(password, user.passwordHash);

  if (!matches) {
    throw new Error('Unauthorized');
  }

  const nextHashedPassword = await hashPasswordIfNeeded(password);
  const needsPasswordMigration = !isBcryptHash(user.passwordHash);

  if (needsPasswordMigration) {
    await repository.updateUser({
      ...user,
      passwordHash: nextHashedPassword,
      updatedAt: new Date().toISOString(),
    });
  }

  const auditEntry = createAuditEntry('credential', user.id, 'login', actorId, { username });
  await repository.createAuditLog({
    id: auditEntry.id,
    entityType: auditEntry.entityType,
    entityId: auditEntry.entityId,
    action: auditEntry.action,
    performedBy: auditEntry.performedBy,
    details: auditEntry.details,
    createdAt: auditEntry.createdAt,
  });

  const { passwordHash: _passwordHash, ...safeUser } = user;
  const sessionToken = buildSessionToken(user.id, user.role);
  await createSessionRecord(repository, sessionToken, user.id, user.role);

  return {
    user: safeUser,
    sessionToken,
  };
};
