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
END $$;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  access_to_panel BOOLEAN NOT NULL DEFAULT FALSE,
  position TEXT,
  entry_date TEXT,
  foto TEXT,
  initials TEXT,
  online BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  initials TEXT,
  online BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_agents_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

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

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  agent_id TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT,
  position TEXT,
  created_at TEXT NOT NULL,
  CONSTRAINT fk_contacts_agent_user FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  contact_id TEXT,
  client_name TEXT NOT NULL,
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  start_time TEXT NOT NULL,
  phone TEXT,
  CONSTRAINT fk_conversations_agent_user
    FOREIGN KEY (agent_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_conversations_contact
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  text TEXT NOT NULL,
  time TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'dashboard',
  external_message_id TEXT,
  content_type TEXT NOT NULL DEFAULT 'text',
  text_body TEXT,
  media_file_id TEXT,
  channel TEXT NOT NULL DEFAULT 'dashboard',
  CONSTRAINT fk_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS media_files (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  created_at TEXT NOT NULL,
  CONSTRAINT fk_media_files_message FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE ON UPDATE CASCADE
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

CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY,
  backup_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  file_path TEXT,
  file_url TEXT
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  auth_user_id TEXT,
  token_hash TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  revoked_at TEXT,
  CONSTRAINT fk_user_sessions_auth_user FOREIGN KEY (auth_user_id) REFERENCES auth_users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO users (id, full_name, username, password_hash, role, status, access_to_panel, created_at, updated_at)
VALUES
  ('agent-1', 'Carlos Mendoza', 'agent-1', '', 'agent', 'active', FALSE, '2026-07-03T00:00:00.000Z', '2026-07-03T00:00:00.000Z'),
  ('agent-2', 'Laura Gómez', 'agent-2', '', 'agent', 'active', FALSE, '2026-07-03T00:00:00.000Z', '2026-07-03T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO agents (id, user_id, name, role, phone, avatar, initials, online)
VALUES
  ('agent-1', 'agent-1', 'Carlos Mendoza', 'Agente Senior', '+58 412-555-0101', '', 'CM', TRUE),
  ('agent-2', 'agent-2', 'Laura Gómez', 'Agente Junior', '+58 414-555-0102', '', 'LG', FALSE)
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  avatar = EXCLUDED.avatar,
  initials = EXCLUDED.initials,
  online = EXCLUDED.online;

CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_auth_users_user_id ON auth_users(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_media_files_message_id ON media_files(message_id);

INSERT INTO auth_users (id, user_id, username, password_hash, role, status, access_to_panel, created_at, updated_at)
SELECT 'auth-user-admin-1', id, username, password_hash, role, status, access_to_panel, created_at, updated_at
FROM users
WHERE username IS NOT NULL AND id = 'user-admin-1'
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_users (id, user_id, username, password_hash, role, status, access_to_panel, created_at, updated_at)
SELECT concat('auth-', id), id, username, password_hash, role, status, access_to_panel, created_at, updated_at
FROM users
WHERE id <> 'user-admin-1' AND username IS NOT NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO devices (id, user_id, brand_model, serial_number_1, serial_number_2, assigned_phone)
SELECT concat('device-', id), id, 'Migrated from legacy system', concat('serial-', id), NULL, concat('+000000000', substr(id, 1, 3))
FROM users
WHERE role IN ('admin', 'supervisor', 'agent')
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit_logs (id, entity_type, entity_id, action, performed_by, user_id, details, created_at)
SELECT concat('audit-init-', id), 'user', id, 'create_user', id, id, jsonb_build_object('source', 'migration', 'message', 'Migrated from legacy users table')::text, COALESCE(created_at, now()::text)
FROM users
WHERE id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO agents (id, user_id, name, role, phone, avatar, initials, online)
VALUES
  ('agent-1', 'agent-1', 'Carlos Mendoza', 'Agente Senior', '+58 412-555-0101', '', 'CM', TRUE),
  ('agent-2', 'agent-2', 'Laura Gómez', 'Agente Junior', '+58 414-555-0102', '', 'LG', FALSE)
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  avatar = EXCLUDED.avatar,
  initials = EXCLUDED.initials,
  online = EXCLUDED.online;

INSERT INTO conversations (id, agent_id, client_name, topic, status, start_time)
VALUES
  ('conv-1', 'agent-1', 'Ana Pérez', 'Solicitud de presupuesto', 'active', '2026-07-02T09:18:00.000Z'),
  ('conv-2', 'agent-2', 'Miguel Torres', 'Seguimiento de pedido', 'waiting', '2026-07-02T10:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO messages (id, conversation_id, sender, text, time, source, external_message_id)
VALUES
  ('msg-1', 'conv-1', 'client', 'Hola, necesito información sobre el servicio.', '2026-07-02T09:19:00.000Z', 'whatsapp', 'wa-123'),
  ('msg-2', 'conv-1', 'agent', 'Claro, te comparto los detalles.', '2026-07-02T09:20:00.000Z', 'dashboard', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, full_name, username, password_hash, role, status, access_to_panel, created_at, updated_at)
VALUES
  ('user-admin-1', 'Administrador', 'admin', '$2b$10$hg4TvuIRgYqYhGHt5Yg4aesOkO907HPGOJ6eyjw4.PlfMyTcD4q/u', 'admin', 'active', TRUE, '2026-07-03T00:00:00.000Z', '2026-07-03T00:00:00.000Z')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  access_to_panel = EXCLUDED.access_to_panel,
  updated_at = EXCLUDED.updated_at;

