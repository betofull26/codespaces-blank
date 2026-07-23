export interface RequiredTableSchema {
  name: string;
  columns: string[];
}

export interface SchemaPresenceMap {
  [tableName: string]: string[];
}

export const getRequiredSchema = (): RequiredTableSchema[] => [
  { name: 'users', columns: ['id', 'full_name', 'position', 'entry_date', 'foto', 'initials', 'online', 'created_at', 'updated_at'] },
  { name: 'auth_users', columns: ['id', 'user_id', 'username', 'password_hash', 'role', 'status', 'access_to_panel', 'created_at', 'updated_at'] },
  { name: 'devices', columns: ['id', 'user_id', 'brand_model', 'serial_number_1', 'serial_number_2', 'assigned_phone'] },
  { name: 'conversations', columns: ['id', 'user_id', 'contact_id', 'topic', 'start_time'] },
  { name: 'messages', columns: ['id', 'conversation_id', 'content_type', 'text_body', 'media_file_id', 'channel', 'created_at'] },
  { name: 'media_files', columns: ['id', 'message_id', 'file_name', 'mime_type', 'file_type', 'file_path', 'file_size', 'created_at'] },
  { name: 'contacts', columns: ['id', 'user_id', 'name', 'phone', 'company', 'position', 'created_at'] },
  { name: 'user_sessions', columns: ['id', 'auth_user_id', 'token_hash', 'expires_at', 'created_at', 'updated_at', 'revoked_at'] },
  { name: 'audit_logs', columns: ['id', 'entity_type', 'entity_id', 'action', 'user_id', 'details', 'created_at'] },
  { name: 'backups', columns: ['id', 'backup_type', 'file_name', 'created_at', 'status', 'file_path', 'file_url'] },
];

export const validateRequiredSchema = (requiredSchema: RequiredTableSchema[], presentSchema: SchemaPresenceMap): string[] => {
  const issues: string[] = [];

  for (const table of requiredSchema) {
    const columns = presentSchema[table.name];
    if (!columns) {
      issues.push(`missing table: ${table.name}`);
      continue;
    }

    for (const column of table.columns) {
      if (!columns.includes(column)) {
        issues.push(`missing column: ${table.name}.${column}`);
      }
    }
  }

  return issues;
};
