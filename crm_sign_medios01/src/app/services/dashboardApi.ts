import type { Agent, Conversation, ChatMessage } from "../components/dashboard/types";
import { requestJson } from "./apiClient";

export async function fetchAgents(): Promise<Agent[]> {
  return requestJson<Agent[]>("/agents");
}

export async function fetchAgentConversations(agentId: string): Promise<Conversation[]> {
  return requestJson<Conversation[]>(`/agents/${encodeURIComponent(agentId)}/conversations`);
}

export async function fetchConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  return requestJson<ChatMessage[]>(`/conversations/${encodeURIComponent(conversationId)}/messages`);
}

export interface InterventionPayload {
  sender: "supervisor" | "supervisor_as_agent";
  text: string;
  time: string;
}

export async function postConversationIntervention(
  conversationId: string,
  payload: InterventionPayload,
): Promise<ChatMessage> {
  return requestJson<ChatMessage>(`/conversations/${encodeURIComponent(conversationId)}/interventions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateConversationStatus(conversationId: string, status: string): Promise<Conversation> {
  return requestJson<Conversation>(`/conversations/${encodeURIComponent(conversationId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export interface WhatsAppWebhookPayload {
  externalMessageId: string;
  phoneNumber: string;
  text: string;
  timestamp: string;
  conversationId?: string;
  agentId?: string;
}

export async function postWhatsAppWebhook(payload: WhatsAppWebhookPayload): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>("/whatsapp/webhook", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
