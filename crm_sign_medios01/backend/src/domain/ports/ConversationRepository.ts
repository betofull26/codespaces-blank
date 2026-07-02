import type { AgentModel, ConversationModel, MessageModel } from '../models.js';

export interface ConversationRepository {
  fetchAgents(): Promise<AgentModel[]>;
  fetchAgentConversations(agentId: string): Promise<Array<ConversationModel & { messages: MessageModel[] }>>;
  fetchConversationMessages(conversationId: string): Promise<MessageModel[]>;
  postConversationIntervention(conversationId: string, message: MessageModel): Promise<MessageModel>;
  updateConversationStatus(conversationId: string, status: string): Promise<ConversationModel>;
  postWhatsAppWebhook(message: MessageModel): Promise<MessageModel>;
}
