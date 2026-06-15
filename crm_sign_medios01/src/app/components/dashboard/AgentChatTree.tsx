import { useState, useRef, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X, MessageSquare, Clock, User, CheckCircle2, Loader2,
  Circle, ChevronRight, StickyNote, Pin, PinOff,
  Plus, Send, Trash2, AlertCircle, Lock, Shield,
  Zap, ChevronDown,
} from "lucide-react";
import type { Agent, Conversation, ChatMessage, InternalNote } from "./AgentCard";

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
    <div className={["flex items-end gap-2", isAgent ? "flex-row-reverse" : "flex-row"].join(" ")}>
      <div className={["flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold", isAgent ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"].join(" ")}>
        {isAgent ? agentInitials : <User size={12} />}
      </div>
      <div className={["max-w-[72%]", isAgent ? "items-end" : "items-start"].join(" ")}>
        <div className={["rounded-2xl px-3.5 py-2 text-sm leading-relaxed", isAgent ? "rounded-br-sm bg-blue-600 text-white" : "rounded-bl-sm bg-slate-100 text-slate-800"].join(" ")}>
          {msg.text}
        </div>
        <p className={["mt-1 flex items-center gap-1 text-[10px] text-slate-400", isAgent ? "justify-end" : "justify-start"].join(" ")}>
          <Clock size={9} />{msg.time}
        </p>
      </div>
    </div>
  );
}

/* ─── Intervention bar ───────────────────────────────── */
type InterventionMode = "supervisor" | "supervisor_as_agent";

