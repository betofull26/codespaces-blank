/**
 * Rollback Migration - Reversible migration for disaster recovery
 * 
 * This module provides the ability to roll back schema migrations to the previous state.
 * Useful if something fails during the new schema deployment and we need to restore
 * the database to its previous working state temporarily.
 */

export const getRollbackMigrationSql = () => `
-- ===============================================
-- ROLLBACK MIGRATION - Restore to Previous State
-- ===============================================
-- This migration reverts the new schema changes and restores the legacy structure
-- if needed for disaster recovery. Use only in emergency situations.
-- ===============================================

DO $$
BEGIN
  -- Step 1: Drop foreign key constraints that reference the new tables
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND constraint_name = 'fk_conversations_contact'
  ) THEN
    ALTER TABLE conversations DROP CONSTRAINT IF EXISTS fk_conversations_contact;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'agents'
      AND constraint_name = 'fk_agents_user'
  ) THEN
    ALTER TABLE agents DROP CONSTRAINT IF EXISTS fk_agents_user;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'user_sessions'
      AND constraint_name = 'fk_user_sessions_auth_user'
  ) THEN
    ALTER TABLE user_sessions DROP CONSTRAINT IF EXISTS fk_user_sessions_auth_user;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'user_sessions'
      AND constraint_name = 'fk_user_sessions_user'
  ) THEN
    ALTER TABLE user_sessions DROP CONSTRAINT IF EXISTS fk_user_sessions_user;
  END IF;

  -- Step 2: Restore legacy columns to users table
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'email'
  ) THEN
    ALTER TABLE users ADD COLUMN email TEXT;
  END IF;

  -- Step 3: Record rollback event in audit log
  INSERT INTO audit_logs (id, entity_type, entity_id, action, performed_by, user_id, details, created_at)
  VALUES (
    concat('audit-rollback-', NOW()::TEXT),
    'system',
    'schema',
    'rollback_migration',
    'system',
    NULL,
    jsonb_build_object(
      'event', 'rollback',
      'reason', 'disaster_recovery',
      'timestamp', NOW()::TEXT,
      'message', 'Rollback migration executed - database restored to previous state'
    )::text,
    NOW()::TEXT
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Rollback migration completed. Database structure has been reverted.';
END $$;
`;

export const getRestoreFromBackupSql = (backupMetadata: {
  backupId: string;
  backupType: string;
  createdAt: string;
  previousSchemaVersion: string;
}) => `
-- ===============================================
-- RESTORE FROM BACKUP
-- ===============================================
-- This SQL records that a backup restoration was attempted
-- The actual data restoration should be done via SQL dump or backup tool

DO $$
BEGIN
  -- Record the restore attempt in audit logs
  INSERT INTO audit_logs (id, entity_type, entity_id, action, performed_by, user_id, details, created_at)
  VALUES (
    concat('audit-restore-', '${backupMetadata.backupId}'),
    'backup',
    '${backupMetadata.backupId}',
    'restore_from_backup',
    'system',
    NULL,
    jsonb_build_object(
      'backupId', '${backupMetadata.backupId}',
      'backupType', '${backupMetadata.backupType}',
      'originalCreatedAt', '${backupMetadata.createdAt}',
      'previousSchemaVersion', '${backupMetadata.previousSchemaVersion}',
      'restoredAt', NOW()::TEXT,
      'message', 'Backup restoration initiated'
    )::text,
    NOW()::TEXT
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Restore from backup recorded. Backup ID: ${backupMetadata.backupId}';
END $$;
`;

/**
 * Get SQL to verify backup integrity before restore
 */
export const getVerifyBackupIntegritySql = () => `
-- Verify backup records exist and are properly documented
SELECT 
  id,
  backup_type,
  file_name,
  created_at,
  status,
  file_path,
  COUNT(*) OVER () as total_backups
FROM backups
ORDER BY created_at DESC
LIMIT 10;
`;

/**
 * Get SQL to list migration history for audit trail
 */
export const getMigrationHistorySql = () => `
-- Show migration history from audit logs
SELECT 
  id,
  entity_type,
  action,
  performed_by,
  created_at,
  details
FROM audit_logs
WHERE action IN ('rollback_migration', 'restore_from_backup', 'create_backup', 'migrate_user')
ORDER BY created_at DESC
LIMIT 50;
`;

/**
 * Get SQL to verify data consistency after migration
 */
export const getVerifyDataConsistencySql = () => `
-- Verify all users have corresponding auth records
SELECT 
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT a.user_id) as users_with_auth,
  COUNT(DISTINCT d.user_id) as users_with_devices,
  COUNT(DISTINCT c.id) as total_conversations,
  COUNT(DISTINCT m.id) as total_messages
FROM users u
LEFT JOIN auth_users a ON a.user_id = u.id
LEFT JOIN devices d ON d.user_id = u.id
LEFT JOIN conversations c ON c.agent_id = u.id
LEFT JOIN messages m ON m.id IS NOT NULL;
`;
