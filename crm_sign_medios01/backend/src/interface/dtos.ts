export interface HealthResponseDto {
  success: boolean;
  data: {
    status: 'ok';
    service: string;
    timestamp: string;
  };
  message: string;
}

export interface DatabaseStatusResponseDto {
  success: boolean;
  data: {
    connected: boolean;
    message: string;
    tables: Array<{
      name: string;
      exists: boolean;
    }>;
  };
  message: string;
}

export interface BootstrapResponseDto {
  success: boolean;
  data: null;
  message: string;
}

export interface CreateContactInput {
  userId?: string | null;
  name: string;
  phone: string;
  company?: string | null;
  position?: string | null;
}

export interface CreateConversationInput {
  userId: string;
  contactId: string | null;
  clientName: string;
  topic: string;
  status: 'active' | 'closed' | 'waiting';
  startTime: string;
  phone?: string | null;
}

export interface CreateMessageInput {
  conversationId: string;
  contentType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker';
  textBody?: string | null;
  mediaFileId?: string | null;
  channel: 'whatsapp' | 'dashboard' | 'internal';
  createdAt: string;
  externalMessageId?: string | null;
}

export interface ConversationResponseDto {
  id: string;
  userId: string;
  contactId: string | null;
  clientName: string;
  topic: string;
  status: 'active' | 'closed' | 'waiting';
  startTime: string;
  phone?: string | null;
}

export interface MessageResponseDto {
  id: string;
  conversationId: string;
  contentType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker';
  textBody?: string | null;
  mediaFileId?: string | null;
  channel: 'whatsapp' | 'dashboard' | 'internal';
  createdAt: string;
  externalMessageId?: string | null;
}
