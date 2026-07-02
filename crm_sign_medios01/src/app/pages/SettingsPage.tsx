import { useState } from "react";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { Sidebar } from "../components/dashboard/Sidebar";
import { agentsData } from "../components/dashboard/agentsData";
import JSZip from "jszip";
import { UserRecordManagement } from "../components/dashboard/UserRecordManagement";
import {
  Download, MessageSquare, Users, HardDrive, CheckCircle2, Loader2,
  Clock, FileJson, FileText, ShieldCheck, AlertCircle, SlidersHorizontal,
  UserPlus, Mail, ChevronDown, Trash2, RefreshCw, Crown, Eye,
  UserCog, Shield, Send, X, MoreVertical, BadgeCheck,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Select from "@radix-ui/react-select";

/* ══════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════ */
type BackupStatus = "idle" | "running" | "done" | "error";
type BackupRecord = { label: string; time: string; type: "chats" | "contacts" | "full" };

type Role = "Administrador" | "Supervisor" | "Agente" | "Solo lectura";
type MemberStatus = "activo" | "pendiente" | "suspendido";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: MemberStatus;
  joinedAt: string;
  initials: string;
  avatarColor: string;
}

/* ══════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════ */
const mockContacts = [
  { id: "1", name: "María González",  phone: "+52 55 1234 5678", assignedTo: "Roberto Sánchez" },
  { id: "2", name: "Juan Pérez",      phone: "+52 55 8765 4321", assignedTo: "Patricia Ruiz" },
  { id: "3", name: "Ana Martínez",    phone: "+52 55 2468 1357", assignedTo: "Miguel Torres" },
  { id: "4", name: "Carlos López",    phone: "+52 55 9876 5432", assignedTo: null },
  { id: "5", name: "Laura Fernández", phone: "+52 55 3691 2580", assignedTo: "Sofía Vargas" },
];

const initialMembers: TeamMember[] = [
  { id: "m1", name: "Supervisor SIGN", email: "supervisor@signmedios.com", role: "Administrador", status: "activo",    joinedAt: "01/01/2025", initials: "SS", avatarColor: "bg-blue-600" },
  { id: "m2", name: "Carlos Mendoza",  email: "cmendoza@signmedios.com",   role: "Supervisor",   status: "activo",    joinedAt: "15/02/2025", initials: "CM", avatarColor: "bg-emerald-600" },
  { id: "m3", name: "María Torres",    email: "mtorres@signmedios.com",    role: "Agente",       status: "activo",    joinedAt: "10/03/2025", initials: "MT", avatarColor: "bg-purple-600" },
  { id: "m4", name: "Andrés Vargas",   email: "avargas@signmedios.com",    role: "Agente",       status: "activo",    joinedAt: "22/03/2025", initials: "AV", avatarColor: "bg-amber-600" },
  { id: "m5", name: "Gabriela Ruiz",   email: "gruiz@signmedios.com",      role: "Supervisor",   status: "activo",    joinedAt: "05/04/2025", initials: "GR", avatarColor: "bg-rose-600" },
  { id: "m6", name: "Luis Castillo",   email: "lcastillo@signmedios.com",  role: "Solo lectura", status: "suspendido",joinedAt: "18/04/2025", initials: "LC", avatarColor: "bg-slate-500" },
];

/* ══════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════ */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function downloadCSV(rows: string[][], filename: string) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}
function timestamp() {
  return new Date().toLocaleString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function chatTranscript(agentName: string, conversation: { clientName: string; topic: string; status: string; startTime: string; messages: { type: string; text: string; time: string; authorName?: string; authorInitials?: string; }[]; }) {
  const header = [
    `Agente: ${agentName}`,
    `Cliente: ${conversation.clientName}`,
    `Tema: ${conversation.topic}`,
    `Estado: ${conversation.status}`,
    `Inicio: ${conversation.startTime}`,
    "",
  ].join("\n");

  const body = conversation.messages.map((msg, index) => {
    const sender = msg.type === "whatsapp_out" ? "Agente" : msg.type === "whatsapp_in" ? "Cliente" : "Nota interna";
    const author = msg.authorName ? ` (${msg.authorName})` : "";
    const attachmentNote = (msg as any).attachment ? ` [Adjunto: ${(msg as any).attachment.name || "archivo"}]` : "";
    return `${index + 1}. [${msg.time}] ${sender}${author}: ${msg.text}${attachmentNote}`;
  }).join("\n");

  return `${header}${body}`;
}

function decodeDataUrl(dataUrl: string): Uint8Array {
  const [meta, data] = dataUrl.split(",");
  const base64 = meta.includes("base64") ? data : encodeURIComponent(data);
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) array[i] = binary.charCodeAt(i);
  return array;
}

