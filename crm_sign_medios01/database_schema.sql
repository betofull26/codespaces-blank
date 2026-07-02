-- Relational schema for dashboard agents, conversations, and messages
-- Compatible with PostgreSQL / MySQL-style SQL dialects.

CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  initials TEXT,
  online BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'waiting')),
  start_time TEXT NOT NULL,
  CONSTRAINT fk_conversations_agent
    FOREIGN KEY (agent_id) REFERENCES agents(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('agent', 'client', 'supervisor', 'supervisor_as_agent')),
  text TEXT NOT NULL,
  time TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'dashboard' CHECK (source IN ('whatsapp', 'dashboard', 'internal')),
  external_message_id TEXT,
  CONSTRAINT fk_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

-- Optional seed example (commented out by default)
-- INSERT INTO agents (id, name, role, phone, avatar, initials, online)
-- VALUES ('1', 'Carlos Mendoza', 'Agente Senior', '+58 412-555-0101', '', 'CM', TRUE);
--
-- INSERT INTO conversations (id, agent_id, client_name, topic, status, start_time)
-- VALUES ('conv-1', '1', 'Ana Pérez', 'Solicitud de presupuesto', 'active', '09:18');
--
-- INSERT INTO messages (id, conversation_id, sender, text, time, source, external_message_id)
-- VALUES ('msg-1', 'conv-1', 'client', 'Hola, necesito información sobre el servicio.', '09:19', 'whatsapp', 'wa-123');
