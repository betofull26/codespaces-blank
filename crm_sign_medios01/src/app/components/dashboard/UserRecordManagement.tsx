import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Camera, Search } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { UserRecordForm } from "./UserRecordForm";
import { createUser, deleteUserById, fetchUsers, updateUser, updateUserStatus, type BackendUser } from "../../services/dashboardApi";
import { getCurrentUser, getCurrentUserRole } from "../../lib/auth";

const USER_RECORDS_STORAGE_KEY = "crm-sign-user-records";

export type UserRole = "Administrador" | "Supervisor" | "Agente" | "Suspendido";

export interface UserRecord {
  id: string;
  position: string;
  assignedPhone: string;
  deviceModel: string;
  serialNumber: string;
  serialNumber2: string;
  photo?: string;
  entryDate: string;
  name: string;
  username: string;
  password: string;
  role: UserRole;
}

export function UserRecordManagement() {
  const currentUser = getCurrentUser();
  const currentRole = getCurrentUserRole() ?? "agent";
  const canManageUsers = currentRole === "admin";
  const isSupervisor = currentRole === "supervisor";
  const [records, setRecords] = useState<UserRecord[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<UserRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const persistRecords = (nextRecords: UserRecord[]) => {
    setRecords(nextRecords);
    localStorage.setItem(USER_RECORDS_STORAGE_KEY, JSON.stringify(nextRecords));
  };

  const showStatusMessage = (message: string | null, timeoutMs?: number) => {
    setStatusMessage(message);

    if (timeoutMs) {
      window.setTimeout(() => {
        setStatusMessage((currentMessage) => (currentMessage === message ? null : currentMessage));
      }, timeoutMs);
    }
  };

  const mapBackendRoleToRecordRole = (role: BackendUser["role"]): UserRole => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "supervisor":
        return "Supervisor";
      default:
        return "Agente";
    }
  };

  const mapRecordRoleToBackendRole = (role: UserRole): BackendUser["role"] => {
    switch (role) {
      case "Administrador":
        return "admin";
      case "Supervisor":
        return "supervisor";
      default:
        return "agent";
    }
  };

  const mapBackendUserToRecord = (user: BackendUser, fallback?: UserRecord): UserRecord => ({
    id: user.id,
    name: user.fullName,
    position: fallback?.position ?? "",
    assignedPhone: fallback?.assignedPhone ?? "",
    deviceModel: fallback?.deviceModel ?? "",
    serialNumber: fallback?.serialNumber ?? "",
    serialNumber2: fallback?.serialNumber2 ?? "",
    photo: fallback?.photo ?? "",
    entryDate: fallback?.entryDate ?? user.createdAt,
    username: user.username,
    password: fallback?.password ?? "",
    role: mapBackendRoleToRecordRole(user.role),
  });

  const mergeRecordsWithBackendUsers = (storedRecords: UserRecord[], backendUsers: BackendUser[]) => {
    // Map to store extra info from localStorage (position, phone, device, etc.)
    const byId = new Map(storedRecords.map((record) => [record.id, record]));

    // Use backend users as source of truth for IDs and usernames
    // Only use localStorage for additional fields like position, phone, device
    const mergedRecords = backendUsers.map((user) => {
      const extraInfo = byId.get(user.id);
      return mapBackendUserToRecord(user, extraInfo);
    });

    return mergedRecords;
  };

  const buildPayload = (record: Omit<UserRecord, "id">) => ({
    fullName: record.name,
    username: record.username,
    passwordHash: record.password,
    role: mapRecordRoleToBackendRole(record.role),
    status: "active" as const,
    accessToPanel: record.role !== "Agente",
  });

  useEffect(() => {
    const role = currentRole;
    const storedRecords = localStorage.getItem(USER_RECORDS_STORAGE_KEY);
    let parsedStoredRecords: UserRecord[] = [];

    if (storedRecords) {
      try {
        parsedStoredRecords = JSON.parse(storedRecords) as UserRecord[];
        setRecords(parsedStoredRecords);
      } catch {
        localStorage.removeItem(USER_RECORDS_STORAGE_KEY);
      }
    }

    fetchUsers(role)
      .then((users) => {
        const mergedRecords = mergeRecordsWithBackendUsers(parsedStoredRecords, users);
        persistRecords(mergedRecords);
      })
      .catch(() => {
        if (!storedRecords) {
          setRecords([]);
        }
      });
  }, []);

  const handleAddRecord = async (record: Omit<UserRecord, "id">) => {
    setIsSaving(true);
    setStatusMessage(null);
    const role = currentRole;
    const payload = buildPayload(record);

    // Check for duplicate username in current records
    if (record.username && record.role !== "Agente") {
      const usernameExists = records.some(
        (r) => r.username.toLowerCase() === record.username.toLowerCase()
      );
      if (usernameExists) {
        setStatusMessage(`❌ El usuario "${record.username}" ya existe en el sistema.`);
        setIsSaving(false);
        return;
      }
    }

    try {
      const created = await createUser(payload, role, currentUser?.id ?? "system");
      
      // Save the full record with extra data to localStorage BEFORE refreshing
      const completeRecord: UserRecord = {
        id: created.id,
        name: record.name,
        position: record.position,
        assignedPhone: record.assignedPhone,
        deviceModel: record.deviceModel,
        serialNumber: record.serialNumber,
        serialNumber2: record.serialNumber2,
        photo: record.photo,
        entryDate: record.entryDate,
        username: record.username,
        password: record.password,
        role: record.role,
      };
      
      const updatedRecords = [...records, completeRecord];
      persistRecords(updatedRecords);
      
      // Then refresh from backend to sync
      const updatedUsers = await fetchUsers(role);
      const mergedRecords = mergeRecordsWithBackendUsers(updatedRecords, updatedUsers);
      persistRecords(mergedRecords);
      
      setIsFormOpen(false);
      showStatusMessage(`✓ Usuario registrado con éxito`, 5000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Error desconocido";
      console.error("Error al crear ficha:", errorMsg);
      if (errorMsg.includes("Unauthorized")) {
        setStatusMessage("❌ No tienes permisos para crear fichas. Solo administradores pueden hacerlo.");
      } else if (errorMsg.includes("duplicate") || errorMsg.includes("already exists")) {
        setStatusMessage("❌ El usuario ya existe en el sistema.");
      } else {
        setStatusMessage(`❌ Error al crear ficha: ${errorMsg}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRecord = async (record: Omit<UserRecord, "id">) => {
    if (!editingRecord) return;
    setIsSaving(true);
    setStatusMessage(null);
    const role = currentRole;
    const payload = buildPayload(record);

    try {
      await updateUser(editingRecord.id, payload, role, currentUser?.id ?? "system");
      
      // Save the full record with extra data to localStorage BEFORE refreshing
      const completeRecord: UserRecord = {
        id: editingRecord.id,
        name: record.name,
        position: record.position,
        assignedPhone: record.assignedPhone,
        deviceModel: record.deviceModel,
        serialNumber: record.serialNumber,
        serialNumber2: record.serialNumber2,
        photo: record.photo,
        entryDate: record.entryDate,
        username: record.username,
        password: record.password,
        role: record.role,
      };
      
      const updatedRecords = records.map((r) => (r.id === editingRecord.id ? completeRecord : r));
      persistRecords(updatedRecords);
      
      // Then refresh from backend to sync
      const updatedUsers = await fetchUsers(role);
      const mergedRecords = mergeRecordsWithBackendUsers(updatedRecords, updatedUsers);
      persistRecords(mergedRecords);
      
      setEditingRecord(null);
      setIsFormOpen(false);
      showStatusMessage("✓ Ficha actualizada correctamente", 3000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Error desconocido";
      console.error("Error al actualizar ficha:", errorMsg);
      if (errorMsg.includes("Unauthorized")) {
        setStatusMessage("❌ No tienes permisos para actualizar fichas.");
      } else {
        setStatusMessage(`❌ Error al actualizar: ${errorMsg}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta ficha? Se revocará el acceso al panel si aplica.")) {
      setIsSaving(true);
      setStatusMessage(null);
      const role = currentRole;
      try {
        await deleteUserById(id, role, currentUser?.id ?? "system");
        
        // Remove from localStorage first
        const updatedRecords = records.filter((r) => r.id !== id);
        persistRecords(updatedRecords);
        
        // Then refresh from backend to sync
        const updatedUsers = await fetchUsers(role);
        const mergedRecords = mergeRecordsWithBackendUsers(updatedRecords, updatedUsers);
        persistRecords(mergedRecords);
        
        showStatusMessage("✓ Ficha eliminada correctamente", 3000);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Error desconocido";
        console.error("Error al eliminar ficha:", errorMsg);
        if (errorMsg.includes("Unauthorized")) {
          setStatusMessage("❌ No tienes permisos para eliminar fichas.");
        } else {
          setStatusMessage(`❌ Error al eliminar ficha: ${errorMsg}`);
        }
      } finally {
        setIsSaving(false);
      }
    }
  };

  const openAddForm = () => {
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  const openEditForm = (record: UserRecord) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const formatEntryDate = (value: string) => {
    if (!value) return "Sin fecha";

    const [year, month, day] = value.split("-").map((part) => Number(part));
    if (!year || !month || !day) return value;

    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const filteredRecords = records.filter(
    (record) =>
      record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.serialNumber2.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Fichas del Usuario</h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Gestión de equipos y asignaciones de personal
            </p>
          </div>
          <button
            onClick={openAddForm}
            disabled={isSaving || !canManageUsers}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-[0.985] disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <Plus size={18} strokeWidth={2.5} />
            Añadir Ficha
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, cargo o serial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {statusMessage && (
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-700">
          {statusMessage}
        </div>
      )}

      {!canManageUsers && (
        <div className="border-t border-slate-200 bg-amber-50 px-5 py-3 text-sm text-amber-700">
          Solo los administradores pueden crear, editar o eliminar fichas.
        </div>
      )}

      {/* Records Grid */}
      <div className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredRecords.map((record) => (
          <div
            key={record.id}
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            {/* Photo and Name */}
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
                {record.photo ? (
                  <img
                    src={record.photo}
                    alt={record.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Camera size={24} />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-bold text-slate-800">{record.name}</h3>
                  <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">{record.role}</span>
                </div>
                <p className="truncate text-xs text-slate-600">{record.position}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Ingreso: {formatEntryDate(record.entryDate)}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600">Teléfono:</span>
                <span className="text-slate-800">{record.assignedPhone}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600">Modelo:</span>
                <span className="text-slate-800">{record.deviceModel}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600">Serial 1:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {record.serialNumber}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600">Serial 2:</span>
                <span className="font-mono font-semibold text-slate-900">{record.serialNumber2}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => openEditForm(record)}
                disabled={isSupervisor}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Pencil size={14} />
                Editar
              </button>
              <button
                onClick={() => handleDeleteRecord(record.id)}
                disabled={isSupervisor}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-50 hover:border-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={14} />
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredRecords.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Camera size={32} />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-600">No se encontraron fichas</p>
          <p className="mt-1 text-xs text-slate-500">
            {searchTerm
              ? "Intenta con otros términos de búsqueda"
              : "Añade la primera ficha de usuario"}
          </p>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <Dialog.Title className="text-xl font-bold text-slate-800">
              {editingRecord ? "Editar Ficha" : "Añadir Nueva Ficha"}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-slate-600">
              {editingRecord
                ? "Actualiza la información del usuario y su equipo asignado"
                : "Completa todos los campos para registrar un nuevo usuario"}
            </Dialog.Description>

            <UserRecordForm
              initialData={editingRecord || undefined}
              onSubmit={editingRecord ? handleEditRecord : handleAddRecord}
              onCancel={() => setIsFormOpen(false)}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
