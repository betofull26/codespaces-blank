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
  agentId: string;
  clientName: string;
  topic: string;
  status: 'active' | 'closed' | 'waiting';
  startTime: string;
}

export interface MessageModel {
  id: string;
  conversationId: string;
  sender: 'agent' | 'client' | 'supervisor' | 'supervisor_as_agent';
  text: string;
  time: string;
  source?: 'whatsapp' | 'dashboard' | 'internal';
  externalMessageId?: string | null;
}

export interface CustomerModel {
  id: string;
  name: string;
  phone?: string | null;
}

export interface UserModel {
  id: string;
  fullName: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'agent' | 'supervisor';
  status: 'active' | 'inactive' | 'suspended';
  accessToPanel: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogModel {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  details: string;
  createdAt: string;
}

export interface SessionModel {
  id: string;
  userId: string;
  tokenHash: string;
  role: 'admin' | 'agent' | 'supervisor';
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
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
  assertRequired(conversation.agentId, 'agentId');
  assertRequired(conversation.clientName, 'clientName');
  assertRequired(conversation.topic, 'topic');
  assertRequired(conversation.status, 'status');
  assertRequired(conversation.startTime, 'startTime');
};

export const validateMessage = (message: MessageModel) => {
  assertRequired(message.id, 'id');
  assertRequired(message.conversationId, 'conversationId');
  assertRequired(message.sender, 'sender');
  if (!['agent', 'client', 'supervisor', 'supervisor_as_agent'].includes(message.sender)) {
    throw new Error('sender is invalid');
  }
  assertRequired(message.text, 'text');
  assertRequired(message.time, 'time');
};

export const validateCustomer = (customer: CustomerModel) => {
  assertRequired(customer.id, 'id');
  assertRequired(customer.name, 'name');
};

export const validateUser = (user: UserModel) => {
  assertRequired(user.id, 'id');
  assertRequired(user.fullName, 'fullName');
  assertRequired(user.username, 'username');
  assertRequired(user.passwordHash, 'passwordHash');
  assertRequired(user.role, 'role');
  assertRequired(user.status, 'status');
  assertRequired(user.accessToPanel, 'accessToPanel');
};
