import { randomUUID } from 'node:crypto';
import type { AgentModel, ConversationModel, MessageModel, UserModel, AuthUserModel, AuditLogModel, SessionModel, DeviceModel, MediaFileModel } from '../../domain/models.js';
import type { AgentRepository, ConversationRepository, MessageRepository, UserRepository, ContactRepository, MediaFileRepository } from '../../domain/repositories.js';
import { getDatabaseClient } from './connection.js';

const isValidUuid = (value: string | null | undefined): value is string => {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};

const normalizeUuid = (value: string | null | undefined): string => {
  return isValidUuid(value) ? value : randomUUID();
};

export const buildAssignedPhone = (userId: string): string => {
  const normalized = userId.replace(/[^a-z0-9]/gi, '').slice(0, 12);
  const suffix = `${Date.now().toString().slice(-6)}${Math.random().toString().slice(2, 6)}`;
  return `+${normalized || 'user'}${suffix}`;
};

export class PostgresAgentRepository implements AgentRepository {
  async list(): Promise<AgentModel[]> {
    const db = await getDatabaseClient();
    const rows = await db.query(
      `SELECT u.id, u.full_name AS name, COALESCE(a.role, 'agent') AS role, d.assigned_phone AS phone, u.foto AS avatar, u.initials, u.online
       FROM users u
       LEFT JOIN auth_users a ON a.user_id = u.id
       LEFT JOIN devices d ON d.user_id = u.id
       WHERE COALESCE(a.role, 'agent') IN ('agent', 'supervisor', 'admin')
       ORDER BY u.full_name`,
    );
    return rows as AgentModel[];
  }

  async getById(id: string): Promise<AgentModel | null> {
    const db = await getDatabaseClient();
    const rows = await db.query(
      `SELECT u.id, u.full_name AS name, COALESCE(a.role, 'agent') AS role, d.assigned_phone AS phone, u.foto AS avatar, u.initials, u.online
       FROM users u
       LEFT JOIN auth_users a ON a.user_id = u.id
       LEFT JOIN devices d ON d.user_id = u.id
       WHERE u.id = $1`,
      [id],
    );
    return (rows[0] as AgentModel | undefined) ?? null;
  }

  async create(agent: AgentModel): Promise<AgentModel> {
    const db = await getDatabaseClient();
    const now = new Date().toISOString();
    await db.query(
      `INSERT INTO users (id, full_name, created_at, updated_at, initials, online, foto)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         updated_at = EXCLUDED.updated_at,
         initials = EXCLUDED.initials,
         online = EXCLUDED.online,
         foto = EXCLUDED.foto`,
      [agent.id, agent.name, now, now, agent.initials ?? null, agent.online, agent.avatar ?? null],
    );
    return agent;
  }
}

