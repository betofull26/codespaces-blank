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

  const match = sql.match(/'admin', '([^']+)', 'admin', 'active', TRUE/i);
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

test('users keeps only personal profile columns while auth_users stores access credentials', async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const sql = await fs.readFile(path.resolve(__dirname, 'init.sql'), 'utf8');

  const usersBlock = sql.match(/CREATE TABLE IF NOT EXISTS users \([\s\S]*?\n\);/i)?.[0] ?? '';
  assert.ok(usersBlock, 'Expected the users table definition in init.sql');

  assert.match(usersBlock, /full_name TEXT NOT NULL/i);
  assert.match(usersBlock, /position TEXT/i);
  assert.match(usersBlock, /entry_date/i);
  assert.match(usersBlock, /foto TEXT/i);
  assert.match(usersBlock, /initials TEXT/i);
  assert.match(usersBlock, /online BOOLEAN NOT NULL DEFAULT FALSE/i);
  assert.match(usersBlock, /created_at TIMESTAMP WITH TIME ZONE NOT NULL/i);
  assert.match(usersBlock, /updated_at TIMESTAMP WITH TIME ZONE NOT NULL/i);
  assert.doesNotMatch(usersBlock, /username TEXT NOT NULL UNIQUE/i);
  assert.doesNotMatch(usersBlock, /password_hash TEXT NOT NULL/i);
  assert.doesNotMatch(usersBlock, /role TEXT NOT NULL/i);
  assert.doesNotMatch(usersBlock, /status TEXT NOT NULL DEFAULT 'active'/i);
  assert.doesNotMatch(usersBlock, /access_to_panel BOOLEAN NOT NULL DEFAULT FALSE/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS auth_users/i);
  assert.match(sql, /id UUID PRIMARY KEY/i);
  assert.match(sql, /user_id UUID NOT NULL UNIQUE/i);
  assert.match(sql, /role TEXT NOT NULL DEFAULT 'agent' CHECK \(role IN \('admin', 'supervisor', 'agent'\)\)/i);
  assert.match(sql, /status TEXT NOT NULL DEFAULT 'active' CHECK \(status IN \('active', 'inactive', 'suspended'\)\)/i);
  assert.match(sql, /created_at TIMESTAMP WITH TIME ZONE NOT NULL/i);
  assert.match(sql, /updated_at TIMESTAMP WITH TIME ZONE/i);
});

test('contacts and conversations use user_id relationships with users', async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const sql = await fs.readFile(path.resolve(__dirname, 'init.sql'), 'utf8');

  assert.match(sql, /CREATE TABLE IF NOT EXISTS contacts[\s\S]*?user_id UUID/i);
  assert.match(sql, /CONSTRAINT fk_contacts_user[\s\S]*?FOREIGN KEY \(user_id\) REFERENCES users\(id\)/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS conversations[\s\S]*?user_id UUID NOT NULL/i);
  assert.match(sql, /CONSTRAINT fk_conversations_user[\s\S]*?FOREIGN KEY \(user_id\) REFERENCES users\(id\)/i);
  assert.match(sql, /INSERT INTO conversations \(id, user_id, client_name, topic, status, start_time\)/i);
});

test('messages table includes the created_at column required by the new schema validation', async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const sql = await fs.readFile(path.resolve(__dirname, 'init.sql'), 'utf8');

  assert.match(sql, /CREATE TABLE IF NOT EXISTS messages[\s\S]*?created_at TIMESTAMP WITH TIME ZONE NOT NULL/i);
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
  assert.match(cleanupSql, /media_files is a NEW table/i);
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
