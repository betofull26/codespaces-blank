import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAgent, validateConversation, validateMessage } from './models.js';

test('validateAgent rejects missing required fields', () => {
  assert.throws(() => validateAgent({ id: '', name: '', role: '' } as never), /id/);
});

test('validateConversation validates required fields', () => {
  const conversation = {
    id: 'conv-1',
    userId: 'user-1',
    contactId: 'contact-1',
    clientName: 'Ana',
    topic: 'Soporte',
    status: 'active' as const,
    startTime: '2026-07-02T10:00:00.000Z',
  };

  assert.doesNotThrow(() => validateConversation(conversation));
});

test('validateMessage rejects invalid channel', () => {
  assert.throws(() => validateMessage({ id: 'msg-1', conversationId: 'conv-1', contentType: 'text', channel: 'invalid' as any, createdAt: '2026-07-02T10:00:00.000Z' } as never), /channel/);
});
