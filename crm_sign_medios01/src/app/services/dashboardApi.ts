import type { Agent, Conversation, ChatMessage } from "../components/dashboard/types";

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/api';

async function handleResponse<T>(response: Response): Promise<T> {
  const json = await response.json().catch(() => null);

  if (response.ok) {
    if (json && typeof json === 'object' && 'data' in json) {
      return (json as any).data as T;
    }
    return json as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  let errorMessage = `API error: ${response.status}`;

  if (contentType.includes('application/json')) {
    const data = await response.json().catch(() => null);
    if (data && typeof data === 'object') {
      errorMessage = (data as any).error || (data as any).message || JSON.stringify(data);
    }
  } else {
    const text = await response.text().catch(() => '');
    if (text) errorMessage = text;
  }

  throw new Error(errorMessage);
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
