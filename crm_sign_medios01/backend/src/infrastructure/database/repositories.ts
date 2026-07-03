import type { AgentModel, ConversationModel, MessageModel, UserModel, UserCredentialsModel, AuditLogModel } from '../../domain/models.js';
import type { AgentRepository, ConversationRepository, MessageRepository, UserRepository } from '../../domain/repositories.js';
import { getDatabaseClient } from './connection.js';

export class PostgresAgentRepository implements AgentRepository {
  async list(): Promise<AgentModel[]> {
    const db = await getDatabaseClient();
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
      'INSERT INTO agents (id, name, role, phone, avatar, initials, online) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [agent.id, agent.name, agent.role, agent.phone ?? null, agent.avatar ?? null, agent.initials ?? null, agent.online],
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
    const rows = await db.query('SELECT id, agent_id AS "agentId", client_name AS "clientName", topic, status, start_time AS "startTime" FROM conversations WHERE id = $1', [id]);
    return (rows[0] as ConversationModel | undefined) ?? null;
  }

  async getByAgentId(agentId: string): Promise<ConversationModel[]> {
    const db = await getDatabaseClient();
    const rows = await db.query('SELECT id, agent_id AS "agentId", client_name AS "clientName", topic, status, start_time AS "startTime" FROM conversations WHERE agent_id = $1 ORDER BY start_time DESC', [agentId]);
    return rows as ConversationModel[];
  }

  async create(conversation: ConversationModel): Promise<ConversationModel> {
    const db = await getDatabaseClient();
    await db.query(
      'INSERT INTO conversations (id, agent_id, client_name, topic, status, start_time) VALUES ($1, $2, $3, $4, $5, $6)',
      [conversation.id, conversation.agentId, conversation.clientName, conversation.topic, conversation.status, conversation.startTime],
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
    const rows = await db.query('SELECT id, full_name AS "fullName", email, username, password_hash AS "passwordHash", role, status, access_to_panel AS "accessToPanel", created_at AS "createdAt", updated_at AS "updatedAt" FROM users ORDER BY created_at');
    return rows as UserModel[];
  }

  async getUserById(id: string): Promise<UserModel | null> {
    const db = await getDatabaseClient();
    const rows = await db.query('SELECT id, full_name AS "fullName", email, username, password_hash AS "passwordHash", role, status, access_to_panel AS "accessToPanel", created_at AS "createdAt", updated_at AS "updatedAt" FROM users WHERE id = $1', [id]);
    return (rows[0] as UserModel | undefined) ?? null;
  }

  async getUserByEmail(email: string): Promise<UserModel | null> {
    const db = await getDatabaseClient();
    const rows = await db.query('SELECT id, full_name AS "fullName", email, username, password_hash AS "passwordHash", role, status, access_to_panel AS "accessToPanel", created_at AS "createdAt", updated_at AS "updatedAt" FROM users WHERE email = $1', [email]);
    return (rows[0] as UserModel | undefined) ?? null;
  }

  async getUserByUsername(username: string): Promise<UserModel | null> {
    const db = await getDatabaseClient();
    const rows = await db.query('SELECT id, full_name AS "fullName", email, username, password_hash AS "passwordHash", role, status, access_to_panel AS "accessToPanel", created_at AS "createdAt", updated_at AS "updatedAt" FROM users WHERE username = $1', [username]);
    return (rows[0] as UserModel | undefined) ?? null;
  }

  async getCredentialsByUsername(username: string): Promise<UserCredentialsModel | null> {
    const db = await getDatabaseClient();
    const rows = await db.query('SELECT id, user_id AS "userId", username, password_hash AS "passwordHash", created_at AS "createdAt", updated_at AS "updatedAt" FROM user_credentials WHERE username = $1', [username]);
    return (rows[0] as UserCredentialsModel | undefined) ?? null;
  }

  async createUser(user: UserModel): Promise<UserModel> {
    const db = await getDatabaseClient();
    await db.query(
      'INSERT INTO users (id, full_name, email, username, password_hash, role, status, access_to_panel, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [user.id, user.fullName, user.email, user.username, user.passwordHash, user.role, user.status, user.accessToPanel, user.createdAt, user.updatedAt],
    );
    return user;
  }

  async updateUser(user: UserModel): Promise<UserModel> {
    const db = await getDatabaseClient();
    await db.query(
      'UPDATE users SET full_name = $1, email = $2, username = $3, password_hash = $4, role = $5, status = $6, access_to_panel = $7, updated_at = $8 WHERE id = $9',
      [user.fullName, user.email, user.username, user.passwordHash, user.role, user.status, user.accessToPanel, user.updatedAt, user.id],
    );
    return user;
  }

  async updateUserRole(id: string, role: UserModel['role'], _actorId: string): Promise<UserModel | null> {
    const db = await getDatabaseClient();
    const accessToPanel = role !== 'agent';
    const updatedAt = new Date().toISOString();
    const rows = await db.query('UPDATE users SET role = $1, access_to_panel = $2, updated_at = $3 WHERE id = $4 RETURNING id, full_name AS "fullName", email, username, password_hash AS "passwordHash", role, status, access_to_panel AS "accessToPanel", created_at AS "createdAt", updated_at AS "updatedAt"', [role, accessToPanel, updatedAt, id]);
    return (rows[0] as UserModel | undefined) ?? null;
  }

  async updateUserStatus(id: string, status: UserModel['status']): Promise<UserModel | null> {
    const db = await getDatabaseClient();
    const updatedAt = new Date().toISOString();
    const rows = await db.query('UPDATE users SET status = $1, updated_at = $2 WHERE id = $3 RETURNING id, full_name AS "fullName", email, username, password_hash AS "passwordHash", role, status, access_to_panel AS "accessToPanel", created_at AS "createdAt", updated_at AS "updatedAt"', [status, updatedAt, id]);
    return (rows[0] as UserModel | undefined) ?? null;
  }

  async upsertCredentials(credentials: UserCredentialsModel): Promise<UserCredentialsModel> {
    const db = await getDatabaseClient();
    await db.query(
      'INSERT INTO user_credentials (id, user_id, username, password_hash, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (user_id) DO UPDATE SET username = EXCLUDED.username, password_hash = EXCLUDED.password_hash, updated_at = EXCLUDED.updated_at',
      [credentials.id, credentials.userId, credentials.username, credentials.passwordHash, credentials.createdAt, credentials.updatedAt],
    );
    return credentials;
  }

  async createAuditLog(entry: AuditLogModel): Promise<void> {
    const db = await getDatabaseClient();
    await db.query(
      'INSERT INTO audit_logs (id, entity_type, entity_id, action, performed_by, details, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [entry.id, entry.entityType, entry.entityId, entry.action, entry.performedBy, entry.details, entry.createdAt],
    );
  }
}
