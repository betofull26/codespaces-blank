import { requestJson } from "./apiClient";
async function requestApiData(path, init) {
    const response = await requestJson(path, init);
    return (response.data ?? undefined);
}
export async function fetchAgents() {
    return requestApiData('/agents');
}
export async function fetchAllContacts() {
    return requestApiData('/contacts');
}
export async function fetchConversations() {
    return requestApiData('/conversations');
}
export async function fetchUserConversations(userId) {
    return requestApiData(`/users/${encodeURIComponent(userId)}/conversations`);
}
export async function fetchConversationMessages(conversationId) {
    const rows = await requestApiData(`/conversations/${encodeURIComponent(conversationId)}/messages`);
    return (rows ?? []).map((m) => ({
        id: m.id,
        conversationId: m.conversationId ?? m.conversation_id ?? conversationId,
        sender: m.sender,
        text: m.text,
        time: m.time,
        source: m.source ?? 'dashboard',
        externalMessageId: m.externalMessageId ?? m.external_message_id ?? null,
    }));
}
export async function postConversationIntervention(conversationId, payload) {
    return requestApiData(`/conversations/${encodeURIComponent(conversationId)}/interventions`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
export async function sendMessageAsAgent(conversationId, text) {
    const time = new Date().toISOString();
    return postConversationIntervention(conversationId, { sender: 'supervisor_as_agent', text, time });
}
export async function updateConversationStatus(conversationId, status) {
    return requestApiData(`/conversations/${encodeURIComponent(conversationId)}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
}
export async function fetchBackups() {
    return requestApiData('/backups');
}
export async function fetchContactsByUser(userId) {
    return requestApiData(`/users/${encodeURIComponent(userId)}/contacts`);
}
export async function fetchContacts() {
    return requestApiData('/contacts');
}
export async function createContact(name, phone, company, position, userId) {
    return requestApiData('/contacts', {
        method: 'POST',
        body: JSON.stringify({ name, phone, company, position, userId }),
    });
}
export async function updateContact(contactId, name, phone, company, position) {
    return requestApiData(`/contacts/${encodeURIComponent(contactId)}`, {
        method: 'PUT',
        body: JSON.stringify({ name, phone, company, position }),
    });
}
export async function deleteContact(contactId) {
    return requestApiData(`/contacts/${encodeURIComponent(contactId)}`, {
        method: 'DELETE',
    });
}
export async function createContactForUser(userId, name, phone, company, position) {
    return requestApiData(`/users/${encodeURIComponent(userId)}/contacts`, {
        method: 'POST',
        body: JSON.stringify({ name, phone, company, position }),
    });
}
export async function createBackup(backupType = 'chats', userId) {
    return requestApiData('/backups', {
        method: 'POST',
        body: JSON.stringify({ backupType, userId }),
    });
}
export async function fetchAuditLogs() {
    return requestApiData('/audit-logs');
}
export async function downloadBackup(backupId) {
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
export async function postWhatsAppWebhook(payload) {
    return requestJson("/whatsapp/webhook", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
export async function exchangeWhatsAppSignupCode(code) {
    return requestApiData("/waba/onboard/exchange", {
        method: "POST",
        body: JSON.stringify({ code }),
    });
}
export async function fetchUsers(role) {
    return requestApiData("/users", {
        headers: {
            "x-user-role": role,
        },
    });
}
export async function createUser(payload, role, actorId) {
    return requestApiData("/users", {
        method: "POST",
        headers: {
            "x-user-role": role,
        },
        body: JSON.stringify({ ...payload, actorId }),
    });
}
export async function updateDeviceForUser(userId, payload, role) {
    return requestApiData(`/devices/${encodeURIComponent(userId)}`, {
        method: "PUT",
        headers: {
            "x-user-role": role,
        },
        body: JSON.stringify(payload),
    });
}
export async function updateUser(userId, payload, role, actorId) {
    return requestApiData(`/users/${encodeURIComponent(userId)}`, {
        method: "PUT",
        headers: {
            "x-user-role": role,
        },
        body: JSON.stringify({ ...payload, actorId }),
    });
}
export async function updateUserStatus(userId, status, role) {
    return requestApiData(`/users/${encodeURIComponent(userId)}/status`, {
        method: "PATCH",
        headers: {
            "x-user-role": role,
        },
        body: JSON.stringify({ status }),
    });
}
export async function deleteUserById(userId, role, actorId) {
    await requestJson(`/users/${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: {
            "x-user-role": role,
        },
        body: JSON.stringify({ actorId }),
    });
}
//# sourceMappingURL=dashboardApi.js.map