export class PostgresConversationRepository implements ConversationRepository {
  private async getOrCreateContactId(agentId: string, clientName: string, phone?: string | null): Promise<string | null> {
    if (!phone) {
      return null;
    }

    const db = await getDatabaseClient();
    const existing = await db.query('SELECT id FROM contacts WHERE phone = $1 LIMIT 1', [phone]);
    if (existing.length > 0) {
      return existing[0].id as string;
    }

    const contactId = `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await db.query(
      'INSERT INTO contacts (id, user_id, name, phone, company, position, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [contactId, agentId, clientName ?? 'Cliente', phone, null, null, new Date().toISOString()],
    );

    return contactId;
  }

  async list(): Promise<ConversationModel[]> {
    const db = await getDatabaseClient();
    const rows = await db.query(
      `SELECT c.id,
              c.user_id AS "agentId",
              COALESCE(ct.name, 'Cliente') AS "clientName",
              c.topic,
              'active' AS status,
              c.start_time AS "startTime",
              ct.phone
       FROM conversations c
       LEFT JOIN contacts ct ON ct.id = c.contact_id
       ORDER BY c.start_time DESC`,
    );
    return rows as ConversationModel[];
  }

  async getById(id: string): Promise<ConversationModel | null> {
    const db = await getDatabaseClient();
    const rows = await db.query(
      `SELECT c.id,
              c.user_id AS "agentId",
              COALESCE(ct.name, 'Cliente') AS "clientName",
              c.topic,
              'active' AS status,
              c.start_time AS "startTime",
              ct.phone
       FROM conversations c
       LEFT JOIN contacts ct ON ct.id = c.contact_id
       WHERE c.id = $1`,
      [id],
    );
    return (rows[0] as ConversationModel | undefined) ?? null;
  }

  async getByAgentId(agentId: string): Promise<ConversationModel[]> {
    const db = await getDatabaseClient();
    const rows = await db.query(
      `SELECT c.id,
              c.user_id AS "agentId",
              COALESCE(ct.name, 'Cliente') AS "clientName",
              c.topic,
              'active' AS status,
              c.start_time AS "startTime",
              ct.phone
       FROM conversations c
       LEFT JOIN contacts ct ON ct.id = c.contact_id
       WHERE c.user_id = $1
       ORDER BY c.start_time DESC`,
      [agentId],
    );
    return rows as ConversationModel[];
  }

  async getByClientPhone(phone: string): Promise<ConversationModel | null> {
    const db = await getDatabaseClient();
    const rows = await db.query(
      `SELECT c.id,
              c.user_id AS "agentId",
              COALESCE(ct.name, 'Cliente') AS "clientName",
              c.topic,
              'active' AS status,
              c.start_time AS "startTime",
              ct.phone
       FROM conversations c
       LEFT JOIN contacts ct ON ct.id = c.contact_id
       WHERE ct.phone = $1
       ORDER BY c.start_time DESC
       LIMIT 1`,
      [phone],
    );
    return (rows[0] as ConversationModel | undefined) ?? null;
  }

  async create(conversation: ConversationModel): Promise<ConversationModel> {
    const db = await getDatabaseClient();
    const contactId = await this.getOrCreateContactId(conversation.agentId, conversation.clientName, conversation.phone ?? null);
    await db.query(
      'INSERT INTO conversations (id, user_id, contact_id, topic, start_time) VALUES ($1, $2, $3, $4, $5)',
      [conversation.id, conversation.agentId, contactId, conversation.topic, conversation.startTime],
    );
    return conversation;
  }
}

export class PostgresMessageRepository implements MessageRepository {
  async listByConversationId(conversationId: string): Promise<MessageModel[]> {
    const db = await getDatabaseClient();
    const rows = await db.query(
      `SELECT id,
              conversation_id AS "conversationId",
              CASE
                WHEN COALESCE(channel, source) = 'whatsapp' THEN 'client'
                ELSE 'agent'
              END AS sender,
              COALESCE(text_body, text) AS text,
              COALESCE(created_at, time) AS time,
              COALESCE(channel, source, 'dashboard') AS source,
              external_message_id AS "externalMessageId"
       FROM messages
       WHERE conversation_id = $1
       ORDER BY COALESCE(created_at, time)`,
      [conversationId],
    );
    return rows as MessageModel[];
  }

  async create(message: MessageModel): Promise<MessageModel> {
    const db = await getDatabaseClient();
    const contentType = 'text';
    const textBody = message.text;
    const channel = message.source ?? 'dashboard';
    const createdAt = message.time || new Date().toISOString();

    await db.query(
      `INSERT INTO messages (id, conversation_id, content_type, text_body, media_file_id, channel, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [message.id, message.conversationId, contentType, textBody, null, channel, createdAt],
    );
    return message;
  }
}

export class PostgresMediaFileRepository implements MediaFileRepository {
  async listByMessageId(messageId: string): Promise<MediaFileModel[]> {
    const db = await getDatabaseClient();
    const rows = await db.query(
      'SELECT id, message_id AS "messageId", file_name AS "fileName", mime_type AS "mimeType", file_type AS "fileType", file_path AS "filePath", file_size AS "fileSize", created_at AS "createdAt" FROM media_files WHERE message_id = $1 ORDER BY created_at ASC',
      [messageId],
    );
    return rows as MediaFileModel[];
  }

