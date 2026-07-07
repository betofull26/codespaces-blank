export type UserRole = 'admin' | 'supervisor' | 'agent';

const isAgent = (role: UserRole): boolean => role === 'agent';

export const canAccessAdminModule = (role: UserRole): boolean => !isAgent(role) && (role === 'admin' || role === 'supervisor');

export const canManageUsers = (role: UserRole): boolean => role === 'admin';

export const canManageDevices = (role: UserRole): boolean => role === 'admin';

export const ensureAuthorized = (role: UserRole, action: 'manage-users' | 'view-users' | 'access-admin' | 'manage-backups' | 'view-backups' | 'manage-devices' | 'view-audit-logs' | 'manage-templates'): void => {
  if (action === 'manage-users' && !canManageUsers(role)) {
    throw new Error('Unauthorized');
  }

  if (action === 'access-admin' && !canAccessAdminModule(role)) {
    throw new Error('Unauthorized');
  }

  if (action === 'view-users' && isAgent(role)) {
    throw new Error('Unauthorized');
  }

  if (action === 'manage-backups' && role !== 'admin') {
    throw new Error('Unauthorized');
  }

  if (action === 'view-backups' && role === 'agent') {
    throw new Error('Unauthorized');
  }

  if (isAgent(role) && (action === 'access-admin' || action === 'manage-users' || action === 'view-users' || action === 'manage-devices')) {
    throw new Error('Unauthorized');
  }

  if (action === 'manage-devices' && !canManageDevices(role)) {
    throw new Error('Unauthorized');
  }

  if ((action === 'view-audit-logs' || action === 'manage-templates') && isAgent(role)) {
    throw new Error('Unauthorized');
  }
};
