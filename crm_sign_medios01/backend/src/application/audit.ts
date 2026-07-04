export interface RoleHistoryEntry {
  id: string;
  userId: string;
  previousRole: string;
  newRole: string;
  changedBy: string;
  changedAt: string;
  reason: string;
}

export interface AuditEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  details: string;
  createdAt: string;
}

export const createRoleHistoryEntry = (
  userId: string,
  previousRole: string,
  newRole: string,
  changedBy: string,
  reason: string,
): RoleHistoryEntry => ({
  id: `role-history-${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  userId,
  previousRole,
  newRole,
  changedBy,
  changedAt: new Date().toISOString(),
  reason,
});

export const createAuditEntry = (
  entityType: string,
  entityId: string,
  action: string,
  performedBy: string,
  details: Record<string, unknown>,
): AuditEntry => ({
  id: `audit-${entityId}-${action}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  entityType,
  entityId,
  action,
  performedBy,
  details: JSON.stringify(details),
  createdAt: new Date().toISOString(),
});
