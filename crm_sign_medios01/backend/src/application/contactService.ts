import type { ContactRepository } from '../domain/repositories.js';

export interface ContactInput {
  userId: string | null;
  name: string;
  phone: string;
  company?: string | null;
  position?: string | null;
}

export const createContact = async (
  repository: ContactRepository,
  input: ContactInput,
): Promise<{ id: string; userId: string | null; name: string; phone: string; company: string | null; position: string | null; createdAt: string }> => {
  return repository.create(input.userId, input.name, input.phone, input.company ?? null, input.position ?? null);
};

export const updateContact = async (
  repository: ContactRepository,
  contactId: string,
  name: string,
  phone: string,
  company: string | null,
  position: string | null,
): Promise<{ id: string; userId: string | null; name: string; phone: string; company: string | null; position: string | null; createdAt: string }> => {
  return repository.update(contactId, name, phone, company, position);
};

export const listContactsByUser = async (
  repository: ContactRepository,
  userId: string,
): Promise<{ id: string; name: string; phone: string; company: string | null; position: string | null; createdAt: string }[]> => {
  return repository.listByUser(userId);
};

export const listAllContacts = async (
  repository: ContactRepository,
): Promise<{ id: string; name: string; phone: string; company: string | null; position: string | null; createdAt: string; userId: string | null }[]> => {
  return repository.listAllContacts();
};
