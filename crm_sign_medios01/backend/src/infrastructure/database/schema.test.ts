import test from 'node:test';
import assert from 'node:assert/strict';
import { getRequiredSchema, validateRequiredSchema } from './schema.js';

test('validateRequiredSchema reports missing tables and columns', () => {
  const issues = validateRequiredSchema([
    { name: 'users', columns: ['id', 'full_name'] },
    { name: 'auth_users', columns: ['id', 'user_id'] },
  ], {
    users: ['id'],
    auth_users: ['id', 'username'],
  });

  assert.equal(issues.length, 2);
  assert.match(issues[0], /missing table/i);
  assert.match(issues[1], /missing column/i);
});

test('validateRequiredSchema accepts the full new schema shape', () => {
  const requiredSchema = getRequiredSchema();
  const issues = validateRequiredSchema(requiredSchema, {
    users: ['id', 'full_name', 'position', 'entry_date', 'foto', 'initials', 'online', 'created_at', 'updated_at'],
    auth_users: ['id', 'user_id', 'username', 'password_hash', 'role', 'status', 'access_to_panel', 'created_at', 'updated_at'],
    devices: ['id', 'user_id', 'brand_model', 'serial_number_1', 'serial_number_2', 'assigned_phone'],
    conversations: ['id', 'user_id', 'contact_id', 'topic', 'start_time'],
    messages: ['id', 'conversation_id', 'content_type', 'text_body', 'media_file_id', 'channel', 'created_at'],
    contacts: ['id', 'user_id', 'name', 'phone', 'company', 'position', 'created_at'],
    user_sessions: ['id', 'auth_user_id', 'token_hash', 'expires_at', 'created_at', 'updated_at', 'revoked_at'],
    audit_logs: ['id', 'entity_type', 'entity_id', 'action', 'user_id', 'details', 'created_at'],
    backups: ['id', 'backup_type', 'file_name', 'created_at', 'status', 'file_path', 'file_url'],
  });

  assert.equal(issues.length, 0);
});
