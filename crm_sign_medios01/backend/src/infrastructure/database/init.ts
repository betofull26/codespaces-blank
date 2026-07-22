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
      AND table_name = 'agents'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE agents ADD COLUMN user_id TEXT;
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

  INSERT INTO users (id, full_name, username, password_hash, role, status, access_to_panel, created_at, updated_at)
  SELECT a.id,
         COALESCE(NULLIF(a.name, ''), a.id),
         concat('legacy-', a.id),
         '',
         'agent',
         'active',
         FALSE,
         NOW()::TEXT,
         NOW()::TEXT
  FROM agents a
  LEFT JOIN users u ON u.id = a.id
  WHERE u.id IS NULL
  ON CONFLICT (id) DO NOTHING;

  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'contacts'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'fk_contacts_agent'
  ) THEN
    ALTER TABLE contacts DROP CONSTRAINT fk_contacts_agent;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'contacts'
      AND constraint_name = 'fk_contacts_agent_user'
  ) THEN
    ALTER TABLE contacts ADD CONSTRAINT fk_contacts_agent_user FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'fk_conversations_agent'
  ) THEN
    ALTER TABLE conversations DROP CONSTRAINT fk_conversations_agent;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND constraint_name = 'fk_conversations_agent_user'
  ) THEN
    ALTER TABLE conversations ADD CONSTRAINT fk_conversations_agent_user FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND constraint_name = 'fk_conversations_contact'
  ) THEN
    ALTER TABLE conversations ADD CONSTRAINT fk_conversations_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'agents'
      AND constraint_name = 'fk_agents_user'
  ) THEN
    ALTER TABLE agents ADD CONSTRAINT fk_agents_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'user_sessions'
      AND constraint_name = 'fk_user_sessions_auth_user'
  ) THEN
    ALTER TABLE user_sessions ADD CONSTRAINT fk_user_sessions_auth_user FOREIGN KEY (auth_user_id) REFERENCES auth_users(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'user_sessions'
      AND constraint_name = 'fk_user_sessions_user'
  ) THEN
    ALTER TABLE user_sessions ADD CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;
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

CREATE TABLE IF NOT EXISTS migration_verifications (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'verified',
  details TEXT,
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
  concat('serial-', replace(u.id, '-', ''), '-', floor(random() * 100000)::int),
  NULL,
  concat('+000000000', replace(u.id, '-', ''), '-', floor(random() * 100000)::int)
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

export const getDataBackfillSql = () => `
INSERT INTO contacts (id, agent_id, name, phone, company, position, created_at)
SELECT
  concat('contact-', c.id),
  u.id,
  COALESCE(NULLIF(c.client_name, ''), concat('Contacto ', c.id)),
  COALESCE(NULLIF(c.phone, ''), concat('+000000000', substr(c.id, 1, 4))),
  NULL,
  NULL,
  COALESCE(c.start_time, NOW()::TEXT)
FROM conversations c
LEFT JOIN users u ON u.id = c.agent_id
LEFT JOIN contacts existing_contact ON existing_contact.id = concat('contact-', c.id)
WHERE c.id IS NOT NULL
  AND existing_contact.id IS NULL
ON CONFLICT (id) DO NOTHING;

UPDATE conversations c
SET contact_id = contact_row.id
FROM contacts contact_row
WHERE c.contact_id IS NULL
  AND contact_row.id = concat('contact-', c.id);

UPDATE messages
SET content_type = 'text',
    text_body = COALESCE(NULLIF(text_body, ''), text),
    channel = COALESCE(NULLIF(channel, ''), COALESCE(NULLIF(source, ''), 'dashboard'))
WHERE id IS NOT NULL;

INSERT INTO user_sessions (id, user_id, auth_user_id, token_hash, role, expires_at, created_at, updated_at, revoked_at)
SELECT
  concat('session-', a.id),
  a.user_id,
  a.id,
  concat('session-token-', a.id),
  COALESCE(NULLIF(a.role, ''), 'agent'),
  (NOW() + INTERVAL '24 hours')::TEXT,
  NOW()::TEXT,
  NOW()::TEXT,
  NULL
FROM auth_users a
LEFT JOIN user_sessions existing_session ON existing_session.auth_user_id = a.id
WHERE existing_session.id IS NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO migration_verifications (id, table_name, record_id, status, details, created_at)
SELECT concat('verify-users-', u.id), 'users', u.id, 'verified', 'user row migrated to new schema', NOW()::TEXT
FROM users u
WHERE u.id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO migration_verifications (id, table_name, record_id, status, details, created_at)
SELECT concat('verify-auth-', a.id), 'auth_users', a.id, 'verified', 'auth row migrated to new schema', NOW()::TEXT
FROM auth_users a
WHERE a.id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO migration_verifications (id, table_name, record_id, status, details, created_at)
SELECT concat('verify-devices-', d.id), 'devices', d.id, 'verified', 'device row migrated to new schema', NOW()::TEXT
FROM devices d
WHERE d.id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO migration_verifications (id, table_name, record_id, status, details, created_at)
SELECT concat('verify-contacts-', c.id), 'contacts', c.id, 'verified', 'contact row migrated to new schema', NOW()::TEXT
FROM contacts c
WHERE c.id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO migration_verifications (id, table_name, record_id, status, details, created_at)
SELECT concat('verify-conversations-', c.id), 'conversations', c.id, 'verified', 'conversation row migrated to new schema', NOW()::TEXT
FROM conversations c
WHERE c.id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO migration_verifications (id, table_name, record_id, status, details, created_at)
SELECT concat('verify-messages-', m.id), 'messages', m.id, 'verified', 'message row migrated to new schema', NOW()::TEXT
FROM messages m
WHERE m.id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO migration_verifications (id, table_name, record_id, status, details, created_at)
SELECT concat('verify-audit-', a.id), 'audit_logs', a.id, 'verified', 'audit row migrated to new schema', NOW()::TEXT
FROM audit_logs a
WHERE a.id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO migration_verifications (id, table_name, record_id, status, details, created_at)
SELECT concat('verify-sessions-', s.id), 'user_sessions', s.id, 'verified', 'session row migrated to new schema', NOW()::TEXT
FROM user_sessions s
WHERE s.id IS NOT NULL
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
  await db.query(getDataBackfillSql());
};
