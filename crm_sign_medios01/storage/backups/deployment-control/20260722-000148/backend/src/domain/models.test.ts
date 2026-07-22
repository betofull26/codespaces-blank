import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAgent, validateConversation, validateMessage } from './models.js';

test('validateAgent rejects missing required fields', () => {
  assert.throws(() => validateAgent({ id: '', name: '', role: '' } as never), /id/);
});

test('validateConversation validates required fields', () => {
  const conversation = {
    id: 'conv-1',
    agentId: 'agent-1',
    clientName: 'Ana',
    topic: 'Soporte',
    status: 'active' as const,
    startTime: '2026-07-02T10:00:00.000Z',
  };

  assert.doesNotThrow(() => validateConversation(conversation));
});

test('validateMessage rejects invalid sender', () => {
  assert.throws(() => validateMessage({ id: 'msg-1', conversationId: 'conv-1', sender: 'unknown', text: 'Hola', time: '2026-07-02T10:00:00.000Z' } as never), /sender/);
});
