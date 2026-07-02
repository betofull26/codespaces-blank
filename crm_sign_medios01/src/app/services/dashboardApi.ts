import type { Agent, Conversation, ChatMessage } from "../components/dashboard/types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    return response.text().then((message) => {
      throw new Error(message || `API error: ${response.status}`);
    });
  }
  return response.json();
}

export async function fetchAgents(): Promise<Agent[]> {
  const response = await fetch(`${API_BASE}/agents`);
  return handleResponse<Agent[]>(response);
}

export async function fetchAgentConversations(agentId: string): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE}/agents/${encodeURIComponent(agentId)}/conversations`);
  return handleResponse<Conversation[]>(response);
}

export async function fetchConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const response = await fetch(`${API_BASE}/conversations/${encodeURIComponent(conversationId)}/messages`);
  return handleResponse<ChatMessage[]>(response);
}

export interface InterventionPayload {
  sender: "supervisor" | "supervisor_as_agent";
  text: string;
  time: string;
}

export async function postConversationIntervention(
  conversationId: string,
  payload: InterventionPayload
): Promise<ChatMessage> {
  const response = await fetch(`${API_BASE}/conversations/${encodeURIComponent(conversationId)}/interventions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<ChatMessage>(response);
}

export async function updateConversationStatus(conversationId: string, status: string): Promise<Conversation> {
  const response = await fetch(`${API_BASE}/conversations/${encodeURIComponent(conversationId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return handleResponse<Conversation>(response);
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
  const response = await fetch(`${API_BASE}/whatsapp/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<{ success: boolean }>(response);
}
