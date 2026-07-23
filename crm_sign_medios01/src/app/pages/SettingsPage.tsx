import { useEffect, useState } from "react";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { Sidebar } from "../components/dashboard/Sidebar";
import { UserRecordManagement } from "../components/dashboard/UserRecordManagement";
import { getCurrentUser } from "../lib/auth";
import { createBackup, downloadBackup, fetchAgents, fetchUserConversations, fetchAuditLogs, fetchBackups, fetchAllContacts, type AuditLogDto, type BackupRecordDto } from "../services/dashboardApi";
import type { Agent, Conversation } from "../components/dashboard/types";
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
function timestamp() {
  return new Date().toLocaleString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatActivityMessage(item: AuditLogDto): string {
  const roleLabels: Record<string, string> = {
    admin: "administrador",
    supervisor: "supervisor",
    agent: "agente",
    agente: "agente",
  };

  const actionLabels: Record<string, string> = {
    create_user: "creó un usuario",
    update_user: "actualizó un usuario",
    delete_user: "eliminó un usuario",
    change_role: "cambió el rol",
    change_status: "cambió el estado",
    login: "inició sesión",
  };

  const actionLabel = actionLabels[item.action] ?? item.action.replace(/_/g, " ");

  try {
    const details = JSON.parse(item.details);

    switch (item.action) {
      case "create_user": {
        const actorUsername = typeof details?.actorUsername === "string" ? details.actorUsername : item.performedBy;
        const username = typeof details?.username === "string" ? details.username : "un usuario";
        const fullName = typeof details?.fullName === "string" ? details.fullName : "";
        const role = typeof details?.role === "string" ? details.role : "";
        const isAgent = role === "agent" || role === "agente";
        const createdUserLabel = isAgent && fullName ? fullName : username;
        const normalizedRole = role ? (roleLabels[role] ?? role) : "";
        const roleText = normalizedRole ? ` con rol ${normalizedRole}` : "";
        return `${actorUsername} creó un usuario nuevo ${createdUserLabel}${roleText}.`;
      }
      case "update_user": {
        const actorUsername = typeof details?.actorUsername === "string" ? details.actorUsername : item.performedBy;
        return `${actorUsername} actualizó la información de una ficha de usuario.`;
      }
      case "delete_user": {
        const actorUsername = typeof details?.actorUsername === "string" ? details.actorUsername : item.performedBy;
        const targetUserLabel = typeof details?.targetUserLabel === "string"
          ? details.targetUserLabel
          : (typeof details?.deletedUser === "string" ? details.deletedUser : "un usuario");
        return `${actorUsername} eliminó a ${targetUserLabel}.`;
      }
      case "change_role": {
        const actorUsername = typeof details?.actorUsername === "string" ? details.actorUsername : item.performedBy;
        const targetUserLabel = typeof details?.targetUserLabel === "string" ? details.targetUserLabel : "un usuario";
        const previousRole = typeof details?.previousRole === "string" ? details.previousRole : "sin rol";
        const newRole = typeof details?.newRole === "string" ? details.newRole : "sin rol";
        return `${actorUsername} cambió el rol del usuario ${targetUserLabel} de ${previousRole} a ${newRole}.`;
      }
      case "change_status": {
        const actorUsername = typeof details?.actorUsername === "string" ? details.actorUsername : item.performedBy;
        const previousStatus = typeof details?.previousStatus === "string" ? details.previousStatus : "desconocido";
        const newStatus = typeof details?.newStatus === "string" ? details.newStatus : "desconocido";
        return `${actorUsername} cambió el estado de un usuario de ${previousStatus} a ${newStatus}.`;
      }
      case "login": {
        const username = typeof details?.username === "string" ? details.username : "un usuario";
        return `${username} inició sesión en el sistema.`;
      }
      default:
        return `Realizó la acción: ${actionLabel}.`;
    }
  } catch {
    return item.details ? `Realizó la acción: ${actionLabel}.` : `Realizó la acción: ${actionLabel}.`;
  }
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

const rolePermissions: Record<Role, Record<string, boolean>> = {
  "Administrador": {
    "Acceso a módulo admin": true,
    "Gestionar usuarios": true,
    "Ver usuarios": true,
    "Gestionar backups": true,
    "Ver backups": true,
    "Conectar dispositivos": true,
    "Ver reportes": true,
  },
  "Supervisor": {
    "Acceso a módulo admin": true,
    "Gestionar usuarios": false,
    "Ver usuarios": true,
    "Gestionar backups": false,
    "Ver backups": false,
    "Conectar dispositivos": false,
    "Ver reportes": true,
  },
  "Agente": {
    "Acceso a módulo admin": false,
    "Gestionar usuarios": false,
    "Ver usuarios": false,
    "Gestionar backups": false,
    "Ver backups": false,
    "Conectar dispositivos": false,
    "Ver reportes": false,
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
  const currentUser = getCurrentUser();
  const isSupervisor = currentUser?.role === "supervisor";

  const navigateTo = (path: string) => {
    if (typeof window !== "undefined") {
      window.location.assign(path);
    }
  };

  const [activeTab, setActiveTab] = useState<Tab>("backup");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [chatsStatus, setChatsStatus] = useState<BackupStatus>("idle");
  const [contactsStatus, setContactsStatus] = useState<BackupStatus>("idle");
  const [fullStatus, setFullStatus] = useState<BackupStatus>("idle");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedAgentConversations, setSelectedAgentConversations] = useState<Conversation[]>([]);
  const [history, setHistory] = useState<BackupRecord[]>([]);
  const [contactsCount, setContactsCount] = useState<number>(0);
  const [activityLog, setActivityLog] = useState<AuditLogDto[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const [isAgentsLoading, setIsAgentsLoading] = useState(true);
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigateTo("/");
      return;
    }

    if (currentUser.role === "agent") {
      navigateTo("/dashboard");
      return;
    }

    setIsAuthorized(true);
  }, []);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    let active = true;
    const loadAgents = async () => {
      setIsAgentsLoading(true);
      try {
        const data = await fetchAgents();
        if (!active) return;
        setAgents(data);
        if (data.length > 0 && !selectedUserId) {
          setSelectedUserId(data[0].id);
        }
      } catch (error) {
        if (!active) return;
        setAgents([]);
      } finally {
        if (active) setIsAgentsLoading(false);
      }
    };

    void loadAgents();
    return () => {
      active = false;
    };
  }, [isAuthorized, selectedUserId]);

  useEffect(() => {
    if (!isAuthorized || !selectedUserId) {
      setSelectedAgentConversations([]);
      return;
    }

    let active = true;
    const loadConversations = async () => {
      try {
        const data = await fetchUserConversations(selectedUserId);
        if (!active) return;
        setSelectedAgentConversations(data);
      } catch (error) {
        if (!active) return;
        setSelectedAgentConversations([]);
      }
    };

    void loadConversations();
    return () => {
      active = false;
    };
  }, [isAuthorized, selectedUserId]);

  useEffect(() => {
    if (!isAuthorized) return;
    let active = true;
    fetchAllContacts()
      .then((rows) => { if (active) setContactsCount(rows.length); })
      .catch(() => { /* non-critical */ });
    return () => { active = false; };
  }, [isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    let active = true;
    const loadBackups = async () => {
      setIsHistoryLoading(true);
      setHistoryError(null);
      try {
        const backups = await fetchBackups();
        if (!active) return;

        const mapped: BackupRecord[] = backups.map((backup: BackupRecordDto) => ({
          label: `${backup.backupType === "chats" ? "Respaldo de chats" : backup.backupType === "contacts" ? "Respaldo de contactos" : "Respaldo completo"} (${backup.fileName})`,
          time: new Date(backup.createdAt).toLocaleString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          type: (backup.backupType === "contacts" ? "contacts" : backup.backupType === "full" ? "full" : "chats") as BackupRecord["type"],
        }));
        setHistory(mapped);
      } catch (error) {
        if (!active) return;
        setHistoryError(error instanceof Error ? error.message : "No se pudo cargar el historial");
      } finally {
        if (active) setIsHistoryLoading(false);
      }
    };

    void loadBackups();
    return () => {
      active = false;
    };
  }, [isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    let active = true;
    const loadActivity = async () => {
      setIsActivityLoading(true);
      setActivityError(null);
      try {
        const logs = await fetchAuditLogs();
        if (!active) return;
        setActivityLog(logs);
      } catch (error) {
        if (!active) return;
        setActivityError(error instanceof Error ? error.message : "No se pudo cargar el registro de actividad");
      } finally {
        if (active) setIsActivityLoading(false);
      }
    };

    void loadActivity();
    return () => {
      active = false;
    };
  }, [isAuthorized]);

  if (!isAuthorized) {
    return null;
  }

  const totalChats = selectedAgentConversations.length;
  const selectedAgent = agents.find((agent) => agent.id === selectedUserId) ?? agents[0] ?? null;
  const totalMsgs = selectedAgentConversations.reduce((sum, conversation) => sum + (conversation.messages?.length ?? 0), 0);

  const backupChatsZip = async () => {
    if (isSupervisor) {
      setHistoryError("No tienes permisos para generar respaldos.");
      return;
    }
    setChatsStatus("running");
    try {
      const backup = await createBackup("chats", selectedUserId);
      const blob = await downloadBackup(backup.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = backup.fileName;
      anchor.click();
      URL.revokeObjectURL(url);
      setChatsStatus("done");
      setHistory((current) => [{ label: `Respaldo de chats (ZIP) - ${selectedAgent?.name ?? "agente"}`, time: timestamp(), type: "chats" }, ...current]);
      setTimeout(() => setChatsStatus("idle"), 3000);
    } catch (error) {
      setChatsStatus("error");
      setHistoryError(error instanceof Error ? error.message : "No se pudo generar el respaldo");
    }
  };

  const backupContactsZip = async () => {
    if (isSupervisor) {
      setHistoryError("No tienes permisos para generar respaldos.");
      return;
    }
    setContactsStatus("running");
    try {
      const backup = await createBackup("contacts");
      const blob = await downloadBackup(backup.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = backup.fileName;
      anchor.click();
      URL.revokeObjectURL(url);
      setContactsStatus("done");
      setHistory((current) => [{ label: "Respaldo de contactos (ZIP)", time: timestamp(), type: "contacts" }, ...current]);
      setTimeout(() => setContactsStatus("idle"), 3000);
    } catch (error) {
      setContactsStatus("error");
      setHistoryError(error instanceof Error ? error.message : "No se pudo generar el respaldo");
    }
  };

  const backupFullZip = async () => {
    if (isSupervisor) {
      setHistoryError("No tienes permisos para generar respaldos.");
      return;
    }
    setFullStatus("running");
    try {
      const backup = await createBackup("full");
      const blob = await downloadBackup(backup.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = backup.fileName;
      anchor.click();
      URL.revokeObjectURL(url);
      setFullStatus("done");
      setHistory((current) => [{ label: "Respaldo completo (ZIP)", time: timestamp(), type: "full" }, ...current]);
      setTimeout(() => setFullStatus("idle"), 3000);
    } catch (error) {
      setFullStatus("error");
      setHistoryError(error instanceof Error ? error.message : "No se pudo generar el respaldo");
    }
  };

  const typeIcon = (t: BackupRecord["type"]) => ({
    chats:    <MessageSquare size={13} className="text-blue-500" />,
    contacts: <Users         size={13} className="text-emerald-500" />,
    full:     <HardDrive     size={13} className="text-purple-500" />,
  }[t]);

  /* ══ RENDER ══ */
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar selectedNode="ajustes" />

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
              <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard icon={<MessageSquare size={20} />} label="Conversaciones"    value={totalChats}           color="bg-emerald-50 text-emerald-600" />
                <StatCard icon={<FileText size={20} />}      label="Mensajes totales"  value={totalMsgs}            color="bg-amber-50 text-amber-600" />
                <StatCard icon={<Users size={20} />}         label="Contactos"         value={contactsCount}  color="bg-purple-50 text-purple-600" />
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
                    onBackupZip={isSupervisor ? undefined : backupChatsZip}
                  >
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <label htmlFor="agent-backup-select" className="mb-2 block text-sm font-medium text-slate-700">
                        Selecciona el agente cuyos chats deseas descargar
                      </label>
                      <select
                        id="agent-backup-select"
                        value={selectedUserId}
                        onChange={(event) => setSelectedUserId(event.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                      >
                        {isAgentsLoading ? (
                          <option value="">Cargando agentes...</option>
                        ) : agents.length === 0 ? (
                          <option value="">No hay agentes disponibles</option>
                        ) : (
                          agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name} — {agent.role}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </BackupCard>
                  <BackupCard
                    icon={<Users size={18} />}
                    title="Respaldo de Contactos"
                    description="Exporta los contactos del directorio en un archivo CSV dentro de un ZIP."
                    formats={["zip"]}
                    status={contactsStatus}
                    onBackupZip={isSupervisor ? undefined : backupContactsZip}
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
                    <button onClick={backupFullZip} disabled={fullStatus === "running" || isSupervisor}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition-all hover:bg-blue-700 disabled:opacity-60">
                      {fullStatus === "running"
                        ? <><Loader2 size={16} className="animate-spin" />Generando respaldo…</>
                        : <><Download size={16} />Descargar respaldo completo</>}
                    </button>
                    {isSupervisor && (
                      <p className="flex items-center justify-center gap-1.5 text-xs text-amber-600">
                        <AlertCircle size={12} />Solo los administradores pueden generar respaldos.
                      </p>
                    )}
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
                    {isHistoryLoading ? (
                      <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-slate-400">
                        <Loader2 size={24} className="animate-spin" />
                        <p className="text-sm">Cargando historial…</p>
                      </div>
                    ) : historyError ? (
                      <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-amber-600">
                        <AlertCircle size={24} />
                        <p className="text-sm">{historyError}</p>
                      </div>
                    ) : history.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-slate-400">
                        <HardDrive size={32} className="opacity-30" />
                        <p className="text-sm">Sin respaldos registrados</p>
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
                {isActivityLoading ? (
                  <div className="flex items-center justify-center py-8 text-sm text-slate-500">Cargando actividad...</div>
                ) : activityError ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{activityError}</div>
                ) : activityLog.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No hay actividad registrada.</div>
                ) : (
                  activityLog.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-800">{item.performedBy}</p>
                        <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{formatActivityMessage(item)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