function InterventionBar({ onSend }: { onSend: (text: string, mode: InterventionMode) => void }) {
  const [text, setText]     = useState("");
  const [mode, setMode]     = useState<InterventionMode>("supervisor");
  const [menuOpen, setMenuOpen] = useState(false);
  const textareaRef         = useRef<HTMLTextAreaElement>(null);
  const menuRef             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim(), mode);
    setText("");
    textareaRef.current?.focus();
  };

  const isAsAgent = mode === "supervisor_as_agent";

  return (
    <div className={[
      "border-t px-4 py-3 transition-colors",
      isAsAgent ? "border-blue-200 bg-blue-50" : "border-indigo-200 bg-indigo-50",
    ].join(" ")}>
      {/* Mode selector */}
      <div className="mb-2 flex items-center gap-2">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={[
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              isAsAgent
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-indigo-600 text-white hover:bg-indigo-700",
            ].join(" ")}
          >
            {isAsAgent ? <><Zap size={12} /> Como agente</> : <><Shield size={12} /> Como supervisor</>}
            <ChevronDown size={11} />
          </button>

          {menuOpen && (
            <div className="absolute bottom-9 left-0 z-50 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <button
                onClick={() => { setMode("supervisor"); setMenuOpen(false); }}
                className={["flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-left transition-colors", mode === "supervisor" ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-700 hover:bg-slate-50"].join(" ")}
              >
                <Shield size={13} className="text-indigo-500" />
                <div>
                  <p className="font-semibold">Como supervisor</p>
                  <p className="text-[10px] text-slate-400">Visible con badge de Supervisor</p>
                </div>
              </button>
              <button
                onClick={() => { setMode("supervisor_as_agent"); setMenuOpen(false); }}
                className={["flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-left transition-colors", mode === "supervisor_as_agent" ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-700 hover:bg-slate-50"].join(" ")}
              >
                <Zap size={13} className="text-blue-500" />
                <div>
                  <p className="font-semibold">En nombre del agente</p>
                  <p className="text-[10px] text-slate-400">Aparece como mensaje del agente</p>
                </div>
              </button>
            </div>
          )}
        </div>

        <span className="text-[11px] text-slate-500">
          {isAsAgent
            ? "Enviando en nombre del agente — el cliente lo verá como mensaje normal"
            : "El cliente verá este mensaje del supervisor directamente"}
        </span>
      </div>

      {/* Input */}
      <div className="flex items-end gap-2">
        <div className={[
          "flex flex-1 items-end rounded-xl border px-3 py-2.5 transition-colors",
          isAsAgent ? "border-blue-300 bg-white focus-within:border-blue-500" : "border-indigo-300 bg-white focus-within:border-indigo-500",
        ].join(" ")}>
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
            placeholder={isAsAgent ? "Escribe como el agente... (Enter para enviar)" : "Escribe como supervisor... (Enter para enviar)"}
            className="w-full resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            style={{ minHeight: "22px", maxHeight: "100px" }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-all disabled:opacity-40",
            isAsAgent ? "bg-blue-600 hover:bg-blue-700" : "bg-indigo-600 hover:bg-indigo-700",
          ].join(" ")}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

/* ─── Internal Note card ─────────────────────────────── */
function NoteCard({
  note,
  onTogglePin,
  onDelete,
}: {
  note: InternalNote;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={["group relative rounded-xl border px-3.5 py-3 transition-all", note.pinned ? "border-amber-300 bg-amber-50" : "border-amber-200 bg-amber-50/60"].join(" ")}>
      {note.pinned && (
        <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-white shadow">
          <Pin size={10} />
        </div>
      )}
      <div className="mb-1.5 flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-white">
          {note.authorInitials}
        </div>
        <span className="flex-1 truncate text-xs font-semibold text-amber-900">{note.authorName}</span>
        <span className="flex items-center gap-1 text-[10px] text-amber-600">
          <Clock size={9} />{note.timestamp}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-amber-900">{note.text}</p>
      <div className="absolute right-2 bottom-2 hidden items-center gap-1 group-hover:flex">
        <button onClick={() => onTogglePin(note.id)} title={note.pinned ? "Desfijar" : "Fijar nota"}
          className="flex h-5 w-5 items-center justify-center rounded bg-amber-200 text-amber-700 transition-colors hover:bg-amber-300">
          {note.pinned ? <PinOff size={10} /> : <Pin size={10} />}
        </button>
        <button onClick={() => onDelete(note.id)} title="Eliminar nota"
          className="flex h-5 w-5 items-center justify-center rounded bg-red-100 text-red-500 transition-colors hover:bg-red-200">
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  );
}

/* ─── Conversation list item ─────────────────────────── */
function ConvListItem({ conv, selected, onClick }: { conv: Conversation; selected: boolean; onClick: () => void }) {
  const cfg = statusConfig[conv.status];
  const noteCount = conv.notes.length;
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
        <p className="mt-0.5 truncate text-xs text-slate-500">{conv.topic}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className={["inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", cfg.pill].join(" ")}>
            {cfg.icon}{cfg.label}
          </span>
          {noteCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              <StickyNote size={9} />{noteCount}
            </span>
          )}
        </div>
      </div>
      {selected && <ChevronRight size={14} className="mt-2 shrink-0 text-blue-500" />}
    </button>
  );
}

/* ─── Add Note form ──────────────────────────────────── */
function AddNoteForm({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!text.trim()) { setError("Escribe el contenido de la nota."); return; }
    onAdd(text.trim());
    setText("");
    setError("");
  };

  return (
    <div className="border-t border-amber-200 bg-amber-50/50 px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <StickyNote size={14} className="text-amber-600" />
        <span className="text-xs font-semibold text-amber-800">Agregar nota interna</span>
        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">
          <Lock size={9} /> Solo visible para el equipo
        </span>
      </div>
      <textarea
        ref={textareaRef}
        rows={3}
        value={text}
        onChange={(e) => { setText(e.target.value); setError(""); }}
        onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSubmit(); }}
        placeholder="Escribe una nota interna... (Ctrl+Enter para guardar)"
        className={["w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-1", error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-amber-200 focus:border-amber-400 focus:ring-amber-100"].join(" ")}
      />
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
          <AlertCircle size={11} />{error}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">{text.length} caracteres</span>
        <button onClick={handleSubmit} className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600">
          <Send size={12} /> Guardar nota
        </button>
      </div>
    </div>
  );
}