async function attachmentToFile(attachment: any) {
  const filename = attachment.name || "adjunto.bin";
  if (typeof attachment.content === "string") {
    return { path: filename, content: attachment.content };
  }
  if (typeof attachment.url === "string" && attachment.url.startsWith("data:")) {
    return { path: filename, content: decodeDataUrl(attachment.url) };
  }
  if (typeof attachment.url === "string" && attachment.url.startsWith("http")) {
    try {
      const response = await fetch(attachment.url);
      const blob = await response.blob();
      return { path: filename, content: blob };
    } catch {
      return { path: `${filename}.txt`, content: `No se pudo descargar el adjunto desde ${attachment.url}` };
    }
  }
  return { path: `${filename}.txt`, content: `Adjunto: ${attachment.name || "archivo"}` };
}

async function createZip(files: Array<{ path: string; content: string | Blob | ArrayBuffer | Uint8Array }>, filename: string) {
  const zip = new JSZip();
  files.forEach((file) => zip.file(file.path, file.content));
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, filename);
}

async function simulate(setter: (s: BackupStatus) => void, fn: () => Promise<void> | void, onRecord: () => void) {
  setter("running");
  setTimeout(async () => {
    try { await fn(); setter("done"); onRecord(); setTimeout(() => setter("idle"), 4000); }
    catch { setter("error"); }
  }, 1200);
}

/* ══════════════════════════════════════════════════════
   ROLE CONFIG
══════════════════════════════════════════════════════ */
const roleConfig: Record<Role, { icon: React.ReactNode; color: string; bg: string; desc: string }> = {
  "Administrador": {
    icon: <Crown size={13} />,
    color: "text-blue-700",
    bg: "bg-blue-100",
    desc: "Acceso total al sistema: usuarios, ajustes, respaldos y permisos.",
  },
  "Supervisor": {
    icon: <UserCog size={13} />,
    color: "text-emerald-700",
    bg: "bg-emerald-100",
    desc: "Puede ver todos los agentes, chats y gestionar fichas.",
  },
  "Agente": {
    icon: <Shield size={13} />,
    color: "text-amber-700",
    bg: "bg-amber-100",
    desc: "Accede solo a sus propias conversaciones y contactos asignados.",
  },
  "Solo lectura": {
    icon: <Eye size={13} />,
    color: "text-slate-600",
    bg: "bg-slate-100",
    desc: "Puede visualizar información pero no realizar cambios.",
  },
};

