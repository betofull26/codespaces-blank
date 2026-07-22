import test from 'node:test';
import assert from 'node:assert/strict';
import { createContact, listAllContacts, listContactsByAgent, updateContact } from './contactService.js';
import type { ContactRepository } from '../domain/repositories.js';

test('createContact delegates the payload to the contact repository', async () => {
  const createdEntries: Array<{ agentId: string | null; name: string; phone: string; company: string | null; position: string | null }> = [];
  const repository: ContactRepository = {
    listByAgent: async () => [],
    listAllContacts: async () => [],
    create: async (agentId, name, phone, company, position) => {
      createdEntries.push({ agentId, name, phone, company, position });
      return { id: 'contact-1', agentId, name, phone, company, position, createdAt: '2026-07-03T00:00:00.000Z' };
    },
    update: async () => {
      throw new Error('not used');
    },
    delete: async () => undefined,
  };

  const result = await createContact(repository, {
    agentId: 'agent-1',
    name: 'María López',
    phone: '+584141112233',
    company: 'CRM Sign',
    position: 'Directora',
  });

  assert.equal(createdEntries[0]?.name, 'María López');
  assert.equal(createdEntries[0]?.phone, '+584141112233');
  assert.equal(result.id, 'contact-1');
});

test('updateContact and list helpers preserve the latest contact state', async () => {
  const updatedEntries: Array<{ contactId: string; name: string; phone: string; company: string | null; position: string | null }> = [];
  const repository: ContactRepository = {
    listByAgent: async () => [
      { id: 'contact-2', name: 'Carla', phone: '+584149998877', company: 'Ventas', position: 'Ejecutiva', createdAt: '2026-07-03T00:00:00.000Z' },
    ],
    listAllContacts: async () => [
      { id: 'contact-2', agentId: 'agent-1', name: 'Carla', phone: '+584149998877', company: 'Ventas', position: 'Ejecutiva', createdAt: '2026-07-03T00:00:00.000Z' },
    ],
    create: async () => {
      throw new Error('not used');
    },
    update: async (contactId, name, phone, company, position) => {
      updatedEntries.push({ contactId, name, phone, company, position });
      return { id: contactId, agentId: 'agent-1', name, phone, company, position, createdAt: '2026-07-03T00:00:00.000Z' };
    },
    delete: async () => undefined,
  };

  const updated = await updateContact(repository, 'contact-2', 'Carla Actualizada', '+584148888777', 'Ventas', 'Gerente');
  const byAgent = await listContactsByAgent(repository, 'agent-1');
  const allContacts = await listAllContacts(repository);

  assert.equal(updated.name, 'Carla Actualizada');
  assert.equal(updatedEntries[0]?.phone, '+584148888777');
  assert.equal(byAgent[0]?.id, 'contact-2');
  assert.equal(allContacts[0]?.agentId, 'agent-1');
});
