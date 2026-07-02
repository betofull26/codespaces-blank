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
  fetchAgents: async () => [
    { id: 'agent-1', name: 'Carlos Mendoza', role: 'agent', phone: '+58 412-555-0101', avatar: null, initials: 'CM', online: true },
  ],
  fetchAgentConversations: async (agentId: string) => [
    {
      id: 'conv-1',
      agentId,
      clientName: 'Ana Pérez',
      topic: 'Solicitud de presupuesto',
      status: 'active',
      startTime: '2026-07-02T09:18:00.000Z',
      messages: [
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          sender: 'client',
          text: 'Hola, necesito información sobre el servicio.',
          time: '2026-07-02T09:19:00.000Z',
          source: 'whatsapp',
          externalMessageId: 'wa-123',
        },
      ],
    },
  ],
  fetchConversationMessages: async (conversationId: string) => [
    {
      id: 'msg-1',
      conversationId,
      sender: 'client',
      text: 'Hola, necesito información sobre el servicio.',
      time: '2026-07-02T09:19:00.000Z',
      source: 'whatsapp',
      externalMessageId: 'wa-123',
    },
  ],
  postConversationIntervention: async (_conversationId: string, payload: { sender: string; text: string; time: string }) => ({
    id: 'msg-2',
    conversationId: 'conv-1',
    sender: payload.sender as 'supervisor' | 'supervisor_as_agent',
    text: payload.text,
    time: payload.time,
    source: 'dashboard',
    externalMessageId: null,
  }),
  updateConversationStatus: async (conversationId: string, status: string) => ({
    id: conversationId,
    agentId: 'agent-1',
    clientName: 'Ana Pérez',
    topic: 'Solicitud de presupuesto',
    status: status as 'active' | 'waiting' | 'closed',
    startTime: '2026-07-02T09:18:00.000Z',
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

const app = createApp(fakeDatabaseService, fakeDatabaseInitializer, fakeConversationService);

test('GET /api/health returns success', async () => {
  const res = await request(app).get('/api/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data?.status, 'ok');
});

test('GET /api/database/status returns database health', async () => {
  const res = await request(app).get('/api/database/status');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data?.connected, true);
});

test('POST /api/database/bootstrap returns initialized', async () => {
  const res = await request(app).post('/api/database/bootstrap');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.message, 'Base de datos inicializada correctamente');
});

test('GET /api/agents returns agent list', async () => {
  const res = await request(app).get('/api/agents');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(Array.isArray(res.body.data), true);
  assert.strictEqual(res.body.data[0]?.id, 'agent-1');
});

test('GET /api/agents/:agentId/conversations returns conversations for an agent', async () => {
  const res = await request(app).get('/api/agents/agent-1/conversations');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data[0]?.agentId, 'agent-1');
});

test('GET /api/conversations/:conversationId/messages returns messages', async () => {
  const res = await request(app).get('/api/conversations/conv-1/messages');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data[0]?.conversationId, 'conv-1');
});

test('POST /api/conversations/:conversationId/interventions creates a supervisor message', async () => {
  const res = await request(app)
    .post('/api/conversations/conv-1/interventions')
    .send({ sender: 'supervisor', text: 'Hola', time: '2026-07-02T10:00:00.000Z' });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data?.sender, 'supervisor');
});

test('PATCH /api/conversations/:conversationId updates conversation status', async () => {
  const res = await request(app)
    .patch('/api/conversations/conv-1')
    .send({ status: 'closed' });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data?.status, 'closed');
});

test('POST /api/whatsapp/webhook processes a webhook payload', async () => {
  const res = await request(app)
    .post('/api/whatsapp/webhook')
    .send({ externalMessageId: 'wa-999', phoneNumber: '+58 414-555-0102', text: 'Hola', timestamp: '2026-07-02T11:00:00.000Z', conversationId: 'conv-1' });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data?.source, 'whatsapp');
});

test('POST /api/whatsapp/webhook forwards timestamp as time to the service', async () => {
  let receivedPayload: any = null;
  const localApp = createApp(fakeDatabaseService, fakeDatabaseInitializer, {
    ...fakeConversationService,
    postWhatsAppWebhook: async (payload: any) => {
      receivedPayload = payload;
      return {
        id: 'msg-4',
        conversationId: payload.conversationId ?? 'conv-1',
        sender: 'client',
        text: payload.text,
        time: payload.time,
        source: 'whatsapp',
        externalMessageId: payload.externalMessageId,
      };
    },
  });

  const timestamp = '2026-07-02T12:00:00.000Z';
  const res = await request(localApp)
    .post('/api/whatsapp/webhook')
    .send({ externalMessageId: 'wa-1000', phoneNumber: '+58 414-555-0102', text: 'Hola', timestamp, conversationId: 'conv-1' });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(receivedPayload?.time, timestamp);
  assert.strictEqual(receivedPayload?.timestamp, undefined);
});
