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

export const createUser = async (
  repository: UserRepository,
  user: UserModel,
  actorId: string,
): Promise<UserModel> => {
  try {
    // Generate ID and timestamps if not provided
    const now = new Date().toISOString();
    const userId = user.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Hash password
    const passwordHash = await bcrypt.hash(user.passwordHash, 10);
    
    // Create user with all required fields
    const userToCreate: UserModel = {
      ...user,
      id: userId,
      passwordHash,
      createdAt: user.createdAt || now,
      updatedAt: user.updatedAt || now,
    };
    
    console.log('[createUser] Creating user:', { id: userToCreate.id, email: userToCreate.email, username: userToCreate.username });
    
    const created = await repository.createUser(userToCreate);
    console.log('[createUser] User created successfully');

    // Upsert credentials if has panel access
    if (created.accessToPanel) {
      console.log('[createUser] Upserting credentials for user:', created.id);
      await repository.upsertCredentials({
        id: `cred-${created.id}`,
        userId: created.id,
        username: created.username,
        passwordHash,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      } as UserCredentialsModel);
      console.log('[createUser] Credentials upserted successfully');
    }

    // Create audit log
    console.log('[createUser] Creating audit log');
    await repository.createAuditLog({
      id: `audit-${created.id}`,
      entityType: 'user',
      entityId: created.id,
      action: 'create_user',
      performedBy: actorId,
      details: JSON.stringify({ role: created.role, accessToPanel: created.accessToPanel }),
      createdAt: created.createdAt,
    });
    console.log('[createUser] Audit log created successfully');

    return created;
  } catch (error) {
    console.error('[createUser] Error:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
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
    id: `audit-role-${updated.id}`,
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

  const updated = await repository.updateUser(user);

  await repository.createAuditLog({
    id: `audit-update-${updated.id}`,
    entityType: 'user',
    entityId: updated.id,
    action: 'update_user',
    performedBy: actorId,
    details: JSON.stringify({ previousEmail: current.email, newEmail: updated.email }),
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
  const passwordMatches = credentials
    ? await bcrypt.compare(password, credentials.passwordHash)
    : await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new Error('Unauthorized');
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
