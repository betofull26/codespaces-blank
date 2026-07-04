import bcrypt from 'bcrypt';
import type { UserModel, UserCredentialsModel } from '../domain/models.js';
import type { UserRepository } from '../domain/repositories.js';
import { createAuditEntry, createRoleHistoryEntry } from './audit.js';

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

export const createUser = async (
  repository: UserRepository,
  user: UserModel,
  actorId: string,
): Promise<UserModel> => {
  const now = new Date().toISOString();
  const userId = user.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const passwordHash = await hashPasswordIfNeeded(user.passwordHash);

  const userToCreate: UserModel = {
    ...user,
    id: userId,
    passwordHash,
    createdAt: user.createdAt || now,
    updatedAt: user.updatedAt || now,
  };

  const created = await repository.createUser(userToCreate);

  if (created.accessToPanel) {
    await repository.upsertCredentials({
      id: `cred-${created.id}`,
      userId: created.id,
      username: created.username,
      passwordHash,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    } as UserCredentialsModel);
  }

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

  if (updated.role === 'agent') {
    await repository.upsertCredentials({
      id: `cred-${updated.id}`,
      userId: updated.id,
      username: updated.username,
      passwordHash: updated.passwordHash,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    } as UserCredentialsModel);
  }

  const roleHistoryEntry = createRoleHistoryEntry(updated.id, current.role, updated.role, actorId, 'Cambio de rol');
  await repository.createAuditLog({
    id: `audit-role-${updated.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    entityType: 'user',
    entityId: updated.id,
    action: 'change_role',
    performedBy: actorId,
    details: JSON.stringify({ previousRole: current.role, newRole: updated.role, historyId: roleHistoryEntry.id }),
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

  await repository.createAuditLog({
    id: `audit-update-${updated.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    entityType: 'user',
    entityId: updated.id,
    action: 'update_user',
    performedBy: actorId,
    details: JSON.stringify({ previousUsername: current.username, newUsername: updated.username }),
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

  const auditEntry = createAuditEntry('user', updated.id, 'change_status', actorId, { previousStatus: current.status, newStatus: updated.status });
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

  await repository.deleteUser(userId);

  const auditEntry = createAuditEntry('user', userId, 'delete_user', actorId, {
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

export const loginUser = async (
  repository: UserRepository,
  username: string,
  password: string,
  actorId: string,
): Promise<{ user: UserModel; sessionToken: string }> => {
  const user = await repository.getUserByUsername(username);
  if (!user || user.status !== 'active' || !user.accessToPanel) {
    throw new Error('Unauthorized');
  }

  const credentials = await repository.getCredentialsByUsername(username);
  const matches = await Promise.all([
    passwordMatches(password, user.passwordHash),
    passwordMatches(password, credentials?.passwordHash),
  ]);

  if (!matches.some(Boolean)) {
    throw new Error('Unauthorized');
  }

  const nextHashedPassword = await hashPasswordIfNeeded(password);
  const needsPasswordMigration = !isBcryptHash(user.passwordHash) || (credentials?.passwordHash ? !isBcryptHash(credentials.passwordHash) : false);

  if (needsPasswordMigration) {
    await repository.updateUser({
      ...user,
      passwordHash: nextHashedPassword,
      updatedAt: new Date().toISOString(),
    });

    await repository.upsertCredentials({
      id: credentials?.id ?? `cred-${user.id}`,
      userId: user.id,
      username: user.username,
      passwordHash: nextHashedPassword,
      createdAt: credentials?.createdAt ?? user.createdAt,
      updatedAt: new Date().toISOString(),
    } as UserCredentialsModel);
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

  return {
    user,
    sessionToken: `token-${user.id}`,
  };
};
