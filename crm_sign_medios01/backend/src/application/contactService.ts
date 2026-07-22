import type { ContactRepository } from '../domain/repositories.js';

export interface ContactInput {
  agentId: string | null;
  name: string;
  phone: string;
  company?: string | null;
  position?: string | null;
}

export const createContact = async (
  repository: ContactRepository,
  input: ContactInput,
): Promise<{ id: string; agentId: string | null; name: string; phone: string; company: string | null; position: string | null; createdAt: string }> => {
  return repository.create(input.agentId, input.name, input.phone, input.company ?? null, input.position ?? null);
};

export const updateContact = async (
  repository: ContactRepository,
  contactId: string,
  name: string,
  phone: string,
  company: string | null,
  position: string | null,
): Promise<{ id: string; agentId: string | null; name: string; phone: string; company: string | null; position: string | null; createdAt: string }> => {
  return repository.update(contactId, name, phone, company, position);
};

export const listContactsByAgent = async (
  repository: ContactRepository,
  agentId: string,
): Promise<{ id: string; name: string; phone: string; company: string | null; position: string | null; createdAt: string }[]> => {
  return repository.listByAgent(agentId);
};

export const listAllContacts = async (
  repository: ContactRepository,
): Promise<{ id: string; name: string; phone: string; company: string | null; position: string | null; createdAt: string; agentId: string | null }[]> => {
  return repository.listAllContacts();
};
