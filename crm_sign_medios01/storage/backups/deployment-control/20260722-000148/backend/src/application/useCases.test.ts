import test from 'node:test';
import assert from 'node:assert/strict';
import { createMessage, ingestWhatsAppMessage } from './useCases.js';
import type { ConversationRepository, MessageRepository } from '../domain/repositories.js';
import type { ConversationModel, MessageModel } from '../domain/models.js';

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

test('ingestWhatsAppMessage creates a conversation and a message for inbound WhatsApp payloads', async () => {
  const conversations: ConversationModel[] = [];
  const conversationRepository: ConversationRepository = {
    list: async () => conversations,
    getById: async (id) => conversations.find((conversation) => conversation.id === id) ?? null,
    getByAgentId: async () => [],
    getByClientPhone: async (phone) => conversations.find((conversation) => conversation.phone === phone) ?? null,
    create: async (conversation) => {
      conversations.push(conversation);
      return conversation;
    },
  };

  const messages: MessageModel[] = [];
  const messageRepository: MessageRepository = {
    listByConversationId: async () => [],
    create: async (message) => {
      messages.push(message);
      return message;
    },
  };

  const result = await ingestWhatsAppMessage(conversationRepository, messageRepository, {
    phone: '+58 412-111-1111',
    clientName: 'Ana Pérez',
    text: 'Hola, necesito ayuda',
    timestamp: '2026-07-03T00:00:00.000Z',
  });

  assert.equal(conversations.length, 1);
  assert.equal(messages.length, 1);
  assert.equal(result.conversation.phone, '+58 412-111-1111');
  assert.equal(result.message.sender, 'client');
});