const statusConfig: Record<MemberStatus, { label: string; cls: string; dot: string }> = {
  activo:     { label: "Activo",     cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  pendiente:  { label: "Pendiente",  cls: "bg-amber-100 text-amber-700",     dot: "bg-amber-400" },
  suspendido: { label: "Suspendido", cls: "bg-red-100 text-red-600",         dot: "bg-red-400" },
};

/* ══════════════════════════════════════════════════════
   SUB-COMPONENTS — Backup
══════════════════════════════════════════════════════ */
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={["rounded-xl p-3", color].join(" ")}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function BackupCard({ icon, title, description, formats, status, onBackupZip, onBackupCSV }: {
  icon: React.ReactNode; title: string; description: string;
  formats: ("zip" | "csv")[]; status: BackupStatus;
  onBackupZip?: () => void; onBackupCSV?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">{icon}</div>
        <div className="flex-1">
          <p className="font-semibold text-slate-800">{title}</p>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
        {status === "done" && <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />}
      </div>
      <div className="flex flex-wrap gap-2">
        {formats.includes("zip") && onBackupZip && (
          <button onClick={onBackupZip} disabled={status === "running"}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-60">
            {status === "running" ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            Descargar ZIP
          </button>
        )}
        {formats.includes("csv") && onBackupCSV && (
          <button onClick={onBackupCSV} disabled={status === "running"}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-60">
            {status === "running" ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
            Descargar CSV
          </button>
        )}
      </div>
      {status === "done" && (
        <p className="flex items-center gap-1.5 text-xs text-emerald-600">
          <CheckCircle2 size={12} /> Respaldo generado correctamente
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SUB-COMPONENTS — Team
══════════════════════════════════════════════════════ */

/* Role badge */
function RoleBadge({ role }: { role: Role }) {
  const cfg = roleConfig[role];
  return (
    <span className={["inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.bg, cfg.color].join(" ")}>
      {cfg.icon}{role}
    </span>
  );
}

/* Status badge */
function StatusBadge({ status }: { status: MemberStatus }) {
  const cfg = statusConfig[status];
  return (
    <span className={["inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.cls].join(" ")}>
      <span className={["h-1.5 w-1.5 rounded-full", cfg.dot].join(" ")} />
      {cfg.label}
    </span>
  );
}

/* Radix Select wrapper for role picker */
function RoleSelect({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  const roles: Role[] = ["Administrador", "Supervisor", "Agente", "Solo lectura"];
  return (
    <Select.Root value={value} onValueChange={(v) => onChange(v as Role)}>
      <Select.Trigger className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200">
        <Select.Value />
        <Select.Icon><ChevronDown size={14} className="text-slate-400" /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="z-50 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          <Select.Viewport>
            {roles.map((r) => (
              <Select.Item key={r} value={r}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none hover:bg-slate-100 focus:bg-slate-100">
                <span className={["flex items-center gap-1", roleConfig[r].color].join(" ")}>
                  {roleConfig[r].icon}
                </span>
                <Select.ItemText>{r}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

/* Pending invitation row */
interface Invitation { id: string; email: string; role: Role; sentAt: string }

function InvitationRow({ inv, onRevoke }: { inv: Invitation; onRevoke: (id: string) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <Mail size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-slate-800">{inv.email}</p>
        <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
          <Clock size={10} /> Enviada: {inv.sentAt}
        </p>
      </div>
      <RoleBadge role={inv.role} />
      <button onClick={() => onRevoke(inv.id)}
        className="ml-1 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500">
        <X size={14} />
      </button>
    </div>
  );
}

/* Member row */
function MemberRow({ member, onChangeRole, onToggleSuspend, onRemove }: {
  member: TeamMember;
  onChangeRole: (id: string, role: Role) => void;
  onToggleSuspend: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const isCurrentUser = member.id === "m1";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md">
      {/* Avatar */}
      <div className={["flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white", member.avatarColor].join(" ")}>
        {member.initials}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-800">{member.name}</p>
          {isCurrentUser && (
            <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
              <BadgeCheck size={10} /> Tú
            </span>
          )}
        </div>
        <p className="truncate text-xs text-slate-500">{member.email}</p>
        <p className="mt-0.5 text-[11px] text-slate-400">Desde {member.joinedAt}</p>
      </div>

      {/* Role */}
      <div className="hidden sm:block">
        <RoleBadge role={member.role} />
      </div>

      {/* Status */}
      <StatusBadge status={member.status} />

      {/* Actions */}
      {!isCurrentUser && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
              <MoreVertical size={16} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[200px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
              sideOffset={5} align="end">
              {/* Change role submenu */}
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none hover:bg-slate-100">
                  <UserCog size={14} /> Cambiar rol
                  <ChevronDown size={12} className="ml-auto -rotate-90" />
                </DropdownMenu.SubTrigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.SubContent className="z-50 min-w-[180px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg" sideOffset={4}>
                    {(["Administrador","Supervisor","Agente","Solo lectura"] as Role[]).map((r) => (
                      <DropdownMenu.Item key={r}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none hover:bg-slate-100"
                        onSelect={() => onChangeRole(member.id, r)}>
                        <span className={roleConfig[r].color}>{roleConfig[r].icon}</span>
                        {r}
                        {member.role === r && <CheckCircle2 size={12} className="ml-auto text-blue-500" />}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.SubContent>
                </DropdownMenu.Portal>
              </DropdownMenu.Sub>

              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none hover:bg-slate-100"
                onSelect={() => onToggleSuspend(member.id)}>
                <RefreshCw size={14} />
                {member.status === "suspendido" ? "Reactivar acceso" : "Suspender acceso"}
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1.5 h-px bg-slate-200" />

              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 outline-none hover:bg-red-50"
                onSelect={() => onRemove(member.id)}>
                <Trash2 size={14} /> Eliminar del equipo
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TABS
══════════════════════════════════════════════════════ */
const TABS = [
  { id: "backup", label: "Copias de seguridad", icon: <HardDrive size={15} /> },
  { id: "team",   label: "Equipo y permisos",   icon: <Users size={15} /> },
] as const;
type Tab = (typeof TABS)[number]["id"];

/* ══════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════ */
export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("backup");

  /* ── backup state ── */
  const [chatsStatus,    setChatsStatus]    = useState<BackupStatus>("idle");
  const [contactsStatus, setContactsStatus] = useState<BackupStatus>("idle");
  const [fullStatus,     setFullStatus]     = useState<BackupStatus>("idle");
  const [history, setHistory] = useState<BackupRecord[]>([]);

  const totalChats = agentsData.reduce((a, ag) => a + ag.conversations.length, 0);
  const totalMsgs  = agentsData.reduce((a, ag) => a + ag.conversations.reduce((s, c) => s + c.messages.length, 0), 0);

  const addRecord = (r: BackupRecord) => setHistory((h) => [r, ...h]);

  const backupChatsZip = async () =>
    simulate(setChatsStatus, async () => {
      const zip = new JSZip();

      // No chat conversations available without the agent panel.
      const content = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(content);
      a.download = `chats_signmedios_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, () => addRecord({ label: "Respaldo de chats (ZIP)", time: timestamp(), type: "chats" }));

  const backupContactsCSV = () =>
    simulate(setContactsStatus, () => downloadCSV(
      [["ID","Nombre","Teléfono","Asignado a"], ...mockContacts.map((c) => [c.id, c.name, c.phone, c.assignedTo ?? "Sin asignar"])],
      `contactos_signmedios_${Date.now()}.csv`
    ), () => addRecord({ label: "Respaldo de contactos (CSV)", time: timestamp(), type: "contacts" }));

  const backupFullZip = async () =>
    simulate(setFullStatus, async () => {
      const zip = new JSZip();

      // No chat conversations available without the agent panel.

      // add contacts CSV
      const csv = [["ID","Nombre","Teléfono","Asignado a"], ...mockContacts.map((c) => [c.id, c.name, c.phone, c.assignedTo ?? "Sin asignar"])].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
      zip.file("contactos.csv", csv);

      const content = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(content);
      a.download = `backup_completo_signmedios_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, () => addRecord({ label: "Respaldo completo (ZIP)", time: timestamp(), type: "full" }));

  /* ── team state ── */
  const [members,     setMembers]     = useState<TeamMember[]>(initialMembers);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invEmail,    setInvEmail]    = useState("");
  const [invRole,     setInvRole]     = useState<Role>("Agente");
  const [invSending,  setInvSending]  = useState(false);
  const [invSuccess,  setInvSuccess]  = useState(false);
  const [invError,    setInvError]    = useState("");

  const handleSendInvite = () => {
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!invEmail.trim()) { setInvError("Ingresa un correo electrónico."); return; }
    if (!emailRx.test(invEmail)) { setInvError("El correo no tiene un formato válido."); return; }
    if (members.some((m) => m.email === invEmail) || invitations.some((i) => i.email === invEmail)) {
      setInvError("Este correo ya está registrado o tiene una invitación pendiente."); return;
    }
    setInvError("");
    setInvSending(true);
    setTimeout(() => {
      setInvitations((prev) => [
        ...prev,
        { id: String(Date.now()), email: invEmail, role: invRole, sentAt: timestamp() },
      ]);
      setInvEmail("");
      setInvSending(false);
      setInvSuccess(true);
      setTimeout(() => setInvSuccess(false), 3500);
    }, 1400);
  };

  const handleRevokeInvite = (id: string) =>
    setInvitations((prev) => prev.filter((i) => i.id !== id));

  const handleChangeRole = (id: string, role: Role) =>
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));

  const handleToggleSuspend = (id: string) =>
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: m.status === "suspendido" ? "activo" : "suspendido" } : m
      )
    );

  const handleRemove = (id: string) => {
    if (confirm("¿Confirmas que deseas eliminar este miembro del equipo?"))
      setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const typeIcon = (t: BackupRecord["type"]) => ({
    chats:    <MessageSquare size={13} className="text-blue-500" />,
    contacts: <Users         size={13} className="text-emerald-500" />,
    full:     <HardDrive     size={13} className="text-purple-500" />,
  }[t]);

  /* ══ RENDER ══ */
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar selectedNode="ajustes" onSelectNode={() => {}} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto px-6 py-5">
          {/* Page title */}
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-800">Ajustes</h2>
            <p className="mt-1 text-sm text-slate-500">Administra tu equipo, permisos y copias de seguridad.</p>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={[
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                  activeTab === t.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100",
                ].join(" ")}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* ════════════════════════════════════════
              TAB: BACKUP
          ════════════════════════════════════════ */}
          {activeTab === "backup" && (
            <>
              <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={<Users size={20} />}         label="Total de Agentes"  value={agentsData.length}   color="bg-blue-50 text-blue-600" />
                <StatCard icon={<MessageSquare size={20} />} label="Conversaciones"    value={totalChats}           color="bg-emerald-50 text-emerald-600" />
                <StatCard icon={<FileText size={20} />}      label="Mensajes totales"  value={totalMsgs}            color="bg-amber-50 text-amber-600" />
                <StatCard icon={<Users size={20} />}         label="Contactos"         value={mockContacts.length}  color="bg-purple-50 text-purple-600" />
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="flex flex-col gap-4 lg:col-span-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-blue-600" />
                    <h3 className="font-semibold text-slate-800">Copias de seguridad</h3>
                  </div>

                  <BackupCard
                    icon={<MessageSquare size={18} />}
                    title="Respaldo de Chats"
                    description={`Exporta el historial completo de ${totalChats} conversaciones y ${totalMsgs} mensajes de todos los agentes.`}
                    formats={["zip"]}
                    status={chatsStatus}
                    onBackupZip={backupChatsZip}
                  />
                  <BackupCard
                    icon={<Users size={18} />}
                    title="Respaldo de Contactos"
                    description={`Exporta los ${mockContacts.length} contactos con sus asignaciones.`}
                    formats={["csv"]}
                    status={contactsStatus}
                    onBackupCSV={backupContactsCSV}
                  />

                  {/* Full backup */}
                  <div className="flex flex-col gap-4 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-blue-600 p-2.5 text-white"><HardDrive size={18} /></div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">Respaldo Completo</p>
                      </div>
                      {fullStatus === "done" && <CheckCircle2 size={18} className="mt-0.5 text-emerald-500" />}
                    </div>
                    <button onClick={backupFullZip} disabled={fullStatus === "running"}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition-all hover:bg-blue-700 disabled:opacity-60">
                      {fullStatus === "running"
                        ? <><Loader2 size={16} className="animate-spin" />Generando respaldo…</>
                        : <><Download size={16} />Descargar respaldo completo</>}
                    </button>
                    {fullStatus === "done" && (
                      <p className="flex items-center justify-center gap-1.5 text-xs text-emerald-600">
                        <CheckCircle2 size={12} />Archivo generado y descargado correctamente
                      </p>
                    )}
                  </div>
                </div>

                {/* History */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-slate-500" />
                    <h3 className="font-semibold text-slate-800">Historial de respaldos</h3>
                  </div>
                  <div className="flex flex-1 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
                    {history.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-slate-400">
                        <HardDrive size={32} className="opacity-30" />
                        <p className="text-sm">Sin respaldos en esta sesión</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {history.map((rec, i) => (
                          <li key={i} className="flex items-start gap-3 px-4 py-3">
                            <div className="mt-0.5 rounded-md bg-slate-100 p-1.5">{typeIcon(rec.type)}</div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-700">{rec.label}</p>
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400"><Clock size={10} />{rec.time}</p>
                            </div>
                            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="flex items-start gap-2 text-xs text-amber-700">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" />
                      Se recomienda un respaldo completo al menos una vez por semana.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════
              TAB: TEAM & PERMISSIONS
          ════════════════════════════════════════ */}
          {activeTab === "team" && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* ── Left col: members + invitations ── */}
              <div className="flex flex-col gap-5 lg:col-span-2">

                {/* Invite form removed per request */}

                {/* Pending invitations */}
                {invitations.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Clock size={14} className="text-amber-500" />
                      Invitaciones pendientes ({invitations.length})
                    </h4>
                    {invitations.map((inv) => (
                      <InvitationRow key={inv.id} inv={inv} onRevoke={handleRevokeInvite} />
                    ))}
                  </div>
                )}

                {/* Members list */}
                {/* Gestión de Fichas (copiada desde UserManagementPage) */}
                <div className="mb-6">
                  <div className="mb-5">
                    <h1 className="text-2xl font-bold text-slate-800">Gestión de Fichas</h1>
                    <p className="mt-1 text-sm text-slate-600">Administración completa de usuarios y equipos asignados</p>
                  </div>
                  <UserRecordManagement />
                </div>

                <div className="flex flex-col gap-2">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Users size={14} className="text-blue-600" />
                    Miembros del equipo ({members.length})
                  </h4>
                  {members.map((m) => (
                    <MemberRow
                      key={m.id}
                      member={m}
                      onChangeRole={handleChangeRole}
                      onToggleSuspend={handleToggleSuspend}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              </div>

              {/* ── Right col: role reference ── */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-blue-600" />
                  <h3 className="font-semibold text-slate-800">Roles disponibles</h3>
                </div>

                {(Object.entries(roleConfig) as [Role, (typeof roleConfig)[Role]][]).map(([role, cfg]) => (
                  <div key={role} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className={["flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base", cfg.bg, cfg.color].join(" ")}>
                      {cfg.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{role}</p>
                      <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{cfg.desc}</p>
                    </div>
                  </div>
                ))}

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="flex items-start gap-2 text-xs text-blue-700">
                    <SlidersHorizontal size={14} className="mt-0.5 shrink-0" />
                    Solo el Administrador puede modificar roles, suspender accesos y enviar invitaciones.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
