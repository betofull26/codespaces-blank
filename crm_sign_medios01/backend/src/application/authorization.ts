export type UserRole = 'admin' | 'supervisor' | 'agent';

export const canAccessAdminModule = (role: UserRole): boolean => role === 'admin' || role === 'supervisor';

export const canManageUsers = (role: UserRole): boolean => role === 'admin';

export const canManageDevices = (role: UserRole): boolean => role === 'admin';

export const ensureAuthorized = (role: UserRole, action: 'manage-users' | 'view-users' | 'access-admin' | 'manage-backups' | 'view-backups' | 'manage-devices'): void => {
  if (action === 'manage-users' && !canManageUsers(role)) {
    throw new Error('Unauthorized');
  }

  if (action === 'access-admin' && !canAccessAdminModule(role)) {
    throw new Error('Unauthorized');
  }

  if (action === 'view-users' && role === 'agent') {
    throw new Error('Unauthorized');
  }

  if ((action === 'manage-backups' || action === 'view-backups') && role !== 'admin') {
    throw new Error('Unauthorized');
  }

  if (action === 'manage-devices' && !canManageDevices(role)) {
    throw new Error('Unauthorized');
  }
};
