/**
 * Rollback Service - Handle database rollback and recovery operations
 */

import { getDatabaseClient } from '../infrastructure/database/connection.js';
import { getRollbackMigrationSql, getVerifyBackupIntegritySql, getMigrationHistorySql, getVerifyDataConsistencySql } from '../infrastructure/database/rollbackMigration.js';

export interface BackupMetadata {
  backupId: string;
  backupType: string;
  fileName: string;
  createdAt: string;
  filePath: string;
  status: 'success' | 'failed' | 'pending';
}

export interface RollbackResult {
  success: boolean;
  message: string;
  timestamp: string;
  backupUsed?: BackupMetadata;
  error?: string;
}

/**
 * Execute rollback migration - Reverts schema to previous state
 * WARNING: This should only be used in disaster recovery scenarios
 */
export const executeRollbackMigration = async (): Promise<RollbackResult> => {
  const db = await getDatabaseClient();
  
  try {
    const rollbackSql = getRollbackMigrationSql();
    await db.query(rollbackSql);
    
    return {
      success: true,
      message: 'Rollback migration executed successfully. Database schema has been reverted to previous state.',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      message: 'Rollback migration failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Verify backup integrity before attempting restore
 */
export const verifyBackupIntegrity = async (backupId: string): Promise<{
  isValid: boolean;
  backup: BackupMetadata | null;
  message: string;
}> => {
  const db = await getDatabaseClient();
  
  try {
    // Check if backup record exists
    const result = (await db.query(
      'SELECT * FROM backups WHERE id = $1',
      [backupId]
    )) as any[];

    if (result.length === 0) {
      return {
        isValid: false,
        backup: null,
        message: `Backup with ID ${backupId} not found`,
      };
    }

    const backup = result[0];

    // Verify backup file exists (if file_path is set)
    if (backup.file_path) {
      try {
        const fs = await import('node:fs/promises');
        await fs.access(backup.file_path);
      } catch {
        return {
          isValid: false,
          backup,
          message: `Backup file not found at path: ${backup.file_path}`,
        };
      }
    }

    return {
      isValid: true,
      backup,
      message: `Backup ${backupId} is valid and ready for restoration`,
    };
  } catch (error) {
    return {
      isValid: false,
      backup: null,
      message: `Error verifying backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * List available backups for recovery
 */
export const listAvailableBackups = async (): Promise<BackupMetadata[]> => {
  const db = await getDatabaseClient();
  
  try {
    const results = (await db.query(
      `SELECT id, backup_type AS backupType, file_name AS fileName, created_at AS createdAt, 
              file_path AS filePath, status
       FROM backups
       WHERE status = 'success'
       ORDER BY created_at DESC
       LIMIT 20`
    )) as any[];

    return results.map(row => ({
      backupId: row.id,
      backupType: row.backupType,
      fileName: row.fileName,
      createdAt: row.createdAt,
      filePath: row.filePath,
      status: row.status,
    }));
  } catch (error) {
    console.error('Error listing backups:', error);
    return [];
  }
};

/**
 * Get migration history for audit trail
 */
export const getMigrationHistory = async (limit: number = 50): Promise<Array<{
  id: string;
  entityType: string;
  action: string;
  performedBy: string;
  createdAt: string;
  details: string;
}>> => {
  const db = await getDatabaseClient();
  
  try {
    return (await db.query(getMigrationHistorySql())) as any[];
  } catch (error) {
    console.error('Error getting migration history:', error);
    return [];
  }
};

/**
 * Verify data consistency after migration
 */
export const verifyDataConsistency = async (): Promise<{
  isConsistent: boolean;
  stats: {
    totalUsers: number;
    usersWithAuth: number;
    usersWithDevices: number;
    totalConversations: number;
    totalMessages: number;
  };
  message: string;
}> => {
  const db = await getDatabaseClient();
  
  try {
    const results = (await db.query(getVerifyDataConsistencySql())) as any[];
    const stats = results[0];

    // Check if all users have auth records
    const isConsistent = stats.total_users === stats.users_with_auth;

    return {
      isConsistent,
      stats: {
        totalUsers: stats.total_users || 0,
        usersWithAuth: stats.users_with_auth || 0,
        usersWithDevices: stats.users_with_devices || 0,
        totalConversations: stats.total_conversations || 0,
        totalMessages: stats.total_messages || 0,
      },
      message: isConsistent 
        ? 'Data consistency verified - all users have auth records'
        : `Data inconsistency detected - ${stats.total_users - stats.users_with_auth} users missing auth records`,
    };
  } catch (error) {
    return {
      isConsistent: false,
      stats: {
        totalUsers: 0,
        usersWithAuth: 0,
        usersWithDevices: 0,
        totalConversations: 0,
        totalMessages: 0,
      },
      message: `Error verifying data consistency: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * Create a pre-migration checkpoint by recording current state
 */
export const createMigrationCheckpoint = async (
  checkpointType: string,
  description: string
): Promise<{ checkpointId: string; timestamp: string }> => {
  const db = await getDatabaseClient();
  const checkpointId = `checkpoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    await db.query(
      `INSERT INTO audit_logs (id, entity_type, entity_id, action, performed_by, user_id, details, created_at)
       VALUES ($1, 'checkpoint', 'schema', $2, 'system', NULL, $3, NOW()::TEXT)
       ON CONFLICT (id) DO NOTHING`,
      [
        checkpointId,
        `checkpoint_${checkpointType}`,
        JSON.stringify({
          checkpointType,
          description,
          createdAt: new Date().toISOString(),
        }),
      ]
    );

    return {
      checkpointId,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Failed to create migration checkpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
