import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import bcrypt from 'bcrypt';
import { getDataBackfillSql, getLegacySchemaCleanupSql, getUserSchemaMigrationSql } from './init.js';

test('default admin seed uses a bcrypt hash that matches the secret password', async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const sql = await fs.readFile(path.resolve(__dirname, 'init.sql'), 'utf8');

  const match = sql.match(/\('user-admin-1', 'Administrador', 'admin', '([^']+)', 'admin', 'active', TRUE/);
  assert.ok(match?.[1], 'Expected the default admin seed hash in init.sql');

  const hash = match?.[1] ?? '';
  assert.match(hash, /^\$2b\$/);
  assert.equal(await bcrypt.compare('secret', hash), true);
});

test('initialization script creates the new auth and device tables needed for the upgraded schema', async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const sql = await fs.readFile(path.resolve(__dirname, 'init.sql'), 'utf8');

  assert.match(sql, /CREATE TABLE IF NOT EXISTS auth_users/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS devices/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS media_files/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS user_sessions/i);
});

test('messages table includes the created_at column required by the new schema validation', async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const sql = await fs.readFile(path.resolve(__dirname, 'init.sql'), 'utf8');

  assert.match(sql, /ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at TEXT NOT NULL DEFAULT now\(\)::text/i);
});

test('user schema migration includes real data migration into auth_users, devices and audit_logs', () => {
  const migrationSql = getUserSchemaMigrationSql();

  assert.match(migrationSql, /INSERT INTO auth_users/i);
  assert.match(migrationSql, /FROM users/i);
  assert.match(migrationSql, /ON CONFLICT \(user_id\) DO UPDATE/i);
  assert.match(migrationSql, /INSERT INTO devices/i);
  assert.match(migrationSql, /INSERT INTO audit_logs/i);
});

test('schema migration normalizes contacts and conversations around users', () => {
  const migrationSql = getUserSchemaMigrationSql();

  assert.match(migrationSql, /ALTER TABLE contacts[^\n]*REFERENCES users\(id\)/i);
  assert.match(migrationSql, /ALTER TABLE conversations[^\n]*REFERENCES users\(id\)/i);
});

test('schema migration backfills contacts and message fields from existing records', () => {
  const migrationSql = getDataBackfillSql();

  assert.match(migrationSql, /INSERT INTO contacts/i);
  assert.match(migrationSql, /FROM conversations/i);
  assert.match(migrationSql, /UPDATE messages/i);
  assert.match(migrationSql, /INSERT INTO user_sessions/i);
});

test('legacy schema cleanup removes obsolete tables and columns', () => {
  const cleanupSql = getLegacySchemaCleanupSql();

  assert.match(cleanupSql, /ALTER TABLE users DROP COLUMN IF EXISTS email/i);
  assert.match(cleanupSql, /DROP TABLE IF EXISTS migration_verifications/i);
  assert.match(cleanupSql, /DROP TABLE IF EXISTS media_files/i);
});

test('data backfill registers verification rows for migrated records', () => {
  const migrationSql = getDataBackfillSql();

  assert.match(migrationSql, /INSERT INTO migration_verifications/i);
  assert.match(migrationSql, /table_name/i);
  assert.match(migrationSql, /status/i);
});

test('user schema migration keeps the new auth and device tables aligned with the new model', () => {
  const migrationSql = getUserSchemaMigrationSql();

  assert.match(migrationSql, /INSERT INTO auth_users/i);
  assert.match(migrationSql, /INSERT INTO devices/i);
  assert.match(migrationSql, /INSERT INTO audit_logs/i);
});