/* ─── Main modal ─────────────────────────────────────── */
interface AgentChatTreeProps {
  agent: Agent;
  open: boolean;
  onClose: () => void;
}

type PanelTab = "chat" | "notes";

export function AgentChatTree({ agent, open, onClose }: AgentChatTreeProps) {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(agent.conversations[0]?.id ?? null);
  const [panelTab,       setPanelTab]       = useState<PanelTab>("chat");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [localNotes, setLocalNotes] = useState<Record<string, InternalNote[]>>(
    () => Object.fromEntries(agent.conversations.map((c) => [c.id, c.notes]))
  );

  // Supervisor messages per conversation
  const [supervisorMsgs, setSupervisorMsgs] = useState<Record<string, SupervisorMsg[]>>({});

  const selectedConv = agent.conversations.find((c) => c.id === selectedConvId) ?? null;
  const currentNotes = selectedConvId ? (localNotes[selectedConvId] ?? []) : [];
  const pinnedNotes   = currentNotes.filter((n) => n.pinned);
  const unpinnedNotes = currentNotes.filter((n) => !n.pinned);

  // Merge original + supervisor messages for display
  const allMessages: AnyMessage[] = selectedConv
    ? [...selectedConv.messages, ...(supervisorMsgs[selectedConv.id] ?? [])]
    : [];

  useEffect(() => { setPanelTab("chat"); }, [selectedConvId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  const handleIntervene = (text: string, mode: InterventionMode) => {
    if (!selectedConvId) return;
    const msg: SupervisorMsg = {
      id:     `sv-${Date.now()}`,
      sender: mode,
      text,
      time:   new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
    };
    setSupervisorMsgs((prev) => ({ ...prev, [selectedConvId]: [...(prev[selectedConvId] ?? []), msg] }));
  };

  const handleAddNote = (text: string) => {
    if (!selectedConvId) return;
    const newNote: InternalNote = {
      id: `note-${Date.now()}`,
      authorName: "Supervisor SIGN",
      authorInitials: "SS",
      text,
      timestamp: new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
      pinned: false,
    };
    setLocalNotes((prev) => ({ ...prev, [selectedConvId]: [...(prev[selectedConvId] ?? []), newNote] }));
  };

  const handleTogglePin = (noteId: string) => {
    if (!selectedConvId) return;
    setLocalNotes((prev) => ({
      ...prev,
      [selectedConvId]: prev[selectedConvId].map((n) => n.id === noteId ? { ...n, pinned: !n.pinned } : n),
    }));
  };

  const handleDeleteNote = (noteId: string) => {
    if (!selectedConvId) return;
    setLocalNotes((prev) => ({
      ...prev,
      [selectedConvId]: prev[selectedConvId].filter((n) => n.id !== noteId),
    }));
  };

  const totalNotes = Object.values(localNotes).reduce((a, n) => a + n.length, 0);
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
              <p className="text-xs text-slate-500">
                {agent.role} · {agent.conversations.length} conversación{agent.conversations.length !== 1 ? "es" : ""} · {totalNotes} nota{totalNotes !== 1 ? "s" : ""} internas
              </p>
            </div>

            {/* Intervention badge */}
            {totalInterventions > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                <Shield size={12} /> {totalInterventions} intervención{totalInterventions !== 1 ? "es" : ""}
              </span>
            )}

            <span className={["flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", agent.online ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"].join(" ")}>
              <span className={["h-2 w-2 rounded-full", agent.online ? "bg-emerald-500" : "bg-slate-400"].join(" ")} />
              {agent.online ? "Conectado" : "Desconectado"}
            </span>
            <Dialog.Close asChild>
              <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* ── Body ── */}
          {agent.conversations.length === 0 ? (
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
                  {agent.conversations.map((conv) => (
                    <ConvListItem
                      key={conv.id}
                      conv={{ ...conv, notes: localNotes[conv.id] ?? conv.notes }}
                      selected={selectedConvId === conv.id}
                      onClick={() => setSelectedConvId(conv.id)}
                    />
                  ))}
                </div>

                {/* Legend */}
                <div className="border-t border-slate-200 px-4 py-3 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Leyenda de intervención</p>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-indigo-600" />
                    <span className="text-[11px] text-slate-500">Mensaje como supervisor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-600 ring-2 ring-blue-300" />
                    <span className="text-[11px] text-slate-500">En nombre del agente</span>
                  </div>
                </div>
              </div>

              {/* ── Right: detail panel ── */}
              {selectedConv ? (
                <div className="flex flex-1 flex-col overflow-hidden">

                  {/* Conversation header with tabs */}
                  <div className={["border-b-2 border-l-4 px-5 pt-3 pb-0", statusConfig[selectedConv.status].border, "border-b-slate-100"].join(" ")}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{selectedConv.clientName}</p>
                        <p className="text-xs text-slate-500">{selectedConv.topic}</p>
                      </div>
                      <span className={["rounded-full px-2.5 py-1 text-xs font-medium", statusConfig[selectedConv.status].pill].join(" ")}>
                        {statusConfig[selectedConv.status].label}
                      </span>
                    </div>

                    {/* Sub-tabs */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => setPanelTab("chat")}
                        className={["flex items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-xs font-medium transition-colors", panelTab === "chat" ? "bg-white border border-b-white border-slate-200 text-blue-700" : "text-slate-500 hover:text-slate-700"].join(" ")}
                      >
                        <MessageSquare size={12} />
                        Chat ({allMessages.length})
                        {(supervisorMsgs[selectedConv.id]?.length ?? 0) > 0 && (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white">
                            {supervisorMsgs[selectedConv.id]?.length}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setPanelTab("notes")}
                        className={["flex items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-xs font-medium transition-colors", panelTab === "notes" ? "bg-amber-50 border border-b-amber-50 border-amber-200 text-amber-700" : "text-slate-500 hover:text-slate-700"].join(" ")}
                      >
                        <StickyNote size={12} />
                        Notas ({currentNotes.length})
                        {pinnedNotes.length > 0 && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-white">
                            {pinnedNotes.length}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* ── Chat tab ── */}
                  {panelTab === "chat" && (
                    <>
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
                      <InterventionBar onSend={handleIntervene} />
                    </>
                  )}

                  {/* ── Notes tab ── */}
                  {panelTab === "notes" && (
                    <div className="flex flex-1 flex-col overflow-hidden bg-amber-50/30">
                      <div className="flex-1 overflow-y-auto px-4 py-4">
                        {pinnedNotes.length > 0 && (
                          <div className="mb-4">
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                              <Pin size={11} />Notas fijadas
                            </p>
                            <div className="space-y-2">
                              {pinnedNotes.map((note) => (
                                <NoteCard key={note.id} note={note} onTogglePin={handleTogglePin} onDelete={handleDeleteNote} />
                              ))}
                            </div>
                          </div>
                        )}
                        {unpinnedNotes.length > 0 && (
                          <div>
                            {pinnedNotes.length > 0 && (
                              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                <StickyNote size={11} />Otras notas
                              </p>
                            )}
                            <div className="space-y-2">
                              {unpinnedNotes.map((note) => (
                                <NoteCard key={note.id} note={note} onTogglePin={handleTogglePin} onDelete={handleDeleteNote} />
                              ))}
                            </div>
                          </div>
                        )}
                        {currentNotes.length === 0 && (
                          <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400">
                            <StickyNote size={36} className="opacity-30" />
                            <p className="text-sm">Sin notas internas en esta conversación</p>
                            <p className="text-xs">Usa el formulario de abajo para agregar la primera.</p>
                          </div>
                        )}
                      </div>
                      <AddNoteForm onAdd={handleAddNote} />
                    </div>
                  )}
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
