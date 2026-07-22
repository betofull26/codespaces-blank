import type { AgentRepository, ConversationRepository, MessageRepository } from '../domain/repositories.js';
import { validateAgent, validateConversation, validateMessage, type AgentModel, type ConversationModel, type MessageModel } from '../domain/models.js';

export interface WhatsAppInboundPayload {
  phone?: string;
  clientName?: string;
  text?: string;
  timestamp?: string;
  externalMessageId?: string;
}

export const listAgents = async (repository: AgentRepository): Promise<AgentModel[]> => repository.list();

export const listConversations = async (
  repository: ConversationRepository,
): Promise<ConversationModel[]> => repository.list();

export const getConversationsByAgentId = async (
  repository: ConversationRepository,
  agentId: string,
): Promise<ConversationModel[]> => repository.getByAgentId(agentId);

export const listMessagesByConversationId = async (
  repository: MessageRepository,
  conversationId: string,
): Promise<MessageModel[]> => repository.listByConversationId(conversationId);

export const createMessage = async (
  repository: MessageRepository,
  message: MessageModel,
): Promise<MessageModel> => {
  validateMessage(message);
  return repository.create(message);
};

export const createConversation = async (
  repository: ConversationRepository,
  conversation: ConversationModel,
): Promise<ConversationModel> => {
  validateConversation(conversation);
  return repository.create(conversation);
};

export const createAgent = async (
  repository: AgentRepository,
  agent: AgentModel,
): Promise<AgentModel> => {
  validateAgent(agent);
  return repository.create(agent);
};

export const ingestWhatsAppMessage = async (
  conversationRepository: ConversationRepository,
  messageRepository: MessageRepository,
  payload: WhatsAppInboundPayload,
): Promise<{ conversation: ConversationModel; message: MessageModel }> => {
  const phone = payload.phone?.trim() ?? '';
  const clientName = payload.clientName?.trim() || 'Cliente';
  const text = payload.text?.trim() || '';
  const timestamp = payload.timestamp?.trim() || new Date().toISOString();
  const agentId = process.env.DEFAULT_AGENT_ID ?? 'agent-1';

  const existingConversation = phone ? await conversationRepository.getByClientPhone(phone) : null;

  const conversation = existingConversation ?? await createConversation(conversationRepository, {
    id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    agentId,
    clientName,
    topic: text.length > 0 ? text.slice(0, 48) : 'Conversación de WhatsApp',
    status: 'active',
    startTime: timestamp,
    phone,
  });

  const message = await createMessage(messageRepository, {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    conversationId: conversation.id,
    sender: 'client',
    text,
    time: timestamp,
    source: 'whatsapp',
    externalMessageId: payload.externalMessageId ?? null,
  });

  return { conversation, message };
};
