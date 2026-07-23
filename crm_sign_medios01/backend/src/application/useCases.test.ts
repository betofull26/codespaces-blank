import test from 'node:test';
import assert from 'node:assert/strict';
import { createConversation, createMessage, ingestWhatsAppMessage, listMessagesByConversationId, listConversationsByUser, listConversations } from './useCases.js';
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
        channel: 'whatsapp',
        createdAt: '2026-07-03T00:00:00.000Z',
      } as MessageModel),
    /contentType is required/,
  );
});

test('ingestWhatsAppMessage creates a conversation and a message for inbound WhatsApp payloads', async () => {
  const conversations: ConversationModel[] = [];
  const conversationRepository: ConversationRepository = {
    list: async () => conversations,
    getById: async (id) => conversations.find((conversation) => conversation.id === id) ?? null,
    getByUserId: async () => [],
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
  assert.equal(result.message.contentType, 'text');
  assert.equal(result.message.channel, 'whatsapp');
  assert.equal(result.message.textBody, 'Hola, necesito ayuda');
});

test('conversation helpers return the expected conversation and message sets', async () => {
  const conversations: ConversationModel[] = [
    { id: 'conv-1', userId: 'user-1', contactId: null, clientName: 'Ana Pérez', topic: 'Ayuda', status: 'active', startTime: '2026-07-03T00:00:00.000Z', phone: '+58 412-111-1111' },
  ];
  const repository: ConversationRepository = {
    list: async () => conversations,
    getById: async (id) => conversations.find((conversation) => conversation.id === id) ?? null,
    getByUserId: async (userId) => conversations.filter((conversation) => conversation.userId === userId),
    getByClientPhone: async (phone) => conversations.find((conversation) => conversation.phone === phone) ?? null,
    create: async (conversation) => {
      conversations.push(conversation);
      return conversation;
    },
  };
  const messages: MessageModel[] = [
    { id: 'msg-1', conversationId: 'conv-1', contentType: 'text', textBody: 'Hola', channel: 'whatsapp', createdAt: '2026-07-03T00:00:00.000Z' },
  ];
  const messageRepository: MessageRepository = {
    listByConversationId: async () => messages,
    create: async (message) => message,
  };

  const created = await createConversation(repository, 'user-2', null, {
    id: 'conv-2',
    clientName: 'Luis',
    topic: 'Nueva conversación',
    status: 'waiting',
    startTime: '2026-07-03T00:00:00.000Z',
    phone: '+58 412-222-2222',
  });
  const byUser = await listConversationsByUser(repository, 'user-1');
  const allConversations = await listConversations(repository);
  const conversationMessages = await listMessagesByConversationId(messageRepository, 'conv-1');

  assert.equal(created.id, 'conv-2');
  assert.equal(byUser[0]?.id, 'conv-1');
  assert.equal(allConversations.length, 2);
  assert.equal(conversationMessages[0]?.textBody, 'Hola');
});

