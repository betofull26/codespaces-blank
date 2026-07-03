import type { AgentModel, ConversationModel, MessageModel } from './models.js';

export interface AgentRepository {
  list(): Promise<AgentModel[]>;
  getById(id: string): Promise<AgentModel | null>;
  create(agent: AgentModel): Promise<AgentModel>;
}

export interface ConversationRepository {
  list(): Promise<ConversationModel[]>;
  getById(id: string): Promise<ConversationModel | null>;
  getByAgentId(agentId: string): Promise<ConversationModel[]>;
  create(conversation: ConversationModel): Promise<ConversationModel>;
}

export interface MessageRepository {
  listByConversationId(conversationId: string): Promise<MessageModel[]>;
  create(message: MessageModel): Promise<MessageModel>;
}
