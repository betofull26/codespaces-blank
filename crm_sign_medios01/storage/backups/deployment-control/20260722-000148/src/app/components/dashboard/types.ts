export interface ChatMessage {
  id: string;
  conversationId?: string;
  sender: "agent" | "client" | "supervisor" | "supervisor_as_agent";
  text: string;
  time: string;
  source?: "whatsapp" | "dashboard" | "internal";
  externalMessageId?: string;
}

export interface Conversation {
  id: string;
  agentId: string;
  clientName: string;
  topic: string;
  status: "active" | "closed" | "waiting";
  startTime: string;
  phone?: string | null;
  messages: ChatMessage[];
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  phone: string;
  avatar: string;
  initials: string;
  online: boolean;
  conversations?: Conversation[];
}
