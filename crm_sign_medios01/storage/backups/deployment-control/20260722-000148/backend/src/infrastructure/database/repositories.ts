import type { AgentModel, ConversationModel, MessageModel, UserModel, AuthUserModel, AuditLogModel, SessionModel, DeviceModel } from '../../domain/models.js';
import type { AgentRepository, ConversationRepository, MessageRepository, UserRepository, ContactRepository } from '../../domain/repositories.js';
import { getDatabaseClient } from './connection.js';

export class PostgresAgentRepository implements AgentRepository {
  async list(): Promise<AgentModel[]> {
    const db = await getDatabaseClient();
    // Get agents from the agents table - agents are created when users with role "Agente" are created/updated
    const rows = await db.query('SELECT id, name, role, phone, avatar, initials, online FROM agents ORDER BY name');
    return rows as AgentModel[];
  }

  async getById(id: string): Promise<AgentModel | null> {
    const db = await getDatabaseClient();
    const rows = await db.query('SELECT id, name, role, phone, avatar, initials, online FROM agents WHERE id = $1', [id]);
    return (rows[0] as AgentModel | undefined) ?? null;
  }

  async create(agent: AgentModel): Promise<AgentModel> {
    const db = await getDatabaseClient();
    await db.query(
      `INSERT INTO agents (id, user_id, name, role, phone, avatar, initials, online)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         name = EXCLUDED.name,
         role = EXCLUDED.role,
         phone = COALESCE(EXCLUDED.phone, agents.phone),
         avatar = COALESCE(EXCLUDED.avatar, agents.avatar),
         initials = COALESCE(EXCLUDED.initials, agents.initials),
         online = EXCLUDED.online`,
      [agent.id, agent.id, agent.name, agent.role, agent.phone ?? null, agent.avatar ?? null, agent.initials ?? null, agent.online],
    );
    return agent;
  }
}

export class PostgresConversationRepository implements ConversationRepository {
  async list(): Promise<ConversationModel[]> {
    const db = await getDatabaseClient();
    const rows = await db.query('SELECT id, agent_id AS "agentId", client_name AS "clientName", topic, status, start_time AS "startTime" FROM conversations ORDER BY start_time DESC');
    return rows as ConversationModel[];
  }

  async getById(id: string): Promise<ConversationModel | null> {
    const db = await getDatabaseClient();
    const rows = await db.query('SELECT id, agent_id AS "agentId", client_name AS "clientName", topic, status, start_time AS "startTime", phone FROM conversations WHERE id = $1', [id]);
    return (rows[0] as ConversationModel | undefined) ?? null;
  }

  async getByAgentId(agentId: string): Promise<ConversationModel[]> {
    const db = await getDatabaseClient();
    const rows = await db.query('SELECT id, agent_id AS "agentId", client_name AS "clientName", topic, status, start_time AS "startTime", phone FROM conversations WHERE agent_id = $1 ORDER BY start_time DESC', [agentId]);
    return rows as ConversationModel[];
  }

  async getByClientPhone(phone: string): Promise<ConversationModel | null> {
    const db = await getDatabaseClient();
    const rows = await db.query('SELECT id, agent_id AS "agentId", client_name AS "clientName", topic, status, start_time AS "startTime", phone FROM conversations WHERE phone = $1 ORDER BY start_time DESC LIMIT 1', [phone]);
    return (rows[0] as ConversationModel | undefined) ?? null;
  }

  async create(conversation: ConversationModel): Promise<ConversationModel> {
    const db = await getDatabaseClient();
    await db.query(
      'INSERT INTO conversations (id, agent_id, client_name, topic, status, start_time, phone) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [conversation.id, conversation.agentId, conversation.clientName, conversation.topic, conversation.status, conversation.startTime, conversation.phone ?? null],
    );
    return conversation;
  }
}

export class PostgresMessageRepository implements MessageRepository {
  async listByConversationId(conversationId: string): Promise<MessageModel[]> {
    const db = await getDatabaseClient();
    const rows = await db.query('SELECT id, conversation_id AS "conversationId", sender, text, time, source, external_message_id AS "externalMessageId" FROM messages WHERE conversation_id = $1 ORDER BY time', [conversationId]);
    return rows as MessageModel[];
  }

