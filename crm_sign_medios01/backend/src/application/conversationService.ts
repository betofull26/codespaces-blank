import type { ConversationRepository } from '../domain/ports/ConversationRepository.js';

export const makeConversationService = (repo: ConversationRepository) => ({
  fetchAgents: () => repo.fetchAgents(),
  fetchAgentConversations: (agentId: string) => repo.fetchAgentConversations(agentId),
  fetchConversationMessages: (conversationId: string) => repo.fetchConversationMessages(conversationId),
  postConversationIntervention: (conversationId: string, payload: { sender: 'supervisor' | 'supervisor_as_agent'; text: string; time: string }) =>
    repo.postConversationIntervention(conversationId, payload as any),
  updateConversationStatus: (conversationId: string, status: string) => repo.updateConversationStatus(conversationId, status),
  postWhatsAppWebhook: (payload: { externalMessageId: string; phoneNumber: string; text: string; timestamp: string; conversationId?: string; agentId?: string }) =>
    repo.postWhatsAppWebhook(payload as any),
});

export type ConversationService = ReturnType<typeof makeConversationService>;
