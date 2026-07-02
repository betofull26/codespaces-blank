import crypto from 'node:crypto';
import type { ConversationRepository } from '../../domain/ports/ConversationRepository.js';
import type { AgentModel, ConversationModel, MessageModel } from '../../domain/models.js';
import { getDatabaseClient, type DatabaseClient } from './connection.js';

const normalizeAgentRow = (row: any): AgentModel => ({
  id: String(row.id),
  name: String(row.name),
  role: String(row.role),
  phone: row.phone ?? null,
  avatar: row.avatar ?? null,
  initials: row.initials ?? null,
  online: Boolean(row.online),
});

const normalizeConversationRow = (row: any): ConversationModel => ({
  id: String(row.id),
  agentId: String(row.agent_id),
  clientName: String(row.client_name),
  topic: String(row.topic),
  status: String(row.status) as 'active' | 'waiting' | 'closed',
  startTime: String(row.start_time),
});

const normalizeMessageRow = (row: any): MessageModel => ({
  id: String(row.id),
  conversationId: String(row.conversation_id),
  sender: String(row.sender) as 'agent' | 'client' | 'supervisor' | 'supervisor_as_agent',
  text: String(row.text),
  time: String(row.time),
  source: row.source ? String(row.source) as 'whatsapp' | 'dashboard' | 'internal' : undefined,
  externalMessageId: row.external_message_id ?? null,
});

const makeMessageId = (): string => `msg-${crypto.randomUUID()}`;

export const makePgConversationRepository = (
  clientProvider: () => Promise<DatabaseClient> = getDatabaseClient,
): ConversationRepository => ({
  fetchAgents: async () => {
    const db = await clientProvider();
    const rows = await db.query(
      `SELECT id, name, role, phone, avatar, initials, online FROM agents ORDER BY name ASC`,
    );
    return (rows as any[]).map(normalizeAgentRow);
  },

  fetchAgentConversations: async (agentId: string) => {
    const db = await clientProvider();
    const conversationRows = await db.query(
      `SELECT id, agent_id, client_name, topic, status, start_time FROM conversations WHERE agent_id = $1 ORDER BY start_time DESC`,
      [agentId],
    );

    const conversations = (conversationRows as any[]).map(normalizeConversationRow);
    const conversationIds = conversations.map((conversation) => conversation.id);

    const messages: MessageModel[] = conversationIds.length > 0
      ? (await db.query(
          `SELECT id, conversation_id, sender, text, time, source, external_message_id FROM messages WHERE conversation_id = ANY($1) ORDER BY time ASC`,
          [conversationIds],
        ) as any[]).map(normalizeMessageRow)
      : [];

    return conversations.map((conversation) => ({
      ...conversation,
      messages: messages.filter((message) => message.conversationId === conversation.id),
    }));
  },

  fetchConversationMessages: async (conversationId: string) => {
    const db = await clientProvider();
    const rows = await db.query(
      `SELECT id, conversation_id, sender, text, time, source, external_message_id FROM messages WHERE conversation_id = $1 ORDER BY time ASC`,
      [conversationId],
    );
    return (rows as any[]).map(normalizeMessageRow);
  },

  postConversationIntervention: async (conversationId: string, message: MessageModel) => {
    const db = await clientProvider();
    const intervention: MessageModel = {
      id: makeMessageId(),
      conversationId,
      sender: message.sender,
      text: message.text,
      time: message.time,
      source: 'dashboard',
      externalMessageId: null,
    };

    await db.query(
      `INSERT INTO messages (id, conversation_id, sender, text, time, source, external_message_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        intervention.id,
        intervention.conversationId,
        intervention.sender,
        intervention.text,
        intervention.time,
        intervention.source,
        intervention.externalMessageId,
      ],
    );

    return intervention;
  },

  updateConversationStatus: async (conversationId: string, status: string) => {
    const db = await clientProvider();
    const rows = await db.query(
      `UPDATE conversations SET status = $2 WHERE id = $1 RETURNING id, agent_id, client_name, topic, status, start_time`,
      [conversationId, status],
    ) as any[];

    if (rows.length === 0) {
      throw new Error('Conversación no encontrada');
    }

    return normalizeConversationRow(rows[0]);
  },

  postWhatsAppWebhook: async (message: MessageModel) => {
    const db = await clientProvider();

    if (!message.conversationId) {
      throw new Error('conversationId es obligatorio');
    }

    const conversationRows = await db.query(`SELECT id FROM conversations WHERE id = $1`, [message.conversationId]) as any[];
    if (conversationRows.length === 0) {
      throw new Error('Conversación no encontrada');
    }

    const whatsappMessage: MessageModel = {
      id: makeMessageId(),
      conversationId: message.conversationId,
      sender: 'client',
      text: message.text,
      time: message.time,
      source: 'whatsapp',
      externalMessageId: message.externalMessageId ?? null,
    };

    await db.query(
      `INSERT INTO messages (id, conversation_id, sender, text, time, source, external_message_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        whatsappMessage.id,
        whatsappMessage.conversationId,
        whatsappMessage.sender,
        whatsappMessage.text,
        whatsappMessage.time,
        whatsappMessage.source,
        whatsappMessage.externalMessageId,
      ],
    );

    return whatsappMessage;
  },
});
