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
    sql: `SELECT u.id, u.full_name AS name, u.role, d.assigned_phone AS phone, u.foto AS avatar, u.initials, u.online FROM users u LEFT JOIN devices d ON d.user_id = u.id WHERE u.role IN ('agent', 'supervisor', 'admin') ORDER BY u.full_name`,
  },
  conversations: {
    name: 'conversations',
    sql: `SELECT id, user_id, contact_id, topic, status, start_time FROM conversations ORDER BY start_time`,
  },
  messages: {
    name: 'messages',
    sql: `SELECT id, conversation_id, content_type, text_body, media_file_id, channel, created_at, external_message_id FROM messages ORDER BY created_at`,
  },
  contacts: {
    name: 'contacts',
    sql: `SELECT u.full_name AS nombre_usuario, c.phone AS telefono_cliente, c.name AS nombre_cliente FROM contacts c LEFT JOIN users u ON u.id = c.user_id ORDER BY c.name`,
  },
};
