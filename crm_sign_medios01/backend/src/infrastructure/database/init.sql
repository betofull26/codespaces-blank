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
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  position TEXT,
  entry_date DATE,
  foto TEXT,
  initials TEXT,
  online BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS auth_users (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  username TEXT UNIQUE NULL,
  password_hash TEXT NULL,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'supervisor', 'agent')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  access_to_panel BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_auth_users_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  brand_model TEXT NOT NULL,
  serial_number_1 VARCHAR(20) NOT NULL UNIQUE,
  serial_number_2 VARCHAR(20),
  assigned_phone TEXT NOT NULL UNIQUE,
  CONSTRAINT fk_devices_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  company TEXT NULL,
  position TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT fk_contacts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID,
  topic TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT fk_conversations_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_conversations_contact
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'media')),
  text_body TEXT,
  media_file_id UUID,
  channel TEXT NOT NULL DEFAULT 'dashboard' CHECK (channel IN ('dashboard', 'whatsapp')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT fk_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS media_files (
  id UUID PRIMARY KEY,
  message_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('sticker', 'emoji', 'image', 'video', 'audio', 'document')),
  file_path TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT fk_media_files_message FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  user_id UUID NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  file_path TEXT,
  file_url TEXT
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_user_sessions_auth_user FOREIGN KEY (auth_user_id) REFERENCES auth_users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO users (id, full_name, position, entry_date, foto, initials, online, created_at, updated_at)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'Carlos Mendoza', NULL, NULL, '', 'CM', TRUE, '2026-07-03T00:00:00.000Z', '2026-07-03T00:00:00.000Z'),
  ('22222222-2222-4222-8222-222222222222', 'Laura Gómez', NULL, NULL, '', 'LG', FALSE, '2026-07-03T00:00:00.000Z', '2026-07-03T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_auth_users_username ON auth_users(username);
CREATE INDEX IF NOT EXISTS idx_auth_users_user_id ON auth_users(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_media_files_message_id ON media_files(message_id);

INSERT INTO users (id, full_name, position, entry_date, foto, initials, online, created_at, updated_at)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'Carlos Mendoza', NULL, NULL, '', 'CM', TRUE, '2026-07-03T00:00:00.000Z', '2026-07-03T00:00:00.000Z'),
  ('22222222-2222-4222-8222-222222222222', 'Laura Gómez', NULL, NULL, '', 'LG', FALSE, '2026-07-03T00:00:00.000Z', '2026-07-03T00:00:00.000Z'),
  ('66666666-6666-4666-8666-666666666666', 'Administrador', NULL, NULL, '', 'AD', FALSE, '2026-07-03T00:00:00.000Z', '2026-07-03T00:00:00.000Z')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  updated_at = EXCLUDED.updated_at;

INSERT INTO auth_users (id, user_id, username, password_hash, role, status, access_to_panel, created_at, updated_at)
VALUES
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'agent-1', '', 'agent', 'active', FALSE, '2026-07-03T00:00:00.000Z', '2026-07-03T00:00:00.000Z'),
  ('44444444-4444-4444-8444-444444444444', '22222222-2222-4222-8222-222222222222', 'agent-2', '', 'agent', 'active', FALSE, '2026-07-03T00:00:00.000Z', '2026-07-03T00:00:00.000Z'),
  ('55555555-5555-4555-8555-555555555555', '66666666-6666-4666-8666-666666666666', 'admin', '$2b$10$hg4TvuIRgYqYhGHt5Yg4aesOkO907HPGOJ6eyjw4.PlfMyTcD4q/u', 'admin', 'active', TRUE, '2026-07-03T00:00:00.000Z', '2026-07-03T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO devices (id, user_id, brand_model, serial_number_1, serial_number_2, assigned_phone)
SELECT gen_random_uuid(), id, 'Migrated from legacy system', concat('serial-', substr(replace(id::text, '-', ''), 1, 12)), NULL, concat('+000000000', substr(replace(id::text, '-', ''), 1, 3))
FROM users
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit_logs (id, entity_type, entity_id, action, user_id, details, created_at)
SELECT gen_random_uuid(), 'user', id, 'create_user', id, jsonb_build_object('source', 'migration', 'message', 'Migrated from legacy users table')::text, COALESCE(created_at, NOW())
FROM users
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO contacts (id, user_id, name, phone, company, position, created_at)
VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Ana Pérez', '+521234567890', 'CRM Sign Medios', 'Cliente', '2026-07-02T09:18:00.000Z'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'Miguel Torres', '+529876543210', 'CRM Sign Medios', 'Cliente', '2026-07-02T10:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO conversations (id, user_id, contact_id, topic, start_time)
VALUES
  ('cccccccc-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0000-4000-8000-000000000001', 'Solicitud de presupuesto', '2026-07-02T09:18:00.000Z'),
  ('dddddddd-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'bbbbbbbb-0000-4000-8000-000000000002', 'Seguimiento de pedido', '2026-07-02T10:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO messages (id, conversation_id, content_type, text_body, media_file_id, channel, created_at)
VALUES
  ('eeeeeeee-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000001', 'text', 'Hola, necesito información sobre el servicio.', NULL, 'whatsapp', '2026-07-02T09:19:00.000Z'),
  ('ffffffff-0000-4000-8000-000000000002', 'cccccccc-0000-4000-8000-000000000001', 'text', 'Claro, te comparto los detalles.', NULL, 'dashboard', '2026-07-02T09:20:00.000Z')
ON CONFLICT (id) DO NOTHING;


