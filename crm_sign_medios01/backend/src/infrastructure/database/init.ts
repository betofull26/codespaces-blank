import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabaseClient } from './connection.js';

export const getUserSchemaMigrationSql = () => `
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'email'
  ) THEN
    ALTER TABLE users DROP COLUMN IF EXISTS email;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contacts'
      AND column_name = 'agent_id'
  ) THEN
    ALTER TABLE contacts ALTER COLUMN agent_id DROP NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'position'
  ) THEN
    ALTER TABLE users ADD COLUMN position TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'entry_date'
  ) THEN
    ALTER TABLE users ADD COLUMN entry_date TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'foto'
  ) THEN
    ALTER TABLE users ADD COLUMN foto TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'initials'
  ) THEN
    ALTER TABLE users ADD COLUMN initials TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'online'
  ) THEN
    ALTER TABLE users ADD COLUMN online BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN contact_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'content_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN content_type TEXT NOT NULL DEFAULT 'text';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'text_body'
  ) THEN
    ALTER TABLE messages ADD COLUMN text_body TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'media_file_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN media_file_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'channel'
  ) THEN
    ALTER TABLE messages ADD COLUMN channel TEXT NOT NULL DEFAULT 'dashboard';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'audit_logs'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN user_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_sessions'
      AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN auth_user_id TEXT;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS auth_users (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'agent',
  status TEXT NOT NULL DEFAULT 'active',
  access_to_panel BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  CONSTRAINT fk_auth_users_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  brand_model TEXT NOT NULL,
  serial_number_1 TEXT NOT NULL UNIQUE,
  serial_number_2 TEXT,
  assigned_phone TEXT NOT NULL UNIQUE,
  CONSTRAINT fk_devices_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  user_id TEXT,
  details TEXT NOT NULL,
  created_at TEXT NOT NULL
);

INSERT INTO auth_users (id, user_id, username, password_hash, role, status, access_to_panel, created_at, updated_at)
SELECT
  COALESCE(NULLIF(auth_user.id, ''), concat('auth-', u.id)),
  u.id,
  u.username,
  u.password_hash,
  COALESCE(NULLIF(u.role, ''), 'agent'),
  COALESCE(NULLIF(u.status, ''), 'active'),
  COALESCE(u.access_to_panel, FALSE),
  COALESCE(u.created_at, NOW()::TEXT),
  COALESCE(u.updated_at, NOW()::TEXT)
FROM users u
LEFT JOIN auth_users auth_user ON auth_user.user_id = u.id
WHERE u.id IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  access_to_panel = EXCLUDED.access_to_panel,
  updated_at = EXCLUDED.updated_at;

INSERT INTO devices (id, user_id, brand_model, serial_number_1, serial_number_2, assigned_phone)
SELECT
  concat('device-', u.id),
  u.id,
  COALESCE(NULLIF(u.position, ''), 'Migrated from legacy system'),
  concat('serial-', u.id),
  NULL,
  concat('+000000000', substr(u.id, 1, 3))
FROM users u
LEFT JOIN devices d ON d.user_id = u.id
WHERE u.id IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
  brand_model = EXCLUDED.brand_model,
  serial_number_1 = EXCLUDED.serial_number_1,
  assigned_phone = EXCLUDED.assigned_phone;

INSERT INTO audit_logs (id, entity_type, entity_id, action, performed_by, user_id, details, created_at)
SELECT
  concat('audit-migrated-', u.id),
  'user',
  u.id,
  'migrate_user',
  COALESCE(u.username, 'system'),
  u.id,
  json_build_object('source', 'migration', 'message', 'Migrated from legacy users table')::text,
  COALESCE(u.created_at, NOW()::TEXT)
FROM users u
LEFT JOIN audit_logs existing_log ON existing_log.entity_id = u.id AND existing_log.action = 'migrate_user'
WHERE u.id IS NOT NULL
ON CONFLICT (id) DO NOTHING;
`;

export const initializeDatabase = async () => {
  const db = await getDatabaseClient();
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const scriptPath = path.resolve(__dirname, 'init.sql');
  const sql = await fs.readFile(scriptPath, 'utf8');

  await db.query(getUserSchemaMigrationSql());
  await db.query(sql);
};
