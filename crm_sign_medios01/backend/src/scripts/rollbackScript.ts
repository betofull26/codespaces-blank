#!/usr/bin/env -S node --loader tsx

/**
 * Rollback Script - Emergency disaster recovery
 * 
 * This script is used to rollback the database schema to the previous state
 * in case of migration failures or critical issues.
 * 
 * Usage:
 *   npm run rollback:migration      - Execute rollback migration
 *   npm run rollback:verify-backup  - Verify available backups
 *   npm run rollback:consistency    - Verify data consistency
 *   npm run rollback:history        - Show migration history
 */

import {
  executeRollbackMigration,
  listAvailableBackups,
  verifyDataConsistency,
  getMigrationHistory,
  verifyBackupIntegrity,
} from '../application/rollbackService.js';

const command = process.argv[2];

const execute = async () => {
  try {
    switch (command) {
      case 'migration': {
        console.log('⚠️  Executing rollback migration...');
        const result = await executeRollbackMigration();
        console.log(result.success ? '✅' : '❌', result.message);
        if (result.error) console.error('Error details:', result.error);
        break;
      }

      case 'verify-backup': {
        console.log('🔍 Listing available backups...');
        const backups = await listAvailableBackups();
        if (backups.length === 0) {
          console.log('No backups found');
        } else {
          console.table(backups);
          
          // Verify first backup
          if (backups[0]) {
            console.log(`\n📋 Verifying first backup: ${backups[0].backupId}`);
            const verification = await verifyBackupIntegrity(backups[0].backupId);
            console.log(verification.isValid ? '✅' : '❌', verification.message);
          }
        }
        break;
      }

      case 'consistency': {
        console.log('🔄 Verifying data consistency...');
        const result = await verifyDataConsistency();
        console.log(result.isConsistent ? '✅' : '⚠️ ', result.message);
        console.log('\nData statistics:');
        console.table(result.stats);
        break;
      }

      case 'history': {
        console.log('📜 Migration history (last 50 entries)...');
        const history = await getMigrationHistory(50);
        if (history.length === 0) {
          console.log('No migration history found');
        } else {
          console.table(history.slice(0, 20));
          console.log(`\n(Showing 20 of ${history.length} entries)`);
        }
        break;
      }

      default:
        console.log('Rollback utilities for disaster recovery\n');
        console.log('Available commands:');
        console.log('  migration        - Execute rollback migration (CAUTION: Reverses schema changes)');
        console.log('  verify-backup    - List and verify available backups');
        console.log('  consistency      - Verify data consistency after migration');
        console.log('  history          - Show migration and backup history\n');
        console.log('Usage: node rollbackScript.ts <command>');
    }
  } catch (err) {
    console.error('❌ Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
};

void execute();
