import * as Dialog from "@radix-ui/react-dialog";
import {
  X, PhoneCall, Mail, Briefcase, Building2,
  Calendar, MessageSquare, Shield, Camera,
} from "lucide-react";
import { useState, useRef } from "react";
import { CURRENT_AGENT } from "./agentPanelData";

interface AgentProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalChats: number;
}

export function AgentProfileModal({ open, onOpenChange, totalChats }: AgentProfileModalProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl focus:outline-none">

          {/* Header gradient */}
          <div className="relative rounded-t-2xl bg-gradient-to-br from-blue-600 to-blue-800 px-6 pb-10 pt-6">
            <Dialog.Close className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30">
              <X size={15} />
            </Dialog.Close>

            <Dialog.Title className="mb-5 text-sm font-semibold uppercase tracking-widest text-blue-200">
              Perfil Personal
            </Dialog.Title>

            {/* Avatar with photo upload */}
            <div className="flex items-end gap-4">
              <div className="relative">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />

                {/* Avatar / Photo */}
                <div className="relative h-20 w-20">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Foto de perfil"
                      className="h-20 w-20 rounded-2xl object-cover shadow-md ring-4 ring-white/30"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-3xl font-bold text-white shadow-md ring-4 ring-white/30">
                      {CURRENT_AGENT.initials}
                    </div>
                  )}

                  {/* Camera button overlay */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 transition-opacity hover:opacity-100"
                    title="Cambiar foto de perfil"
                  >
                    <Camera size={20} className="text-white" />
                  </button>
                </div>

                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-blue-700 bg-emerald-400" />
              </div>

              <div className="pb-1">
                <p className="text-xl font-bold text-white">{CURRENT_AGENT.name}</p>
                <p className="mt-0.5 text-sm text-blue-200">{CURRENT_AGENT.email}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 transition-colors hover:bg-white/25"
                >
                  <Camera size={11} /> Cambiar foto
                </button>
              </div>
            </div>
          </div>

          {/* Badges (overlap header) */}
          <div className="-mt-5 flex gap-2 px-6">
            <span className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm ring-2 ring-white">
              <Shield size={12} /> {CURRENT_AGENT.role}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm ring-2 ring-white">
              <Building2 size={12} /> {CURRENT_AGENT.department}
            </span>
          </div>

          {/* Body */}
          <div className="px-6 pb-6 pt-5 space-y-1">

            {/* Ficha section */}
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Ficha del agente
            </p>

            {/* Cargo */}
            <FichaRow
              icon={<Briefcase size={14} />}
              label="Cargo"
              value={CURRENT_AGENT.role}
            />

            {/* Departamento */}
            <FichaRow
              icon={<Building2 size={14} />}
              label="Departamento"
              value={CURRENT_AGENT.department}
            />

            {/* Línea asignada */}
            <FichaRow
              icon={<PhoneCall size={14} />}
              label="Línea asignada"
              value={CURRENT_AGENT.assignedLine}
              accent
            />

            {/* Email */}
            <FichaRow
              icon={<Mail size={14} />}
              label="Correo electrónico"
              value={CURRENT_AGENT.email}
            />

            {/* Desde */}
            <FichaRow
              icon={<Calendar size={14} />}
              label="Agente desde"
              value={CURRENT_AGENT.joinedSince}
            />

            {/* Divider */}
            <div className="my-4 h-px bg-slate-100" />

            {/* Stats */}
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Actividad actual
            </p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<MessageSquare size={15} className="text-blue-500" />}
                value={totalChats}
                label="Chats asignados"
                color="bg-blue-50"
              />
              <StatCard
                icon={<span className="h-3 w-3 rounded-full bg-emerald-500" />}
                value="En línea"
                label="Estado actual"
                color="bg-emerald-50"
                isText
              />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ─── Helpers ─────────────────────────────────────────── */
function FichaRow({ icon, label, value, accent }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl px-1 py-2.5">
      <span className={["mt-0.5 shrink-0", accent ? "text-blue-500" : "text-slate-400"].join(" ")}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className={["truncate text-sm font-medium", accent ? "text-blue-700" : "text-slate-800"].join(" ")}>{value}</p>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, color, isText }: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: string;
  isText?: boolean;
}) {
  return (
    <div className={["flex flex-col items-center gap-1.5 rounded-xl py-4", color].join(" ")}>
      <span className="flex items-center">{icon}</span>
      {isText
        ? <span className="text-sm font-bold text-slate-800">{value}</span>
        : <span className="text-xl font-bold text-slate-800">{value}</span>
      }
      <span className="text-[10px] text-slate-500">{label}</span>
    </div>
  );
}
