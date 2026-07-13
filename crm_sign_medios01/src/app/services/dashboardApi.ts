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
  return requestApiData<Agent[]>('/agents');
}

export async function fetchConversations(): Promise<Conversation[]> {
  return requestApiData<Conversation[]>('/conversations');
}

export async function fetchAgentConversations(agentId: string): Promise<Conversation[]> {
  return requestApiData<Conversation[]>(`/agents/${encodeURIComponent(agentId)}/conversations`);
}

export async function fetchConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const rows = await requestApiData<any[]>(`/conversations/${encodeURIComponent(conversationId)}/messages`);
  return (rows ?? []).map((m) => ({
    id: m.id,
    conversationId: m.conversationId ?? m.conversation_id ?? conversationId,
    sender: m.sender,
    text: m.text,
    time: m.time,
    source: m.source ?? 'dashboard',
    externalMessageId: m.externalMessageId ?? m.external_message_id ?? null,
  })) as ChatMessage[];
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
  return requestApiData<ChatMessage>(`/conversations/${encodeURIComponent(conversationId)}/interventions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function sendMessageAsAgent(conversationId: string, text: string) {
  const time = new Date().toISOString();
  return postConversationIntervention(conversationId, { sender: 'supervisor_as_agent', text, time });
}

export async function updateConversationStatus(conversationId: string, status: string): Promise<Conversation> {
  return requestApiData<Conversation>(`/conversations/${encodeURIComponent(conversationId)}`, {
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

export interface BackupRecordDto {
  id: string;
  backupType: string;
  fileName: string;
  createdAt: string;
  status: string;
  filePath?: string | null;
  fileUrl?: string | null;
}

export interface AuditLogDto {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  details: string;
  createdAt: string;
}

export async function fetchBackups(): Promise<BackupRecordDto[]> {
  return requestApiData<BackupRecordDto[]>('/backups');
}

export async function fetchContactsByAgent(agentId: string): Promise<{ id: string; name: string; phone: string; createdAt: string }[]> {
  return requestApiData(`/agents/${encodeURIComponent(agentId)}/contacts`);
}

export async function fetchContacts(): Promise<{ id: string; agentId: string | null; name: string; phone: string; createdAt: string }[]> {
  return requestApiData('/contacts');
}

export async function createContact(name: string, phone: string, agentId?: string) {
  return requestApiData('/contacts', {
    method: 'POST',
    body: JSON.stringify({ name, phone, agentId }),
  });
}

export async function createContactForAgent(agentId: string, name: string, phone: string) {
  return requestApiData(`/agents/${encodeURIComponent(agentId)}/contacts`, {
    method: 'POST',
    body: JSON.stringify({ name, phone }),
  });
}

export async function createBackup(backupType: string = 'chats', agentId?: string): Promise<BackupRecordDto> {
  return requestApiData<BackupRecordDto>('/backups', {
    method: 'POST',
    body: JSON.stringify({ backupType, agentId }),
  });
}

export async function fetchAuditLogs(): Promise<AuditLogDto[]> {
  return requestApiData<AuditLogDto[]>('/audit-logs');
}

export async function downloadBackup(backupId: string): Promise<Blob> {
  const response = await fetch(`/api/backups/download/${encodeURIComponent(backupId)}`, {
    headers: {
      Authorization: `Bearer ${typeof window !== 'undefined' ? window.localStorage.getItem('crm_session_token') ?? '' : ''}`,
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.blob();
}

export async function postWhatsAppWebhook(payload: WhatsAppWebhookPayload): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>("/whatsapp/webhook", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function exchangeWhatsAppSignupCode(code: string): Promise<{ success: boolean }> {
  return requestApiData<{ success: boolean }>("/waba/onboard/exchange", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function fetchUsers(role: string): Promise<BackendUser[]> {
  return requestApiData<BackendUser[]>("/users", {
    headers: {
      "x-user-role": role,
    },
  });
}

export async function createUser(payload: UserCreatePayload, role: string, actorId?: string): Promise<BackendUser> {
  return requestApiData<BackendUser>("/users", {
    method: "POST",
    headers: {
      "x-user-role": role,
    },
    body: JSON.stringify({ ...payload, actorId }),
  });
}

export async function updateUser(userId: string, payload: UserCreatePayload, role: string, actorId?: string): Promise<BackendUser> {
  return requestApiData<BackendUser>(`/users/${encodeURIComponent(userId)}`, {
    method: "PUT",
    headers: {
      "x-user-role": role,
    },
    body: JSON.stringify({ ...payload, actorId }),
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

export async function deleteUserById(userId: string, role: string, actorId?: string): Promise<void> {
  await requestJson<void>(`/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: {
      "x-user-role": role,
    },
    body: JSON.stringify({ actorId }),
  });
}
