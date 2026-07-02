import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from './app.js';

const fakeDatabaseService = {
  getDatabaseHealth: async () => ({
    connected: true,
    message: 'ok',
    tables: [
      { name: 'agents', exists: true },
      { name: 'conversations', exists: true },
      { name: 'messages', exists: true },
    ],
  }),
};

const fakeDatabaseInitializer = {
  initializeDatabase: async () => {},
};

const fakeConversationService = {
  fetchAgents: async () => [{ id: 'agent-1', name: 'Test Agent', role: 'agent', phone: null, avatar: null, initials: 'TA', online: true }],
  fetchAgentConversations: async () => [{ id: 'conv-1', agentId: 'agent-1', clientName: 'Cliente', topic: 'Test', status: 'active', startTime: '2026-07-02T10:00:00.000Z', messages: [] }],
  fetchConversationMessages: async () => [{ id: 'msg-1', conversationId: 'conv-1', sender: 'client', text: 'Hola', time: '2026-07-02T10:01:00.000Z', source: 'whatsapp' }],
  postConversationIntervention: async (_conversationId: string, payload: { sender: string; text: string; time: string }) => ({
    id: 'msg-2',
    conversationId: 'conv-1',
    sender: payload.sender as 'supervisor' | 'supervisor_as_agent',
    text: payload.text,
    time: payload.time,
    source: 'dashboard',
  }),
  updateConversationStatus: async (_conversationId: string, status: string) => ({
    id: 'conv-1',
    agentId: 'agent-1',
    clientName: 'Cliente',
    topic: 'Test',
    status: status as 'active' | 'waiting' | 'closed',
    startTime: '2026-07-02T10:00:00.000Z',
  }),
  postWhatsAppWebhook: async (payload: { externalMessageId: string; phoneNumber: string; text: string; timestamp: string; conversationId?: string; agentId?: string }) => ({
    id: 'msg-3',
    conversationId: payload.conversationId ?? 'conv-1',
    sender: 'client',
    text: payload.text,
    time: payload.timestamp,
    source: 'whatsapp',
    externalMessageId: payload.externalMessageId,
  }),
};

const app = createApp(fakeDatabaseService, fakeDatabaseInitializer, fakeConversationService as any);

test('GET /api/agents returns agent list', async () => {
  const res = await request(app).get('/api/agents');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert(Array.isArray(res.body.data));
});

test('GET /api/agents/:agentId/conversations returns conversations', async () => {
  const res = await request(app).get('/api/agents/agent-1/conversations');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert(Array.isArray(res.body.data));
});

test('GET /api/conversations/:conversationId/messages returns messages', async () => {
  const res = await request(app).get('/api/conversations/conv-1/messages');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert(Array.isArray(res.body.data));
});

test('POST /api/conversations/:conversationId/interventions returns created message', async () => {
  const res = await request(app)
    .post('/api/conversations/conv-1/interventions')
    .send({ sender: 'supervisor', text: 'Test intervention', time: '10:02' });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.sender, 'supervisor');
});

test('PATCH /api/conversations/:conversationId updates status', async () => {
  const res = await request(app)
    .patch('/api/conversations/conv-1')
    .send({ status: 'closed' });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.status, 'closed');
});

test('POST /api/whatsapp/webhook returns success', async () => {
  const res = await request(app)
    .post('/api/whatsapp/webhook')
    .send({ externalMessageId: 'wa-999', phoneNumber: '+123', text: 'Hola', timestamp: '2026-07-02T10:03:00.000Z', conversationId: 'conv-1' });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.externalMessageId, 'wa-999');
});