  async create(message: MessageModel): Promise<MessageModel> {
    const db = await getDatabaseClient();
    await db.query(
      'INSERT INTO messages (id, conversation_id, sender, text, time, source, external_message_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [message.id, message.conversationId, message.sender, message.text, message.time, message.source ?? 'dashboard', message.externalMessageId ?? null],
    );
    return message;
  }
}

export class PostgresUserRepository implements UserRepository {
  async listUsers(): Promise<UserModel[]> {
    const db = await getDatabaseClient();
    const rows = await db.query('SELECT id, full_name AS "fullName", username, password_hash AS "passwordHash", role, status, access_to_panel AS "accessToPanel", created_at AS "createdAt", updated_at AS "updatedAt" FROM users ORDER BY created_at');
    return rows as UserModel[];
  }

  async getUserById(id: string): Promise<UserModel | null> {
    const db = await getDatabaseClient();
    const rows = await db.query('SELECT id, full_name AS "fullName", username, password_hash AS "passwordHash", role, status, access_to_panel AS "accessToPanel", created_at AS "createdAt", updated_at AS "updatedAt" FROM users WHERE id = $1', [id]);
    return (rows[0] as UserModel | undefined) ?? null;
  }

  async getUserByUsername(username: string): Promise<UserModel | null> {
    const db = await getDatabaseClient();
    const rows = await db.query('SELECT id, full_name AS "fullName", username, password_hash AS "passwordHash", role, status, access_to_panel AS "accessToPanel", created_at AS "createdAt", updated_at AS "updatedAt" FROM users WHERE username = $1', [username]);
    return (rows[0] as UserModel | undefined) ?? null;
  }

  async createUser(user: UserModel): Promise<UserModel> {
    const db = await getDatabaseClient();
    // Check if username already exists - only for non-agent roles with non-empty username
    if (user.username && user.username.trim() && user.role !== 'agent') {
      const existingUserResult = await db.query(
        'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
        [user.username]
      );
      if (existingUserResult && existingUserResult.length > 0) {
        throw new Error(`El usuario "${user.username}" ya existe en el sistema`);
      }
    }
    await db.query(
      'INSERT INTO users (id, full_name, username, password_hash, role, status, access_to_panel, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [user.id, user.fullName, user.username, user.passwordHash, user.role, user.status, user.accessToPanel, user.createdAt, user.updatedAt],
    );

    const authUserId = `auth-${user.id}`;
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
      [authUserId, user.id, user.username, user.passwordHash, user.role, user.status, user.accessToPanel, user.createdAt, user.updatedAt],
    );

