import { useState, useRef, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X, MessageSquare, Clock, User, CheckCircle2, Loader2,
  Circle, ChevronRight,
  Send,
} from "lucide-react";
import { fetchAgentConversations, fetchConversationMessages, postConversationIntervention } from "../../services/dashboardApi";
import type { Agent, Conversation, ChatMessage } from "./types";

/* ─── Local supervisor message type ─────────────────── */
interface SupervisorMsg {
  id: string;
  sender: "supervisor" | "supervisor_as_agent";
  text: string;
  time: string;
}

type AnyMessage = ChatMessage | SupervisorMsg;

function isSupervisor(m: AnyMessage): m is SupervisorMsg {
  return m.sender === "supervisor" || m.sender === "supervisor_as_agent";
}

/* ─── Status config ─────────────────────────────────── */
const statusConfig = {
  active:  { label: "Activa",    icon: <Circle size={9} className="fill-emerald-500 text-emerald-500" />, pill: "bg-emerald-100 text-emerald-700", border: "border-l-emerald-500" },
  waiting: { label: "En espera", icon: <Loader2 size={9} className="text-amber-500" />,                   pill: "bg-amber-100 text-amber-700",     border: "border-l-amber-400" },
  closed:  { label: "Cerrada",   icon: <CheckCircle2 size={9} className="text-slate-400" />,              pill: "bg-slate-100 text-slate-500",     border: "border-l-slate-300" },
};

