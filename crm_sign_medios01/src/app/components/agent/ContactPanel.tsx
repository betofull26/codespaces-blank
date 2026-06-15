import { useState } from "react";
import {
  X, User, Phone, Tag, Calendar, Edit3, Check,
  UserPlus, UserCheck, MessageSquare, Clock,
  CheckCircle2, Circle,
} from "lucide-react";
import type { PanelConversation } from "./agentPanelData";

interface ContactPanelProps {
  conv: PanelConversation;
  onClose: () => void;
  onUpdateName: (name: string) => void;
}

export function ContactPanel({ conv, onClose, onUpdateName }: ContactPanelProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue,   setNameValue]   = useState(conv.clientName);
  const [saved,       setSaved]       = useState(false);
  const [isContact,   setIsContact]   = useState(false);

  const handleSaveName = () => {
    if (!nameValue.trim()) return;
    onUpdateName(nameValue.trim());
    setEditingName(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter")  handleSaveName();
    if (e.key === "Escape") { setNameValue(conv.clientName); setEditingName(false); }
  };

  const msgCount   = conv.messages.filter((m) => m.type !== "internal_note").length;
  const noteCount  = conv.messages.filter((m) => m.type === "internal_note").length;

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-l border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <span className="text-sm font-bold text-slate-800">Ficha de contacto</span>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar section */}
        <div className="flex flex-col items-center gap-3 border-b border-slate-100 px-4 py-6">
          <div className="relative">
            <div className={[
              "flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-md",
              conv.avatarColor,
            ].join(" ")}>
              {conv.clientInitials}
            </div>
            {conv.clientOnline && (
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
            )}
          </div>

          {/* Editable name */}
          <div className="flex w-full flex-col items-center gap-1">
            {editingName ? (
              <div className="flex w-full items-center gap-1.5">
                <input
                  autoFocus
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={handleKey}
                  className="flex-1 rounded-lg border border-blue-400 bg-blue-50 px-2.5 py-1.5 text-center text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
                />
                <button
                  onClick={handleSaveName}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700"
                >
                  <Check size={13} />
                </button>
                <button
                  onClick={() => { setNameValue(conv.clientName); setEditingName(false); }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-slate-800">{conv.clientName}</span>
                <button
                  onClick={() => setEditingName(true)}
                  className="rounded p-0.5 text-slate-400 transition-colors hover:text-blue-600"
                  title="Editar nombre"
                >
                  <Edit3 size={13} />
                </button>
              </div>
            )}

            {saved && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 size={11} /> Nombre actualizado
              </span>
            )}

            <span className={[
              "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
              conv.clientOnline
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-500",
            ].join(" ")}>
              <span className={["h-1.5 w-1.5 rounded-full", conv.clientOnline ? "bg-emerald-500" : "bg-slate-400"].join(" ")} />
              {conv.clientOnline ? "En línea" : "Desconectado"}
            </span>
          </div>
        </div>

        {/* Contact details */}
        <div className="space-y-px border-b border-slate-100 px-4 py-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Información
          </p>

          <InfoRow icon={<Phone size={14} />} label="Teléfono" value={conv.clientPhone} />
          <InfoRow icon={<Tag size={14} />}   label="Tema"     value={conv.topic} />
          <InfoRow
            icon={<Calendar size={14} />}
            label="Asignado"
            value={conv.assignedSince}
          />
        </div>

        {/* Stats */}
        <div className="border-b border-slate-100 px-4 py-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Actividad
          </p>
          <div className="grid grid-cols-2 gap-2">
            <StatChip icon={<MessageSquare size={13} className="text-blue-500" />} value={msgCount}  label="Mensajes" color="bg-blue-50" />
            <StatChip icon={<Clock size={13} className="text-amber-500" />}        value={noteCount} label="Notas"     color="bg-amber-50" />
          </div>
        </div>

        {/* Add to contacts */}
        <div className="px-4 py-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Acciones
          </p>
          <button
            onClick={() => setIsContact((v) => !v)}
            className={[
              "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
              isContact
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
            ].join(" ")}
          >
            {isContact
              ? <><UserCheck size={16} /> Guardado en contactos</>
              : <><UserPlus size={16} /> Agregar a contactos</>}
          </button>
        </div>
      </div>

      {/* Close/end conversation */}
      <div className="border-t border-slate-200 px-4 py-3">
        <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600">
          <CheckCircle2 size={15} />
          Cerrar conversación
        </button>
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────── */
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg px-1 py-2">
      <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="truncate text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function StatChip({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <div className={["flex flex-col items-center gap-1 rounded-xl py-3", color].join(" ")}>
      {icon}
      <span className="text-lg font-bold text-slate-800">{value}</span>
      <span className="text-[10px] text-slate-500">{label}</span>
    </div>
  );
}
