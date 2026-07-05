import test from 'node:test';
import assert from 'node:assert/strict';
import { backupExportQueries, createBackupsTableSql } from './backupSql.js';

test('createBackupsTableSql creates the backups table', () => {
  assert.match(createBackupsTableSql, /CREATE TABLE IF NOT EXISTS backups/i);
  assert.match(createBackupsTableSql, /backup_type/i);
  assert.match(createBackupsTableSql, /file_name/i);
  assert.match(createBackupsTableSql, /status/i);
});

test('backup export queries cover agents, conversations and messages', () => {
  assert.deepEqual(Object.keys(backupExportQueries), ['agents', 'conversations', 'messages']);

  const agentsQuery = backupExportQueries.agents.sql.toLowerCase();
  const conversationsQuery = backupExportQueries.conversations.sql.toLowerCase();
  const messagesQuery = backupExportQueries.messages.sql.toLowerCase();

  assert.match(agentsQuery, /from agents/i);
  assert.match(conversationsQuery, /from conversations/i);
  assert.match(messagesQuery, /from messages/i);
});
