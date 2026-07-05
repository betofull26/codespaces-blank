import { useEffect, useState } from "react";
import { Users, UserCheck, Search, MessageSquare, Send, Loader2, Phone, Clock } from "lucide-react";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { Sidebar } from "../components/dashboard/Sidebar";
import { KPICards } from "../components/dashboard/KPICards";
import { fetchConversationMessages, fetchConversations, postConversationIntervention } from "../services/dashboardApi";
import type { ChatMessage, Conversation } from "../components/dashboard/types";

const statusLabels: Record<Conversation["status"], string> = {
  active: "Activa",
  waiting: "En espera",
  closed: "Cerrada",
};

const statusPillClassName: Record<Conversation["status"], string> = {
  active: "bg-emerald-100 text-emerald-700",
  waiting: "bg-amber-100 text-amber-700",
  closed: "bg-slate-100 text-slate-500",
};

function MessageBubble({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) {
  return (
    <div className={isOwn ? "flex justify-end" : "flex justify-start"}>
      <div className={[
        "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
        isOwn ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800",
      ].join(" ")}>
        <p className="leading-relaxed">{msg.text}</p>
        <div className={[
          "mt-1 flex items-center gap-2 text-[10px]",
          isOwn ? "justify-end text-blue-100" : "justify-start text-slate-400",
        ].join(" ")}>
          <Clock size={9} />
          <span>{msg.time}</span>
          {msg.source === "whatsapp" && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">WhatsApp</span>}
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Conversation["status"]>("all");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>({});
  const [draftMessage, setDraftMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [interventionError, setInterventionError] = useState<string | null>(null);

  useEffect(() => {
    const loadConversations = async () => {
      setIsLoadingConversations(true);
      setConversationsError(null);

      try {
        const data = await fetchConversations();
        setConversations(data);
        setSelectedConversationId((current) => current ?? data[0]?.id ?? null);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        setConversationsError(error instanceof Error ? error.message : "Error al cargar conversaciones");
        setConversations([]);
      } finally {
        setIsLoadingConversations(false);
      }
    };

    loadConversations();
  }, []);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    const loadMessages = async () => {
      try {
        const data = await fetchConversationMessages(selectedConversationId);
        setMessagesByConversation((prev) => ({ ...prev, [selectedConversationId]: data }));
      } catch (error) {
        console.error("Error fetching conversation messages:", error);
        setMessagesByConversation((prev) => ({ ...prev, [selectedConversationId]: [] }));
      }
    };

    loadMessages();
  }, [selectedConversationId]);

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId) ?? null;
  const activeConversations = conversations.filter((conversation) => conversation.status === "active").length;
  const waitingConversations = conversations.filter((conversation) => conversation.status === "waiting").length;
  const closedConversations = conversations.filter((conversation) => conversation.status === "closed").length;

  const filteredConversations = conversations.filter((conversation) => {
    const searchText = `${conversation.clientName} ${conversation.topic}`.toLowerCase();
    const matchesSearch = searchText.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || conversation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedMessages = selectedConversationId ? messagesByConversation[selectedConversationId] ?? [] : [];

  const handleSendIntervention = async () => {
    if (!selectedConversationId || !draftMessage.trim()) {
      return;
    }

    const text = draftMessage.trim();
    const time = new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
    const optimisticMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      conversationId: selectedConversationId,
      sender: "supervisor",
      text,
      time,
      source: "dashboard",
    };

    setSendingMessage(true);
    setInterventionError(null);
    setDraftMessage("");
    setMessagesByConversation((prev) => ({
      ...prev,
      [selectedConversationId]: [...(prev[selectedConversationId] ?? []), optimisticMessage],
    }));

    try {
      await postConversationIntervention(selectedConversationId, { sender: "supervisor", text, time });
    } catch (error) {
      console.error("Error posting intervention:", error);
      setMessagesByConversation((prev) => ({
        ...prev,
        [selectedConversationId]: (prev[selectedConversationId] ?? []).filter((message) => message.id !== optimisticMessage.id),
      }));
      setInterventionError(error instanceof Error ? error.message : "No se pudo enviar la intervención");
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar selectedNode="dashboard" onSelectNode={() => {}} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto px-6 py-5">
          <KPICards
            cards={[
              { icon: <Users size={20} />, label: "Conversaciones Totales", value: conversations.length, color: "blue" },
              { icon: <UserCheck size={20} />, label: "Activas", value: activeConversations, color: "emerald" },
              { icon: <MessageSquare size={20} />, label: "En espera", value: waitingConversations, color: "amber" },
              { icon: <Users size={20} />, label: "Cerradas", value: closedConversations, color: "slate" },
            ]}
          />

          {conversationsError && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Error al cargar conversaciones: {conversationsError}
            </div>
          )}

          {isLoadingConversations && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Cargando conversaciones desde el backend...
            </div>
          )}

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-slate-800">
              Conversaciones WhatsApp ({filteredConversations.length})
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar conversación..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                />
              </div>
              {(["all", "active", "waiting", "closed"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={[
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    statusFilter === filter
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {filter === "all" ? "Todas" : filter === "active" ? "Activas" : filter === "waiting" ? "En espera" : "Cerradas"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[360px,1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between px-2">
                <p className="text-sm font-semibold text-slate-800">Historial de conversaciones</p>
                <span className="text-xs text-slate-500">{filteredConversations.length} visibles</span>
              </div>

              {filteredConversations.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-slate-400">
                  No se encontraron conversaciones
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversationId(conversation.id)}
                      className={[
                        "w-full rounded-xl border p-3 text-left transition-all",
                        selectedConversationId === conversation.id
                          ? "border-blue-300 bg-blue-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">{conversation.clientName}</p>
                          <p className="mt-1 truncate text-xs text-slate-500">{conversation.topic}</p>
                        </div>
                        <span className={[
                          "rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                          statusPillClassName[conversation.status],
                        ].join(" ")}>
                          {statusLabels[conversation.status]}
                        </span>
                      </div>
                      {conversation.phone && (
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Phone size={11} />
                          <span>{conversation.phone}</span>
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Clock size={11} />
                        <span>{conversation.startTime}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              {selectedConversation ? (
                <>
                  <div className="border-b border-slate-200 px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-slate-800">{selectedConversation.clientName}</p>
                        <p className="mt-1 text-sm text-slate-500">{selectedConversation.topic}</p>
                      </div>
                      <span className={[
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        statusPillClassName[selectedConversation.status],
                      ].join(" ")}>
                        {statusLabels[selectedConversation.status]}
                      </span>
                    </div>
                    {selectedConversation.phone && (
                      <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                        <Phone size={13} />
                        <span>{selectedConversation.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex h-[520px] flex-col">
                    <div className="flex-1 space-y-3 overflow-y-auto p-4">
                      {selectedMessages.length === 0 ? (
                        <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
                          Aún no hay mensajes en esta conversación.
                        </div>
                      ) : (
                        selectedMessages.map((message) => (
                          <MessageBubble key={message.id} msg={message} isOwn={message.sender === "supervisor" || message.sender === "supervisor_as_agent"} />
                        ))
                      )}
                    </div>

                    <div className="border-t border-slate-200 p-4">
                      {interventionError && (
                        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                          {interventionError}
                        </div>
                      )}
                      <div className="flex items-end gap-2">
                        <textarea
                          rows={2}
                          value={draftMessage}
                          onChange={(event) => setDraftMessage(event.target.value)}
                          placeholder="Escribe una intervención para el cliente..."
                          className="min-h-[46px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                        />
                        <button
                          onClick={handleSendIntervention}
                          disabled={sendingMessage || !draftMessage.trim()}
                          className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white transition-opacity hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {sendingMessage ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-[520px] items-center justify-center text-sm text-slate-400">
                  Selecciona una conversación para ver el detalle
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