    const roleLower = user.role?.toLowerCase?.() ?? '';
    if (roleLower === 'agent' || roleLower === 'supervisor') {
      const deviceId = `device-${user.id}`;
      await db.query(
        `INSERT INTO devices (id, user_id, brand_model, serial_number_1, serial_number_2, assigned_phone)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [deviceId, user.id, 'Migrated from legacy system', `serial-${user.id}`, null, `+000000000000`],
      );

      await db.query(
        `INSERT INTO agents (id, user_id, name, role, phone, avatar, initials, online)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           user_id = EXCLUDED.user_id,
           name = EXCLUDED.name,
           role = EXCLUDED.role,
           phone = COALESCE(EXCLUDED.phone, agents.phone),
           avatar = COALESCE(EXCLUDED.avatar, agents.avatar),
           initials = COALESCE(EXCLUDED.initials, agents.initials),
           online = EXCLUDED.online`,
        [user.id, user.id, user.fullName, user.role, null, null, null, false],
      );
    }

    return user;
  }

  async updateUser(user: UserModel): Promise<UserModel> {
    const db = await getDatabaseClient();
    const result = await db.query(
      'UPDATE users SET full_name = $1, username = $2, password_hash = $3, role = $4, status = $5, access_to_panel = $6, updated_at = $7 WHERE id = $8 RETURNING id',
      [user.fullName, user.username, user.passwordHash, user.role, user.status, user.accessToPanel, user.updatedAt, user.id],
    );
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('User not found');
    }

    const authUserId = `auth-${user.id}`;
    await db.query(
      `INSERT INTO auth_users (id, user_id, username, password_hash, role, status, access_to_panel, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         username = EXCLUDED.username,
         password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role,
         status = EXCLUDED.status,
         access_to_panel = EXCLUDED.access_to_panel,
         updated_at = EXCLUDED.updated_at`,
      [authUserId, user.id, user.username, user.passwordHash, user.role, user.status, user.accessToPanel, user.createdAt, user.updatedAt],
    );

    const roleLower = user.role?.toLowerCase?.() ?? '';
    if (roleLower === 'agent' || roleLower === 'supervisor') {
      await db.query(
        `INSERT INTO agents (id, user_id, name, role, phone, avatar, initials, online)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           user_id = EXCLUDED.user_id,
           name = EXCLUDED.name,
           role = EXCLUDED.role,
           phone = COALESCE(EXCLUDED.phone, agents.phone),
           avatar = COALESCE(EXCLUDED.avatar, agents.avatar),
           initials = COALESCE(EXCLUDED.initials, agents.initials),
           online = EXCLUDED.online`,
        [user.id, user.id, user.fullName, user.role, null, null, null, false],
      );
    }

    return user;
  }

  async updateUserRole(id: string, role: UserModel['role'], _actorId: string): Promise<UserModel | null> {
    const db = await getDatabaseClient();
    const accessToPanel = role !== 'agent';
    const updatedAt = new Date().toISOString();
    const rows = await db.query('UPDATE users SET role = $1, access_to_panel = $2, updated_at = $3 WHERE id = $4 RETURNING id, full_name AS "fullName", username, password_hash AS "passwordHash", role, status, access_to_panel AS "accessToPanel", created_at AS "createdAt", updated_at AS "updatedAt"', [role, accessToPanel, updatedAt, id]);

    const authUserId = `auth-${id}`;
    await db.query(
      `INSERT INTO auth_users (id, user_id, username, password_hash, role, status, access_to_panel, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         role = EXCLUDED.role,
         access_to_panel = EXCLUDED.access_to_panel,
         updated_at = EXCLUDED.updated_at`,
      [authUserId, id, null, null, role, 'active', accessToPanel, new Date().toISOString(), updatedAt],
    );

    const roleLower = role?.toLowerCase?.() ?? '';
    if (roleLower === 'agent' || roleLower === 'supervisor') {
      await db.query(
        `INSERT INTO agents (id, user_id, name, role, phone, avatar, initials, online)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           user_id = EXCLUDED.user_id,
           role = EXCLUDED.role,
           online = EXCLUDED.online`,
        [id, id, id, role, null, null, null, false],
      );
    }

    return (rows[0] as UserModel | undefined) ?? null;
  }

  async updateUserStatus(id: string, status: UserModel['status']): Promise<UserModel | null> {
    const db = await getDatabaseClient();
    const updatedAt = new Date().toISOString();
    const rows = await db.query('UPDATE users SET status = $1, updated_at = $2 WHERE id = $3 RETURNING id, full_name AS "fullName", username, password_hash AS "passwordHash", role, status, access_to_panel AS "accessToPanel", created_at AS "createdAt", updated_at AS "updatedAt"', [status, updatedAt, id]);

    const authUserId = `auth-${id}`;
    await db.query(
      `INSERT INTO auth_users (id, user_id, username, password_hash, role, status, access_to_panel, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         updated_at = EXCLUDED.updated_at`,
      [authUserId, id, null, null, 'agent', status, false, new Date().toISOString(), updatedAt],
    );

    return (rows[0] as UserModel | undefined) ?? null;
  }

  async deleteUser(id: string): Promise<void> {
    const db = await getDatabaseClient();
    await db.query('DELETE FROM users WHERE id = $1', [id]);
  }

  async getAuthUserByUsername(username: string): Promise<AuthUserModel | null> {
    const db = await getDatabaseClient();
    const rows = await db.query('SELECT id, user_id AS "userId", username, password_hash AS "passwordHash", role, status, access_to_panel AS "accessToPanel", created_at AS "createdAt", updated_at AS "updatedAt" FROM auth_users WHERE LOWER(username) = LOWER($1) LIMIT 1', [username]);
    return (rows[0] as AuthUserModel | undefined) ?? null;
  }

  async upsertAuthUser(authUser: AuthUserModel): Promise<AuthUserModel> {
    const db = await getDatabaseClient();
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
      [authUser.id, authUser.userId, authUser.username, authUser.passwordHash, authUser.role, authUser.status, authUser.accessToPanel, authUser.createdAt, authUser.updatedAt],
    );
    return authUser;
  }

  async createAuditLog(entry: AuditLogModel): Promise<void> {
    const db = await getDatabaseClient();
    const userIdValue = entry.performedBy && entry.performedBy !== 'system' ? entry.performedBy : null;
    await db.query(
      'INSERT INTO audit_logs (id, entity_type, entity_id, action, performed_by, user_id, details, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [entry.id, entry.entityType, entry.entityId, entry.action, entry.performedBy, userIdValue, entry.details, entry.createdAt],
    );
  }

  async createSession(session: SessionModel): Promise<void> {
    const db = await getDatabaseClient();
    const authUserRows = await db.query('SELECT id FROM auth_users WHERE user_id = $1 LIMIT 1', [session.userId]);
    const authUserId = (authUserRows[0] as { id: string } | undefined)?.id ?? session.userId;
    await db.query(
      'INSERT INTO user_sessions (id, user_id, auth_user_id, token_hash, role, expires_at, created_at, updated_at, revoked_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [session.id, session.userId, authUserId, session.tokenHash, session.role, session.expiresAt, session.createdAt, session.updatedAt, session.revokedAt ?? null],
    );
  }

  async getSessionByTokenHash(tokenHash: string): Promise<SessionModel | null> {
    const db = await getDatabaseClient();
    const rows = await db.query(
      'SELECT id, user_id AS "userId", token_hash AS "tokenHash", role, expires_at AS "expiresAt", created_at AS "createdAt", updated_at AS "updatedAt", revoked_at AS "revokedAt" FROM user_sessions WHERE token_hash = $1',
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
    const id = device.id || `device-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await db.query(
      `INSERT INTO devices (id, user_id, brand_model, serial_number_1, serial_number_2, assigned_phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         brand_model = EXCLUDED.brand_model,
         serial_number_1 = EXCLUDED.serial_number_1,
         serial_number_2 = EXCLUDED.serial_number_2,
         assigned_phone = EXCLUDED.assigned_phone`,
      [id, device.userId, device.brandModel ?? 'Migrated from legacy system', device.serialNumber1 ?? `serial-${device.userId}`, device.serialNumber2 ?? null, device.assignedPhone ?? null],
    );
    return { ...device, id };
  }
}

export class PostgresContactRepository implements ContactRepository {
  async listByAgent(agentId: string): Promise<{ id: string; name: string; phone: string; company: string | null; position: string | null; createdAt: string }[]> {
    const db = await getDatabaseClient();
    const rows = await db.query('SELECT id, name, phone, company, position, created_at AS "createdAt" FROM contacts WHERE agent_id = $1 ORDER BY created_at DESC', [agentId]);
    return rows as { id: string; name: string; phone: string; company: string | null; position: string | null; createdAt: string }[];
  }

  async listAllContacts(): Promise<{ id: string; name: string; phone: string; company: string | null; position: string | null; createdAt: string; agentId: string | null }[]> {
    const db = await getDatabaseClient();
    const rows = await db.query('SELECT id, agent_id AS "agentId", name, phone, company, position, created_at AS "createdAt" FROM contacts ORDER BY created_at DESC');
    return rows as { id: string; name: string; phone: string; company: string | null; position: string | null; createdAt: string; agentId: string | null }[];
  }

  async create(agentId: string | null, name: string, phone: string, company: string | null, position: string | null): Promise<{ id: string; agentId: string | null; name: string; phone: string; company: string | null; position: string | null; createdAt: string }> {
    const db = await getDatabaseClient();
    const id = `contact-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const createdAt = new Date().toISOString();
    await db.query('INSERT INTO contacts (id, agent_id, name, phone, company, position, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)', [id, agentId, name, phone, company, position, createdAt]);
    return { id, agentId, name, phone, company, position, createdAt };
  }

  async update(contactId: string, name: string, phone: string, company: string | null, position: string | null): Promise<{ id: string; agentId: string | null; name: string; phone: string; company: string | null; position: string | null; createdAt: string }> {
    const db = await getDatabaseClient();
    const rows = await db.query(
      'UPDATE contacts SET name = $1, phone = $2, company = $3, position = $4 WHERE id = $5 RETURNING id, agent_id AS "agentId", name, phone, company, position, created_at AS "createdAt"',
      [name, phone, company, position, contactId],
    );
    return (rows[0] as { id: string; agentId: string | null; name: string; phone: string; company: string | null; position: string | null; createdAt: string } | undefined) ?? { id: contactId, agentId: null, name, phone, company, position, createdAt: new Date().toISOString() };
  }

  async delete(contactId: string): Promise<void> {
    const db = await getDatabaseClient();
    await db.query('DELETE FROM contacts WHERE id = $1', [contactId]);
  }
}
