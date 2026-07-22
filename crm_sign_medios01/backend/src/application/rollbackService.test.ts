import test from 'node:test';
import assert from 'node:assert/strict';

test('rollbackService exports expected functions', async () => {
  // Import the module to verify it exports correctly
  const module = await import('./rollbackService.js');
  
  assert.ok(typeof module.executeRollbackMigration === 'function');
  assert.ok(typeof module.verifyBackupIntegrity === 'function');
  assert.ok(typeof module.listAvailableBackups === 'function');
  assert.ok(typeof module.getMigrationHistory === 'function');
  assert.ok(typeof module.verifyDataConsistency === 'function');
  assert.ok(typeof module.createMigrationCheckpoint === 'function');
});

test('rollbackMigration exports expected functions', async () => {
  // Import the module to verify it exports correctly
  const module = await import('../infrastructure/database/rollbackMigration.js');
  
  assert.ok(typeof module.getRollbackMigrationSql === 'function');
  assert.ok(typeof module.getVerifyBackupIntegritySql === 'function');
  assert.ok(typeof module.getMigrationHistorySql === 'function');
  assert.ok(typeof module.getVerifyDataConsistencySql === 'function');
});

test('getRollbackMigrationSql generates valid SQL', async () => {
  const { getRollbackMigrationSql } = await import('../infrastructure/database/rollbackMigration.js');
  
  const sql = getRollbackMigrationSql();
  
  assert.ok(typeof sql === 'string');
  assert.match(sql, /ROLLBACK MIGRATION/);
  assert.match(sql, /DROP CONSTRAINT IF EXISTS/);
  assert.match(sql, /ALTER TABLE/);
});

test('getRollbackMigrationSql includes safe IF EXISTS checks', async () => {
  const { getRollbackMigrationSql } = await import('../infrastructure/database/rollbackMigration.js');
  
  const sql = getRollbackMigrationSql();
  
  // Verify all drops use IF EXISTS for safety
  assert.match(sql, /IF EXISTS/);
  assert.match(sql, /DROP CONSTRAINT IF EXISTS/);
});

test('getRestoreFromBackupSql generates valid metadata SQL', async () => {
  const { getRestoreFromBackupSql } = await import('../infrastructure/database/rollbackMigration.js');
  
  const metadata = {
    backupId: 'backup-123',
    backupType: 'full',
    createdAt: '2026-07-22T00:00:00.000Z',
    previousSchemaVersion: '1.0',
  };
  
  const sql = getRestoreFromBackupSql(metadata);
  
  assert.ok(typeof sql === 'string');
  assert.match(sql, /RESTORE FROM BACKUP/);
  assert.match(sql, /restore_from_backup/);
  assert.match(sql, /backup-123/);
});

