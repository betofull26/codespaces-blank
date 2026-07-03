import type { AgentRepository, ConversationRepository, MessageRepository } from '../domain/repositories.js';
import { validateAgent, validateConversation, validateMessage, type AgentModel, type ConversationModel, type MessageModel } from '../domain/models.js';

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
