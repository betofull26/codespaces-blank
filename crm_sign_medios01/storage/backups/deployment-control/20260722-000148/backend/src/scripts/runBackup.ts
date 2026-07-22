#!/usr/bin/env -S node --loader tsx
import { createBackup } from '../application/backupService.js';

(async () => {
  try {
    const result = await createBackup('chats');
    console.log('Backup created:', result);
  } catch (err) {
    console.error('Backup failed:', err);
    process.exit(1);
  }
})();