/* ─── Message bubble ─────────────────────────────────── */
function MessageBubble({ msg, agentInitials }: { msg: AnyMessage; agentInitials: string }) {
  if (isSupervisor(msg)) {
    const asAgent = msg.sender === "supervisor_as_agent";
    return (
      <div className="flex flex-row-reverse items-end gap-2">
        {/* Avatar */}
        <div className={[
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
          asAgent ? "bg-blue-600 text-white" : "bg-indigo-600 text-white",
        ].join(" ")}>
          SS
        </div>
        <div className="flex flex-col items-end gap-1 max-w-[72%]">
          {/* Badge */}
          <div className="flex items-center gap-1">
            {asAgent
              ? <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700"><Zap size={9} />Intervención · como agente</span>
              : <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700"><Shield size={9} />Supervisor</span>
            }
          </div>
          <div className={[
            "rounded-2xl rounded-br-sm px-3.5 py-2 text-sm leading-relaxed shadow-sm",
            asAgent
              ? "bg-blue-600 text-white ring-2 ring-blue-300"
              : "bg-indigo-600 text-white",
          ].join(" ")}>
            {msg.text}
          </div>
          <p className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock size={9} />{msg.time}
          </p>
        </div>
      </div>
    );
  }

  const isAgent = msg.sender === "agent";
  return (
    <div className={['flex items-end gap-2', isAgent ? "flex-row-reverse" : "flex-row"].join(" ")}>
      <div className={['flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold', isAgent ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"].join(" ")}>
        {isAgent ? agentInitials : <User size={12} />}
      </div>
      <div className="max-w-[72%]">
        <div className={['rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
          isAgent ? "rounded-br-sm bg-blue-600 text-white" : "rounded-bl-sm bg-slate-100 text-slate-800",
        ].join(" ")}>
          {msg.text}
        </div>
        <div className={['mt-1 flex items-center gap-2 text-[10px] text-slate-400',
          isAgent ? "justify-end" : "justify-start",
        ].join(" ")}>
          <span className="flex items-center gap-1">
            <Clock size={9} />{msg.time}
          </span>
          {msg.source === "whatsapp" && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              WhatsApp
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Intervention bar ───────────────────────────────── */
type InterventionMode = "supervisor" | "supervisor_as_agent";

function InterventionBar({ onSend }: { onSend: (text: string, mode: InterventionMode) => void }) {
  const [text, setText] = useState("");
  const [mode] = useState<InterventionMode>("supervisor");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim(), mode);
    setText("");
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t px-4 py-3 transition-colors border-indigo-200 bg-indigo-50">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[11px] text-slate-500">Enviar mensaje al cliente</span>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex flex-1 items-end rounded-xl border border-indigo-300 bg-white px-3 py-2.5 transition-colors focus-within:border-indigo-500">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder="Escribe un mensaje... (Enter para enviar)"
            className="w-full resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            style={{ minHeight: "22px", maxHeight: "100px" }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-40"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

/* ─── Conversation list item ─────────────────────────── */
function ConvListItem({ conv, selected, onClick }: { conv: Conversation; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={["flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors", selected ? "bg-blue-50" : "hover:bg-slate-50"].join(" ")}
    >
      <div className={["mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", conv.status === "active" ? "bg-emerald-100 text-emerald-600" : conv.status === "waiting" ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"].join(" ")}>
        <MessageSquare size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-slate-800">{conv.clientName}</p>
          <span className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
            <Clock size={9} />{conv.startTime}
          </span>
        </div>
      </div>
      {selected && <ChevronRight size={14} className="mt-2 shrink-0 text-blue-500" />}
    </button>
  );
}


/* ─── Main modal ─────────────────────────────────────── */
interface AgentChatTreeProps {
  agent: Agent;
  open: boolean;
  onClose: () => void;
}

export function AgentChatTree({ agent, open, onClose }: AgentChatTreeProps) {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>({});
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [interventionError, setInterventionError] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Supervisor messages per conversation
  const [supervisorMsgs, setSupervisorMsgs] = useState<Record<string, SupervisorMsg[]>>({});

  useEffect(() => {
    let active = true;
    const loadConversations = async () => {
      setIsLoadingConversations(true);
      setConversationsError(null);

      try {
        const data = await fetchAgentConversations(agent.id);
        if (!active) return;
        setConversations(data);
        setSelectedConvId(data[0]?.id ?? null);
      } catch (error) {
        if (!active) return;
        console.error("Error fetching conversations:", error);
        setConversationsError(error instanceof Error ? error.message : "Error al cargar conversaciones");
        const fallbackConversations = agent.conversations ?? [];
        setConversations(fallbackConversations);
        setSelectedConvId(fallbackConversations[0]?.id ?? null);
      } finally {
        if (active) setIsLoadingConversations(false);
      }
    };

    loadConversations();

    return () => {
      active = false;
    };
  }, [agent.id, agent.conversations]);

  const selectedConv = conversations.find((c) => c.id === selectedConvId) ?? null;

  useEffect(() => {
    if (!selectedConvId && conversations.length > 0) {
      setSelectedConvId(conversations[0].id);
    }
  }, [conversations, selectedConvId]);

  useEffect(() => {
    if (!selectedConvId) {
      return;
    }

    let active = true;
    const loadMessages = async () => {
      try {
        const data = await fetchConversationMessages(selectedConvId);
        if (!active) return;
        setMessagesByConversation((prev) => ({ ...prev, [selectedConvId]: data }));
        setConversations((prev) => prev.map((conv) => (conv.id === selectedConvId ? { ...conv, messages: data } : conv)));
      } catch (error) {
        if (!active) return;
        console.error("Error fetching conversation messages:", error);
        setMessagesByConversation((prev) => ({ ...prev, [selectedConvId]: [] }));
      }
    };

    loadMessages();

    return () => {
      active = false;
    };
  }, [selectedConvId]);

  // Merge original + supervisor messages for display
  const allMessages: AnyMessage[] = selectedConv
    ? [...(selectedConv.messages ?? []), ...(supervisorMsgs[selectedConv.id] ?? [])]
    : [];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  const handleIntervene = async (text: string, mode: InterventionMode) => {
    if (!selectedConvId) return;
    const time = new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
    const msg: SupervisorMsg = {
      id:     `sv-${Date.now()}`,
      sender: mode,
      text,
      time,
    };

    setSupervisorMsgs((prev) => ({ ...prev, [selectedConvId]: [...(prev[selectedConvId] ?? []), msg] }));
    setInterventionError(null);

    try {
      await postConversationIntervention(selectedConvId, { sender: mode, text, time });
    } catch (error) {
      console.error("Error posting intervention:", error);
      setInterventionError(error instanceof Error ? error.message : "No se pudo enviar la intervención");
    }
  };

  const totalInterventions = Object.values(supervisorMsgs).reduce((a, m) => a + m.length, 0);

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed right-0 top-0 z-50 flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl focus:outline-none"
          aria-describedby={undefined}
        >
          {/* ── Header ── */}
          <div className="flex items-center gap-4 border-b border-slate-200 bg-white px-5 py-4">
            <div className="relative shrink-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white shadow">
                {agent.initials}
              </div>
              <span className={["absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white", agent.online ? "bg-emerald-500" : "bg-slate-400"].join(" ")} />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-base font-bold text-slate-800">{agent.name}</Dialog.Title>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-xs text-slate-500">
                  {agent.role} · {conversations.length} conversación{conversations.length !== 1 ? "es" : ""}
                </p>
                {totalInterventions > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                    <Shield size={12} /> {totalInterventions} intervención{totalInterventions !== 1 ? "es" : ""}
                  </span>
                )}
                  <span className={["flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", agent.online ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"].join(" ")}>
                    <span className={["h-2 w-2 rounded-full", agent.online ? "bg-emerald-500" : "bg-slate-400"].join(" ")} />
                  {agent.online ? "Conectado" : "Desconectado"}
                </span>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* ── Body ── */}
          {isLoadingConversations ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 size={40} className="animate-spin opacity-40" />
              <p className="text-sm">Cargando conversaciones...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
              <MessageSquare size={40} className="opacity-30" />
              <p className="text-sm">Este agente no tiene conversaciones registradas</p>
            </div>
          ) : (
            <div className="flex flex-1 overflow-hidden">

              {/* ── Left: conversation list ── */}
              <div className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
                <div className="border-b border-slate-200 px-4 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Historial completo</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {conversations.map((conv) => (
                    <ConvListItem
                      key={conv.id}
                      conv={conv}
                      selected={selectedConvId === conv.id}
                      onClick={() => setSelectedConvId(conv.id)}
                    />
                  ))}
                </div>

              </div>

              {/* ── Right: detail panel ── */}
              {selectedConv ? (
                <div className="flex flex-1 flex-col overflow-hidden">

                  {/* Conversation header with tabs */}
                  <div className={["border-b-2 border-l-4 px-5 pt-3 pb-0", statusConfig[selectedConv.status].border, "border-b-slate-100"].join(" ")}>
                    <div className="mb-2">
                      <p className="text-sm font-bold text-slate-800">{selectedConv.clientName}</p>
                    </div>

                    <div className="flex items-center gap-2 pb-2">
                      {(supervisorMsgs[selectedConv.id]?.length ?? 0) > 0 && (
                        <span className="flex h-6 items-center gap-1 rounded-full bg-indigo-100 px-3 text-[11px] font-semibold text-indigo-700">
                          {supervisorMsgs[selectedConv.id]?.length} intervención{(supervisorMsgs[selectedConv.id]?.length ?? 0) !== 1 ? "es" : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-5 py-4">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="h-px flex-1 bg-slate-200" />
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock size={10} />Inicio: {selectedConv.startTime}
                      </span>
                      <span className="h-px flex-1 bg-slate-200" />
                    </div>
                    <div className="space-y-4">
                      {allMessages.map((msg) => (
                        <MessageBubble key={msg.id} msg={msg} agentInitials={agent.initials} />
                      ))}
                    </div>
                    {selectedConv.status === "closed" && (supervisorMsgs[selectedConv.id]?.length ?? 0) === 0 && (
                      <div className="mt-6 flex items-center gap-2">
                        <span className="h-px flex-1 bg-slate-200" />
                        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-500">
                          <CheckCircle2 size={10} />Conversación finalizada
                        </span>
                        <span className="h-px flex-1 bg-slate-200" />
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Intervention bar */}
                  {interventionError && (
                    <div className="p-4 text-sm text-rose-700">
                      {interventionError}
                    </div>
                  )}
                  <InterventionBar onSend={handleIntervene} />

                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center text-slate-400">
                  <p className="text-sm">Selecciona una conversación</p>
                </div>
              )}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
