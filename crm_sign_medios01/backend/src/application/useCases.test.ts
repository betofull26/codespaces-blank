import test from 'node:test';
import assert from 'node:assert/strict';
import { createMessage } from './useCases.js';
import type { MessageRepository } from '../domain/repositories.js';
import type { MessageModel } from '../domain/models.js';

test('createMessage rejects invalid payloads before persisting', async () => {
  const repository: MessageRepository = {
    listByConversationId: async () => [],
    create: async (message) => message,
  };

  await assert.rejects(
    () =>
      createMessage(repository, {
        id: 'msg-1',
        conversationId: 'conv-1',
        sender: 'agent',
        text: '',
        time: '2026-07-03T00:00:00.000Z',
      } as MessageModel),
    /text is required/,
  );
});
