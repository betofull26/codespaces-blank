import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCsvContent, createBackupFileName } from './backupService.js';

test('buildCsvContent escapes commas and quotes', () => {
  const rows = [{ id: '1', name: 'Ana, "Pérez"' }];
  const csv = buildCsvContent(rows, ['id', 'name']);

  assert.match(csv, /"Ana, ""Pérez"""/);
});

test('createBackupFileName includes the backup type and timestamp', () => {
  const fileName = createBackupFileName('chats', new Date('2026-07-05T12:34:56.000Z'));

  assert.match(fileName, /^backup-20260705-123456-chats\.zip$/);
});
