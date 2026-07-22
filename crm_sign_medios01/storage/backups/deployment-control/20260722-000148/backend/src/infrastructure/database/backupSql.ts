export const createBackupsTableSql = `
CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY,
  backup_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  file_path TEXT,
  file_url TEXT
);
`;

export const backupExportQueries = {
  agents: {
    name: 'agents',
    sql: `SELECT id, name, role, phone, avatar, initials, online FROM agents ORDER BY name`,
  },
  conversations: {
    name: 'conversations',
    sql: `SELECT id, agent_id, client_name, topic, status, start_time FROM conversations ORDER BY start_time`,
  },
  messages: {
    name: 'messages',
    sql: `SELECT id, conversation_id, sender, text, time, source, external_message_id FROM messages ORDER BY time`,
  },
  contacts: {
    name: 'contacts',
    sql: `SELECT a.name AS nombre_usuario, c.phone AS telefono_cliente, c.name AS nombre_cliente FROM contacts c LEFT JOIN agents a ON a.id = c.agent_id ORDER BY c.name`,
  },
};
