import type { AgentModel, ConversationModel, MessageModel, UserModel, UserCredentialsModel, AuditLogModel } from './models.js';

export interface AgentRepository {
  list(): Promise<AgentModel[]>;
  getById(id: string): Promise<AgentModel | null>;
  create(agent: AgentModel): Promise<AgentModel>;
}

export interface ConversationRepository {
  list(): Promise<ConversationModel[]>;
  getById(id: string): Promise<ConversationModel | null>;
  getByAgentId(agentId: string): Promise<ConversationModel[]>;
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
  getCredentialsByUsername(username: string): Promise<UserCredentialsModel | null>;
  createUser(user: UserModel): Promise<UserModel>;
  updateUser(user: UserModel): Promise<UserModel>;
  updateUserRole(id: string, role: UserModel['role'], actorId: string): Promise<UserModel | null>;
  updateUserStatus(id: string, status: UserModel['status']): Promise<UserModel | null>;
  deleteUser(id: string): Promise<void>;
  upsertCredentials(credentials: UserCredentialsModel): Promise<UserCredentialsModel>;
  createAuditLog(entry: AuditLogModel): Promise<void>;
}
