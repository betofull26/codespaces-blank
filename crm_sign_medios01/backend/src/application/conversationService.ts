import type { ConversationRepository, MessageRepository } from '../domain/repositories.js';
import type { ConversationModel, MessageModel } from '../domain/models.js';

export const getConversations = async (
  conversationRepository: ConversationRepository,
): Promise<ConversationModel[]> => conversationRepository.list();

export const getConversationsByAgent = async (
  conversationRepository: ConversationRepository,
  agentId: string,
): Promise<ConversationModel[]> => conversationRepository.getByAgentId(agentId);

export const addMessage = async (
  messageRepository: MessageRepository,
  message: MessageModel,
): Promise<MessageModel> => messageRepository.create(message);

export const getMessagesForConversation = async (
  messageRepository: MessageRepository,
  conversationId: string,
): Promise<MessageModel[]> => messageRepository.listByConversationId(conversationId);