  async create(mediaFile: MediaFileModel): Promise<MediaFileModel> {
    const db = await getDatabaseClient();
    await db.query(
      `INSERT INTO media_files (id, message_id, file_name, mime_type, file_type, file_path, file_size, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [mediaFile.id, mediaFile.messageId, mediaFile.fileName, mediaFile.mimeType, mediaFile.fileType, mediaFile.filePath, mediaFile.fileSize ?? null, mediaFile.createdAt],
    );
    return mediaFile;
  }
}

export class PostgresUserRepository implements UserRepository {
  async listUsers(): Promise<UserModel[]> {
    const db = await getDatabaseClient();
    const rows = await db.query(
      'SELECT id, full_name AS "fullName", position, entry_date AS "entryDate", foto, initials, online, created_at AS "createdAt", updated_at AS "updatedAt" FROM users ORDER BY created_at'
    );
    return rows as UserModel[];
  }

  async getUserById(id: string): Promise<UserModel | null> {
    const db = await getDatabaseClient();
    const rows = await db.query(
      'SELECT id, full_name AS "fullName", position, entry_date AS "entryDate", foto, initials, online, created_at AS "createdAt", updated_at AS "updatedAt" FROM users WHERE id = $1',
      [id]
    );
    return (rows[0] as UserModel | undefined) ?? null;
  }

  async getUserByUsername(username: string): Promise<UserModel | null> {
    const db = await getDatabaseClient();
    const rows = await db.query(
      'SELECT u.id, u.full_name AS "fullName", u.position, u.entry_date AS "entryDate", u.foto, u.initials, u.online, u.created_at AS "createdAt", u.updated_at AS "updatedAt" FROM users u JOIN auth_users a ON u.id = a.user_id WHERE LOWER(a.username) = LOWER($1) LIMIT 1',
      [username]
    );
    return (rows[0] as UserModel | undefined) ?? null;
  }

  async createUser(user: UserModel): Promise<UserModel> {
    const db = await getDatabaseClient();
    const userId = normalizeUuid(user.id);
    
    await db.query(
      'INSERT INTO users (id, full_name, position, entry_date, foto, initials, online, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [userId, user.fullName, user.position ?? null, user.entryDate ?? null, user.foto ?? null, user.initials ?? null, user.online ?? false, user.createdAt, user.updatedAt ?? null]
    );

    return { ...user, id: userId };
  }

  async updateUser(user: UserModel): Promise<UserModel> {
    const db = await getDatabaseClient();
    const userId = normalizeUuid(user.id);
    const result = await db.query(
      'UPDATE users SET full_name = $1, position = $2, entry_date = $3, foto = $4, initials = $5, online = $6, updated_at = $7 WHERE id = $8 RETURNING id, full_name AS "fullName", position, entry_date AS "entryDate", foto, initials, online, created_at AS "createdAt", updated_at AS "updatedAt"',
      [user.fullName, user.position ?? null, user.entryDate ?? null, user.foto ?? null, user.initials ?? null, user.online ?? false, user.updatedAt ?? new Date().toISOString(), userId]
    );
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('User not found');
    }
    return result[0] as UserModel;
  }

  async updateUserRole(id: string, role: 'admin' | 'agent' | 'supervisor', _actorId: string): Promise<UserModel | null> {
    const db = await getDatabaseClient();
    const userId = normalizeUuid(id);
    const accessToPanel = role !== 'agent';
    const updatedAt = new Date().toISOString();

    await db.query(
      `INSERT INTO auth_users (id, user_id, username, password_hash, role, status, access_to_panel, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, NULL, NULL, $2, 'active', $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
         role = EXCLUDED.role,
         access_to_panel = EXCLUDED.access_to_panel,
         updated_at = EXCLUDED.updated_at`,
      [userId, role, accessToPanel, new Date().toISOString(), updatedAt]
    );

    return this.getUserById(userId);
  }

  async updateUserStatus(id: string, status: 'active' | 'inactive' | 'suspended'): Promise<UserModel | null> {
    const db = await getDatabaseClient();
    const userId = normalizeUuid(id);
    const updatedAt = new Date().toISOString();

    await db.query(
      `INSERT INTO auth_users (id, user_id, username, password_hash, role, status, access_to_panel, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, NULL, NULL, 'agent', $2, FALSE, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET
         status = EXCLUDED.status,
         updated_at = EXCLUDED.updated_at`,
      [userId, status, new Date().toISOString(), updatedAt]
    );

    return this.getUserById(userId);
  }

  async deleteUser(id: string): Promise<void> {
    const db = await getDatabaseClient();
    const updatedAt = new Date().toISOString();

    await db.query(
      `UPDATE auth_users SET status = $1, updated_at = $2 WHERE user_id = $3`,
      ['inactive', updatedAt, normalizeUuid(id)]
    );
  }

  async getAuthUserByUsername(username: string): Promise<AuthUserModel | null> {
    const db = await getDatabaseClient();
    const rows = await db.query('SELECT id, user_id AS "userId", username, password_hash AS "passwordHash", role, status, access_to_panel AS "accessToPanel", created_at AS "createdAt", updated_at AS "updatedAt" FROM auth_users WHERE LOWER(username) = LOWER($1) LIMIT 1', [username]);
    return (rows[0] as AuthUserModel | undefined) ?? null;
  }

  async getAuthUserByUserId(userId: string): Promise<AuthUserModel | null> {
    const db = await getDatabaseClient();
    const rows = await db.query(
      'SELECT id, user_id AS "userId", username, password_hash AS "passwordHash", role, status, access_to_panel AS "accessToPanel", created_at AS "createdAt", updated_at AS "updatedAt" FROM auth_users WHERE user_id = $1 LIMIT 1',
      [normalizeUuid(userId)],
    );
    return (rows[0] as AuthUserModel | undefined) ?? null;
  }

  async upsertAuthUser(authUser: AuthUserModel): Promise<AuthUserModel> {
    const db = await getDatabaseClient();
    const authUserId = normalizeUuid(authUser.id);
    const userId = normalizeUuid(authUser.userId);
    await db.query(
      `INSERT INTO auth_users (id, user_id, username, password_hash, role, status, access_to_panel, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         username = EXCLUDED.username,
         password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role,
         status = EXCLUDED.status,
         access_to_panel = EXCLUDED.access_to_panel,
         updated_at = EXCLUDED.updated_at`,
      [authUserId, userId, authUser.username, authUser.passwordHash, authUser.role, authUser.status, authUser.accessToPanel, authUser.createdAt, authUser.updatedAt],
    );
    return { ...authUser, id: authUserId, userId };
  }

  async createAuditLog(entry: AuditLogModel): Promise<void> {
    const db = await getDatabaseClient();
    await db.query(
      'INSERT INTO audit_logs (id, entity_type, entity_id, action, user_id, details, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [entry.id, entry.entityType, entry.entityId, entry.action, entry.userId, entry.details, entry.createdAt],
    );
  }

  async listAuditLogs(): Promise<AuditLogModel[]> {
    const db = await getDatabaseClient();
    const rows = await db.query(
      'SELECT id, entity_type AS "entityType", entity_id AS "entityId", action, user_id AS "userId", details, created_at AS "createdAt" FROM audit_logs ORDER BY created_at DESC LIMIT 100',
    );
    return rows as AuditLogModel[];
  }

  async createSession(session: SessionModel): Promise<void> {
    const db = await getDatabaseClient();
    await db.query(
      'INSERT INTO user_sessions (id, auth_user_id, token_hash, expires_at, created_at, updated_at, revoked_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [session.id, session.authUserId, session.tokenHash, session.expiresAt, session.createdAt, session.updatedAt ?? null, session.revokedAt ?? null],
    );
  }

  async getSessionByTokenHash(tokenHash: string): Promise<SessionModel | null> {
    const db = await getDatabaseClient();
    const rows = await db.query(
      'SELECT id, auth_user_id AS "authUserId", token_hash AS "tokenHash", expires_at AS "expiresAt", created_at AS "createdAt", updated_at AS "updatedAt", revoked_at AS "revokedAt" FROM user_sessions WHERE token_hash = $1',
      [tokenHash],
    );
    return (rows[0] as SessionModel | undefined) ?? null;
  }

  async revokeSession(tokenHash: string): Promise<void> {
    const db = await getDatabaseClient();
    await db.query(
      'UPDATE user_sessions SET revoked_at = $1, updated_at = $1 WHERE token_hash = $2',
      [new Date().toISOString(), tokenHash],
    );
  }

  async listDevices(): Promise<DeviceModel[]> {
    const db = await getDatabaseClient();
    const rows = await db.query('SELECT id, user_id AS "userId", brand_model AS "brandModel", serial_number_1 AS "serialNumber1", serial_number_2 AS "serialNumber2", assigned_phone AS "assignedPhone" FROM devices ORDER BY id');
    return rows as DeviceModel[];
  }

  async getDeviceByUserId(userId: string): Promise<DeviceModel | null> {
    const db = await getDatabaseClient();
    const rows = await db.query('SELECT id, user_id AS "userId", brand_model AS "brandModel", serial_number_1 AS "serialNumber1", serial_number_2 AS "serialNumber2", assigned_phone AS "assignedPhone" FROM devices WHERE user_id = $1 LIMIT 1', [userId]);
    return (rows[0] as DeviceModel | undefined) ?? null;
  }

  async upsertDevice(device: DeviceModel): Promise<DeviceModel> {
    const db = await getDatabaseClient();
    const id = normalizeUuid(device.id);
    const assignedPhone = device.assignedPhone ?? buildAssignedPhone(device.userId);
    const serialNumber1 = (device.serialNumber1 ?? `serial-${device.userId}`).slice(0, 20);
    await db.query(
      `INSERT INTO devices (id, user_id, brand_model, serial_number_1, serial_number_2, assigned_phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         brand_model = EXCLUDED.brand_model,
         serial_number_1 = EXCLUDED.serial_number_1,
         serial_number_2 = EXCLUDED.serial_number_2,
         assigned_phone = EXCLUDED.assigned_phone`,
      [id, device.userId, device.brandModel ?? 'Migrated from legacy system', serialNumber1, device.serialNumber2 ?? null, assignedPhone],
    );
    return { ...device, id, assignedPhone, serialNumber1 };
  }
}

export class PostgresContactRepository implements ContactRepository {
  async listByAgent(agentId: string): Promise<{ id: string; name: string; phone: string; company: string | null; position: string | null; createdAt: string }[]> {
    const db = await getDatabaseClient();
    const rows = await db.query('SELECT id, name, phone, company, position, created_at AS "createdAt" FROM contacts WHERE user_id = $1 ORDER BY created_at DESC', [agentId]);
    return rows as { id: string; name: string; phone: string; company: string | null; position: string | null; createdAt: string }[];
  }

  async listAllContacts(): Promise<{ id: string; name: string; phone: string; company: string | null; position: string | null; createdAt: string; agentId: string | null }[]> {
    const db = await getDatabaseClient();
    const rows = await db.query('SELECT id, user_id AS "agentId", name, phone, company, position, created_at AS "createdAt" FROM contacts ORDER BY created_at DESC');
    return rows as { id: string; name: string; phone: string; company: string | null; position: string | null; createdAt: string; agentId: string | null }[];
  }

  async create(agentId: string | null, name: string, phone: string, company: string | null, position: string | null): Promise<{ id: string; agentId: string | null; name: string; phone: string; company: string | null; position: string | null; createdAt: string }> {
    const db = await getDatabaseClient();
    const id = `contact-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const createdAt = new Date().toISOString();
    await db.query('INSERT INTO contacts (id, user_id, name, phone, company, position, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)', [id, agentId, name, phone, company, position, createdAt]);
    return { id, agentId, name, phone, company, position, createdAt };
  }

  async update(contactId: string, name: string, phone: string, company: string | null, position: string | null): Promise<{ id: string; agentId: string | null; name: string; phone: string; company: string | null; position: string | null; createdAt: string }> {
    const db = await getDatabaseClient();
    const rows = await db.query(
      'UPDATE contacts SET name = $1, phone = $2, company = $3, position = $4 WHERE id = $5 RETURNING id, user_id AS "agentId", name, phone, company, position, created_at AS "createdAt"',
      [name, phone, company, position, contactId],
    );
    return (rows[0] as { id: string; agentId: string | null; name: string; phone: string; company: string | null; position: string | null; createdAt: string } | undefined) ?? { id: contactId, agentId: null, name, phone, company, position, createdAt: new Date().toISOString() };
  }

  async delete(contactId: string): Promise<void> {
    const db = await getDatabaseClient();
    await db.query('DELETE FROM contacts WHERE id = $1', [contactId]);
  }
}
