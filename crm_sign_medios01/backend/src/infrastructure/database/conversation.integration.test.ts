import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../app.js';

const fakeDatabaseService = {
  getDatabaseHealth: async () => ({ connected: true, message: 'ok', tables: [] }),
};

const fakeDatabaseInitializer = { initializeDatabase: async () => {} };

const fakeConversationService = {
  fetchAgents: async () => [
    { id: 'agent-1', name: 'Carlos Mendoza', role: 'agent', phone: '', avatar: '', initials: 'CM', online: true },
  ],
  fetchAgentConversations: async (agentId) => [
    {
      id: 'conv-1',
      agentId,
      clientName: 'Ana Pérez',
      topic: 'Solicitud de presupuesto',
      status: 'active',
      startTime: '2026-07-02T09:18:00.000Z',
      messages: [
        { id: 'msg-1', conversationId: 'conv-1', sender: 'client', text: 'Hola', time: '2026-07-02T09:19:00.000Z', source: 'whatsapp' },
      ],
    },
  ],
  fetchConversationMessages: async (conversationId) => [
    { id: 'msg-1', conversationId, sender: 'client', text: 'Hola', time: '2026-07-02T09:19:00.000Z', source: 'whatsapp' },
  ],
  postConversationIntervention: async (conversationId, payload) => ({
    id: `sv-${Date.now()}`,
    conversationId,
    sender: payload.sender,
    text: payload.text,
    time: payload.time,
    source: 'dashboard',
  }),
  updateConversationStatus: async (conversationId, status) => ({
    id: conversationId,
    agentId: 'agent-1',
    clientName: 'Ana Pérez',
    topic: 'T',
    status,
    startTime: '2026-07-02T09:18:00.000Z',
  }),
  postWhatsAppWebhook: async (payload) => ({
    id: `wa-${Date.now()}`,
    conversationId: payload.conversationId ?? 'conv-1',
    sender: 'client',
    text: payload.text,
    time: payload.timestamp,
    source: 'whatsapp',
    externalMessageId: payload.externalMessageId,
  }),
};

const app = createApp(fakeDatabaseService, fakeDatabaseInitializer, fakeConversationService as any);

test('Integration: GET /api/agents and agent conversations flow', async () => {
  const resAgents = await request(app).get('/api/agents');
  assert.strictEqual(resAgents.status, 200);
  assert.strictEqual(resAgents.body.success, true);
  assert.ok(Array.isArray(resAgents.body.data));
  const agent = resAgents.body.data[0];
  assert.strictEqual(agent.id, 'agent-1');

  const resConvs = await request(app).get(`/api/agents/${encodeURIComponent(agent.id)}/conversations`);
  assert.strictEqual(resConvs.status, 200);
  assert.strictEqual(resConvs.body.success, true);
  assert.ok(Array.isArray(resConvs.body.data));
  const conv = resConvs.body.data[0];
  assert.strictEqual(conv.id, 'conv-1');

  const resMsgs = await request(app).get(`/api/conversations/${encodeURIComponent(conv.id)}/messages`);
  assert.strictEqual(resMsgs.status, 200);
  assert.strictEqual(resMsgs.body.success, true);
  assert.ok(Array.isArray(resMsgs.body.data));

  const interventionPayload = { sender: 'supervisor', text: 'Intervención prueba', time: '10:00' };
  const resInterv = await request(app)
    .post(`/api/conversations/${encodeURIComponent(conv.id)}/interventions`)
    .send(interventionPayload)
    .set('Content-Type', 'application/json');
  assert.strictEqual(resInterv.status, 201);
  assert.strictEqual(resInterv.body.success, true);
  assert.strictEqual(resInterv.body.data.text, 'Intervención prueba');

  const resPatch = await request(app)
    .patch(`/api/conversations/${encodeURIComponent(conv.id)}`)
    .send({ status: 'closed' })
    .set('Content-Type', 'application/json');
  assert.strictEqual(resPatch.status, 200);
  assert.strictEqual(resPatch.body.success, true);
  assert.strictEqual(resPatch.body.data.status, 'closed');

  const webhookPayload = { externalMessageId: 'wa-999', phoneNumber: '+58412', text: 'Hola via WA', timestamp: new Date().toISOString(), conversationId: conv.id };
  const resWebhook = await request(app).post('/api/whatsapp/webhook').send(webhookPayload).set('Content-Type', 'application/json');
  assert.strictEqual(resWebhook.status, 200);
  assert.strictEqual(resWebhook.body.success, true);
  assert.strictEqual(resWebhook.body.data.text, 'Hola via WA');
});
