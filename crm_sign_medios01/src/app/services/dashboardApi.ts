import type { Agent, Conversation, ChatMessage } from "../components/dashboard/types.js";
import { requestJson } from "./apiClient.js";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export type BackendRole = "admin" | "supervisor" | "agent";
export type BackendStatus = "active" | "inactive" | "suspended";

export interface UserProfileDto {
  id: string;
  fullName: string;
  position?: string | null;
  entryDate?: string | null;
  foto?: string | null;
  initials?: string | null;
  online?: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AuthUserPayload {
  username: string;
  passwordHash: string;
  role: BackendRole;
  status: BackendStatus;
  accessToPanel: boolean;
}

export interface UserProfileReadDto extends UserProfileDto {
}

async function requestApiData<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await requestJson<ApiEnvelope<T>>(path, init);
  return (response.data ?? undefined) as T;
}

export async function fetchAgents(): Promise<Agent[]> {
  return requestApiData<Agent[]>('/agents');
}

export async function fetchAllContacts(): Promise<{ id: string; name: string; phone: string; company: string | null; position: string | null; createdAt: string; agentId: string | null }[]> {
  return requestApiData('/contacts');
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

export async function fetchContactsByAgent(agentId: string): Promise<{ id: string; name: string; phone: string; company: string | null; position: string | null; createdAt: string }[]> {
  return requestApiData(`/agents/${encodeURIComponent(agentId)}/contacts`);
}

export async function fetchContacts(): Promise<{ id: string; agentId: string | null; name: string; phone: string; company: string | null; position: string | null; createdAt: string }[]> {
  return requestApiData('/contacts');
}

export async function createContact(name: string, phone: string, company?: string, position?: string, agentId?: string) {
  return requestApiData('/contacts', {
    method: 'POST',
    body: JSON.stringify({ name, phone, company, position, agentId }),
  });
}

export async function updateContact(contactId: string, name: string, phone: string, company?: string, position?: string) {
  return requestApiData(`/contacts/${encodeURIComponent(contactId)}`, {
    method: 'PUT',
    body: JSON.stringify({ name, phone, company, position }),
  });
}

export async function deleteContact(contactId: string) {
  return requestApiData(`/contacts/${encodeURIComponent(contactId)}`, {
    method: 'DELETE',
  });
}

export async function createContactForAgent(agentId: string, name: string, phone: string, company?: string, position?: string) {
  return requestApiData(`/agents/${encodeURIComponent(agentId)}/contacts`, {
    method: 'POST',
    body: JSON.stringify({ name, phone, company, position }),
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

export async function fetchUsers(role: string): Promise<UserProfileReadDto[]> {
  return requestApiData<UserProfileReadDto[]>("/users", {
    headers: {
      "x-user-role": role,
    },
  });
}

export async function createUser(profilePayload: UserProfileDto, authPayload: AuthUserPayload, role: string, actorId?: string): Promise<UserProfileReadDto> {
  return requestApiData<UserProfileReadDto>("/users", {
    method: "POST",
    headers: {
      "x-user-role": role,
    },
    body: JSON.stringify({ ...profilePayload, ...authPayload, actorId }),
  });
}

export async function updateDeviceForUser(userId: string, payload: { brandModel?: string; serialNumber1?: string; serialNumber2?: string; assignedPhone?: string }, role: string) {
  return requestApiData(`/devices/${encodeURIComponent(userId)}`, {
    method: "PUT",
    headers: {
      "x-user-role": role,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateUser(userId: string, profilePayload: UserProfileDto, authPayload: AuthUserPayload, role: string, actorId?: string): Promise<UserProfileReadDto> {
  return requestApiData<UserProfileReadDto>(`/users/${encodeURIComponent(userId)}`, {
    method: "PUT",
    headers: {
      "x-user-role": role,
    },
    body: JSON.stringify({ ...profilePayload, ...authPayload, actorId }),
  });
}

export async function updateUserStatus(userId: string, status: BackendStatus, role: string): Promise<UserProfileReadDto> {
  return requestApiData<UserProfileReadDto>(`/users/${encodeURIComponent(userId)}/status`, {
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
