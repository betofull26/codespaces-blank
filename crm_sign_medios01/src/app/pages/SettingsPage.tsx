import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { Sidebar } from "../components/dashboard/Sidebar";
import { agentsData } from "../components/dashboard/agentsData";
import JSZip from "jszip";
import { UserRecordManagement } from "../components/dashboard/UserRecordManagement";
import { getCurrentUser } from "../lib/auth";
import {
  Download, MessageSquare, Users, HardDrive, CheckCircle2, Loader2,
  Clock, FileText, ShieldCheck, AlertCircle, SlidersHorizontal,
  Mail, Crown, UserCog, Shield, X,
} from "lucide-react";

/* ══════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════ */
type BackupStatus = "idle" | "running" | "done" | "error";
type BackupRecord = { label: string; time: string; type: "chats" | "contacts" | "full" };
type Role = "Administrador" | "Supervisor" | "Agente";

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
    desc: "",
  },
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

function BackupCard({ icon, title, description, formats, status, onBackupZip, onBackupCSV, children }: {
  icon: React.ReactNode; title: string; description: string;
  formats: ("zip" | "csv")[]; status: BackupStatus;
  onBackupZip?: () => void; onBackupCSV?: () => void;
  children?: React.ReactNode;
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
      {children}
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

/* ══════════════════════════════════════════════════════
   TABS
══════════════════════════════════════════════════════ */
const TABS = [
  { id: "backup", label: "Copias de seguridad", icon: <HardDrive size={15} /> },
  { id: "team", label: "Equipo y permisos", icon: <Users size={15} /> },
  { id: "activity", label: "Registro de actividad", icon: <Clock size={15} /> },
] as const;
type Tab = (typeof TABS)[number]["id"];

/* ══════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════ */
export function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("backup");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [chatsStatus, setChatsStatus] = useState<BackupStatus>("idle");
  const [contactsStatus, setContactsStatus] = useState<BackupStatus>("idle");
  const [fullStatus, setFullStatus] = useState<BackupStatus>("idle");
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agentsData[0]?.id ?? "");
  const [history, setHistory] = useState<BackupRecord[]>([]);
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate("/", { replace: true });
      return;
    }

    if (currentUser.role === "agent") {
      navigate("/dashboard", { replace: true });
      return;
    }

    setIsAuthorized(true);
  }, [navigate]);

  if (!isAuthorized) {
    return null;
  }

  const totalChats = agentsData.reduce((a, ag) => a + (ag.conversations?.length ?? 0), 0);
  const selectedAgent = agentsData.find((agent) => agent.id === selectedAgentId) ?? agentsData[0] ?? null;
  const selectedAgentConversations = selectedAgent?.conversations ?? [];
  const totalMsgs  = agentsData.reduce((a, ag) => a + (ag.conversations?.reduce((s, c) => s + c.messages.length, 0) ?? 0), 0);

  const addRecord = (r: BackupRecord) => setHistory((h) => [r, ...h]);

  const backupChatsZip = async () =>
    simulate(setChatsStatus, async () => {
      const zip = new JSZip();

      if (selectedAgent) {
        const agentNameSafe = selectedAgent.name.replace(/\s+/g, "_");
        const summary = [
          `Agente: ${selectedAgent.name}`,
          `Rol: ${selectedAgent.role}`,
          `Conversaciones: ${selectedAgentConversations.length}`,
          `Mensajes: ${selectedAgentConversations.reduce((sum, conversation) => sum + conversation.messages.length, 0)}`,
          "",
        ].join("\n");
        zip.file("resumen.txt", summary);

        selectedAgentConversations.forEach((conversation, index) => {
          const fileName = `chats/${agentNameSafe}/${String(index + 1).padStart(2, "0")}_${conversation.clientName.replace(/\s+/g, "_")}.txt`;
          zip.file(fileName, chatTranscript(selectedAgent.name, {
            clientName: conversation.clientName,
            topic: conversation.topic,
            status: conversation.status,
            startTime: conversation.startTime,
            messages: conversation.messages.map((msg) => ({
              type: msg.sender === "agent" ? "whatsapp_out" : msg.sender === "client" ? "whatsapp_in" : "note",
              text: msg.text,
              time: msg.time,
            })),
          }));
        });
      } else {
        zip.file("resumen.txt", "No hay agente seleccionado para respaldar.");
      }

      const content = await zip.generateAsync({ type: "blob" });
      downloadBlob(content, `chats_${selectedAgent ? selectedAgent.name.replace(/\s+/g, "_").toLowerCase() : "agente"}_${Date.now()}.zip`);
    }, () => addRecord({
      label: `Respaldo de chats (ZIP) - ${selectedAgent?.name ?? "agente"}`,
      time: timestamp(),
      type: "chats",
    }));

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
                    description={selectedAgent ? `Exporta el historial del agente ${selectedAgent.name} (${selectedAgentConversations.length} conversaciones).` : "Selecciona un agente para descargar su historial de chats."}
                    formats={["zip"]}
                    status={chatsStatus}
                    onBackupZip={backupChatsZip}
                  >
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <label htmlFor="agent-backup-select" className="mb-2 block text-sm font-medium text-slate-700">
                        Selecciona el agente cuyos chats deseas descargar
                      </label>
                      <select
                        id="agent-backup-select"
                        value={selectedAgentId}
                        onChange={(event) => setSelectedAgentId(event.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                      >
                        {agentsData.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name} — {agent.role}
                          </option>
                        ))}
                      </select>
                    </div>
                  </BackupCard>
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
              <div className="flex flex-col gap-5 lg:col-span-2">
                <div className="mb-6">
                  <div className="mb-5">
                    <h1 className="text-2xl font-bold text-slate-800">Gestión de Fichas</h1>
                    <p className="mt-1 text-sm text-slate-600">Administración completa de usuarios y equipos asignados</p>
                  </div>
                  <UserRecordManagement />
                </div>
              </div>

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

          {activeTab === "activity" && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-lg bg-slate-100 p-2.5 text-slate-600">
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Registro de actividad</h3>
                  <p className="mt-1 text-sm text-slate-600">Consulta los movimientos recientes de usuarios, roles y accesos.</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { user: "Ana Martínez", action: "Creó una ficha de usuario y asignó el rol de Supervisor", time: "Hace 10 minutos" },
                  { user: "Luis Torres", action: "Actualizó el acceso del usuario y cambió su estado a activo", time: "Hace 32 minutos" },
                  { user: "Carla Rojas", action: "Eliminó una ficha y revocó el acceso al panel", time: "Hace 1 hora" },
                ].map((item) => (
                  <div key={item.user} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">{item.user}</p>
                      <span className="text-xs text-slate-500">{item.time}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
