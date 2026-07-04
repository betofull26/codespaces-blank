import type { Agent, Conversation, ChatMessage } from "../components/dashboard/types";
import { requestJson } from "./apiClient";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface BackendUser {
  id: string;
  fullName: string;
  username: string;
  passwordHash: string;
  role: "admin" | "supervisor" | "agent";
  status: "active" | "inactive" | "suspended";
  accessToPanel: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreatePayload {
  fullName: string;
  username: string;
  passwordHash: string;
  role: BackendUser["role"];
  status: BackendUser["status"];
  accessToPanel: boolean;
  actorId?: string;
}

async function requestApiData<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await requestJson<ApiEnvelope<T>>(path, init);
  return (response.data ?? undefined) as T;
}

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
export async function fetchUsers(role: string): Promise<BackendUser[]> {
  return requestApiData<BackendUser[]>("/users", {
    headers: {
      "x-user-role": role,
    },
  });
}

export async function createUser(payload: UserCreatePayload, role: string): Promise<BackendUser> {
  return requestApiData<BackendUser>("/users", {
    method: "POST",
    headers: {
      "x-user-role": role,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateUser(userId: string, payload: UserCreatePayload, role: string): Promise<BackendUser> {
  return requestApiData<BackendUser>(`/users/${encodeURIComponent(userId)}`, {
    method: "PUT",
    headers: {
      "x-user-role": role,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateUserStatus(userId: string, status: BackendUser["status"], role: string): Promise<BackendUser> {
  return requestApiData<BackendUser>(`/users/${encodeURIComponent(userId)}/status`, {
    method: "PATCH",
    headers: {
      "x-user-role": role,
    },
    body: JSON.stringify({ status }),
  });
}

export async function deleteUserById(userId: string, role: string): Promise<void> {
  await requestJson<void>(`/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: {
      "x-user-role": role,
    },
  });
}
