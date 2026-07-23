import type { AgentModel, ConversationModel, MessageModel, UserModel, AuthUserModel, AuditLogModel, SessionModel, DeviceModel } from './models.js';

export interface AgentRepository {
  list(): Promise<AgentModel[]>;
  getById(id: string): Promise<AgentModel | null>;
  create(agent: AgentModel): Promise<AgentModel>;
}

export interface ConversationRepository {
  list(): Promise<ConversationModel[]>;
  getById(id: string): Promise<ConversationModel | null>;
  getByAgentId(agentId: string): Promise<ConversationModel[]>;
  getByClientPhone(phone: string): Promise<ConversationModel | null>;
  create(conversation: ConversationModel): Promise<ConversationModel>;
}

export interface MessageRepository {
  listByConversationId(conversationId: string): Promise<MessageModel[]>;
  create(message: MessageModel): Promise<MessageModel>;
}

export interface UserRepository {
  listUsers(): Promise<UserModel[]>;
  getUserById(id: string): Promise<UserModel | null>;
  getUserByUsername(username: string): Promise<UserModel | null>;
  createUser(user: UserModel): Promise<UserModel>;
  updateUser(user: UserModel): Promise<UserModel>;
  updateUserRole(id: string, role: AuthUserModel['role'], actorId: string): Promise<UserModel | null>;
  updateUserStatus(id: string, status: AuthUserModel['status']): Promise<UserModel | null>;
  deleteUser(id: string): Promise<void>;
  createAuditLog(entry: AuditLogModel): Promise<void>;
  createSession(session: SessionModel): Promise<void>;
  getSessionByTokenHash(tokenHash: string): Promise<SessionModel | null>;
  revokeSession(tokenHash: string): Promise<void>;
  getAuthUserByUsername?(username: string): Promise<AuthUserModel | null>;
  getAuthUserByUserId?(userId: string): Promise<AuthUserModel | null>;
  upsertAuthUser?(authUser: AuthUserModel): Promise<AuthUserModel>;
  listDevices(): Promise<DeviceModel[]>;
  getDeviceByUserId(userId: string): Promise<DeviceModel | null>;
  upsertDevice?(device: DeviceModel): Promise<DeviceModel>;
}

export interface AuthenticatedUser {
  userId: string;
  role: AuthUserModel['role'];
}

export interface ContactRepository {
  listByAgent(agentId: string): Promise<{ id: string; name: string; phone: string; company: string | null; position: string | null; createdAt: string }[]>;
  listAllContacts(): Promise<{ id: string; name: string; phone: string; company: string | null; position: string | null; createdAt: string; agentId: string | null }[]>;
  create(agentId: string | null, name: string, phone: string, company: string | null, position: string | null): Promise<{ id: string; agentId: string | null; name: string; phone: string; company: string | null; position: string | null; createdAt: string }>;
  update(contactId: string, name: string, phone: string, company: string | null, position: string | null): Promise<{ id: string; agentId: string | null; name: string; phone: string; company: string | null; position: string | null; createdAt: string }>;
  delete(contactId: string): Promise<void>;
}
