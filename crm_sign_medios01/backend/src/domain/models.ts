export interface AgentModel {
  id: string;
  name: string;
  role: string;
  phone?: string | null;
  avatar?: string | null;
  initials?: string | null;
  online: boolean;
}

export interface ConversationModel {
  id: string;
  userId: string;
  contactId: string | null;
  clientName: string;
  topic: string;
  status: 'active' | 'closed' | 'waiting';
  startTime: string;
  phone?: string | null;
}

export interface MessageModel {
  id: string;
  conversationId: string;
  contentType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker';
  textBody?: string | null;
  mediaFileId?: string | null;
  channel: 'whatsapp' | 'dashboard' | 'internal';
  createdAt: string;
  externalMessageId?: string | null;
  sender?: 'agent' | 'customer' | 'supervisor' | 'supervisor_as_agent';
  text?: string;
  time?: string;
  source?: string;
}

export interface CustomerModel {
  id: string;
  name: string;
  phone?: string | null;
}

export interface DeviceModel {
  id: string;
  userId: string;
  brandModel?: string | null;
  serialNumber1?: string | null;
  serialNumber2?: string | null;
  assignedPhone?: string | null;
}

export interface UserProfileModel {
  id: string;
  fullName: string;
  position?: string | null;
  entryDate?: string | null;
  foto?: string | null;
  initials?: string | null;
  online: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export type UserModel = UserProfileModel;

export interface AuthUserModel {
  id: string;
  userId: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'agent' | 'supervisor';
  status: 'active' | 'inactive' | 'suspended';
  accessToPanel: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface UserWithAuthModel extends UserProfileModel {
  authId: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'agent' | 'supervisor';
  status: 'active' | 'inactive' | 'suspended';
  accessToPanel: boolean;
}

export interface AuditLogModel {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  details: string;
  createdAt: string;
}

export interface MediaFileModel {
  id: string;
  messageId: string;
  fileName: string;
  mimeType: string;
  fileType: 'sticker' | 'emoji' | 'image' | 'video' | 'audio' | 'document';
  filePath: string;
  fileSize?: number | null;
  createdAt: string;
}

export interface SessionModel {
  id: string;
  authUserId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  updatedAt?: string | null;
  revokedAt?: string | null;
}

const assertRequired = (value: unknown, fieldName: string) => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return;
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    return;
  }

  throw new Error(`${fieldName} is required`);
};

export const validateAgent = (agent: AgentModel) => {
  assertRequired(agent.id, 'id');
  assertRequired(agent.name, 'name');
  assertRequired(agent.role, 'role');
  assertRequired(agent.online, 'online');
};

export const validateConversation = (conversation: ConversationModel) => {
  assertRequired(conversation.id, 'id');
  assertRequired(conversation.userId, 'userId');
  if (conversation.contactId !== null && conversation.contactId !== undefined) {
    assertRequired(conversation.contactId, 'contactId');
  }
  assertRequired(conversation.clientName, 'clientName');
  assertRequired(conversation.topic, 'topic');
  assertRequired(conversation.status, 'status');
  assertRequired(conversation.startTime, 'startTime');
};

export const validateMessage = (message: MessageModel) => {
  assertRequired(message.id, 'id');
  assertRequired(message.conversationId, 'conversationId');
  assertRequired(message.contentType, 'contentType');
  assertRequired(message.channel, 'channel');
  if (!['whatsapp', 'dashboard', 'internal'].includes(message.channel)) {
    throw new Error('channel is invalid');
  }
  assertRequired(message.createdAt, 'createdAt');
};

export const validateCustomer = (customer: CustomerModel) => {
  assertRequired(customer.id, 'id');
  assertRequired(customer.name, 'name');
};

export const validateUser = (user: UserModel) => {
  assertRequired(user.id, 'id');
  assertRequired(user.fullName, 'fullName');
  assertRequired(user.createdAt, 'createdAt');
};
