import type { AgentModel, ConversationModel, MessageModel } from '../../domain/models.js';
import type { AgentRepository, ConversationRepository, MessageRepository } from '../../domain/repositories.js';
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
