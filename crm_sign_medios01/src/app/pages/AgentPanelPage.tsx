import { useState } from "react";
import { ChatSidebar } from "../components/agent/ChatSidebar";
import { ChatView } from "../components/agent/ChatView";
import { panelConversations } from "../components/agent/agentPanelData";
import type { PanelConversation, PanelMessage } from "../components/agent/agentPanelData";

export function AgentPanelPage() {
  const [selectedId, setSelectedId] = useState<string | null>(panelConversations[0]?.id ?? null);

  const [localMessages, setLocalMessages] = useState<Record<string, PanelMessage[]>>(
    () => Object.fromEntries(panelConversations.map((c) => [c.id, c.messages]))
  );

  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setReadIds((prev) => new Set([...prev, id]));
  };

  const handleUpdateMessages = (convId: string, msgs: PanelMessage[]) => {
    setLocalMessages((prev) => ({ ...prev, [convId]: msgs }));
  };

  const conversations: PanelConversation[] = panelConversations.map((c) => ({
    ...c,
    unreadCount: readIds.has(c.id) ? 0 : c.unreadCount,
    lastMessage:
      localMessages[c.id]?.length
        ? localMessages[c.id][localMessages[c.id].length - 1].text
        : c.lastMessage,
  }));

  const selectedConv = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <ChatSidebar
        conversations={conversations}
        selectedId={selectedId}
        onSelect={handleSelect}
      />
      <ChatView
        conv={selectedConv}
        localMessages={selectedId ? (localMessages[selectedId] ?? []) : []}
        onUpdateMessages={handleUpdateMessages}
      />
    </div>
  );
}
