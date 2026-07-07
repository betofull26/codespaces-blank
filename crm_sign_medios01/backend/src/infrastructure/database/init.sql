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

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  initials TEXT,
  online BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  start_time TEXT NOT NULL,
  phone TEXT,
  CONSTRAINT fk_conversations_agent
    FOREIGN KEY (agent_id) REFERENCES agents(id)
    ON DELETE CASCADE
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
  CONSTRAINT fk_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  access_to_panel BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  agent_id TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TEXT NOT NULL,
  CONSTRAINT fk_contacts_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

INSERT INTO agents (id, name, role, phone, avatar, initials, online)
VALUES
  ('agent-1', 'Carlos Mendoza', 'Agente Senior', '+58 412-555-0101', '', 'CM', TRUE),
  ('agent-2', 'Laura Gómez', 'Agente Junior', '+58 414-555-0102', '', 'LG', FALSE)
ON CONFLICT (id) DO NOTHING;

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
  ('user-admin-1', 'Administrador', 'admin', '$2b$10$qcqISJoLWPKLqXHlKpGTkO0kVHN9gJZgBNg3HzKjQ0P7u6P6G4kMi', 'admin', 'active', TRUE, '2026-07-03T00:00:00.000Z', '2026-07-03T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

