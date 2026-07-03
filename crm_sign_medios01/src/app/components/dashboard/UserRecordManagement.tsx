import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Camera, Search } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { UserRecordForm } from "./UserRecordForm";
import { createUser, fetchUsers, updateUser, updateUserStatus, type BackendUser } from "../../services/dashboardApi";
import { getCurrentUser } from "../../lib/auth";

const USER_RECORDS_STORAGE_KEY = "crm-sign-user-records";

export type UserRole = "Administrador" | "Supervisor" | "Agente" | "Suspendido";

export interface UserRecord {
  id: string;
  position: string;
  assignedPhone: string;
  deviceModel: string;
  deviceNumber: string;
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

  const mapBackendUserToRecord = (user: BackendUser): UserRecord => ({
    id: user.id,
    name: user.fullName,
    position: user.email,
    assignedPhone: "",
    deviceModel: "",
    deviceNumber: "",
    serialNumber: user.username,
    serialNumber2: user.role,
    entryDate: user.createdAt,
    username: user.username,
    password: user.passwordHash,
    role: user.role === "admin" ? "Administrador" : user.role === "supervisor" ? "Supervisor" : "Agente",
  });

  const buildPayload = (record: Omit<UserRecord, "id">) => ({
    fullName: record.name,
    email: record.position,
    username: record.username,
    passwordHash: record.password,
    role: record.role === "Administrador" ? "admin" : record.role === "Supervisor" ? "supervisor" : "agent",
    status: "active" as const,
    accessToPanel: record.role !== "Agente",
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    const role = currentUser?.role ?? "agent";
    const storedRecords = localStorage.getItem(USER_RECORDS_STORAGE_KEY);

    if (storedRecords) {
      try {
        const parsed = JSON.parse(storedRecords) as UserRecord[];
        setRecords(parsed);
      } catch {
        localStorage.removeItem(USER_RECORDS_STORAGE_KEY);
      }
    }

    fetchUsers(role)
      .then((users) => {
        const mapped = users.map(mapBackendUserToRecord);
        persistRecords(mapped);
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
    const currentUser = getCurrentUser();
    const role = currentUser?.role ?? "agent";
    const payload = buildPayload(record);

    try {
      const created = await createUser(payload, role);
      const nextRecord = {
        id: created.id,
        name: created.fullName,
        position: created.email,
        assignedPhone: record.assignedPhone,
        deviceModel: record.deviceModel,
        deviceNumber: record.deviceNumber,
        serialNumber: created.username,
        serialNumber2: created.role,
        entryDate: created.createdAt,
        username: created.username,
        password: created.passwordHash,
        role: created.role === "admin" ? "Administrador" : created.role === "supervisor" ? "Supervisor" : "Agente",
      } as UserRecord;

      const nextRecords = [...records, nextRecord];
      persistRecords(nextRecords);
      setIsFormOpen(false);
      setStatusMessage("Ficha creada correctamente");
    } catch {
      const fallbackRecord = {
        id: `local-${Date.now()}`,
        ...record,
      } as UserRecord;
      const nextRecords = [...records, fallbackRecord];
      persistRecords(nextRecords);
      setIsFormOpen(false);
      setStatusMessage("Se guardó localmente porque el backend no respondió");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRecord = async (record: Omit<UserRecord, "id">) => {
    if (!editingRecord) return;
    setIsSaving(true);
    setStatusMessage(null);
    const currentUser = getCurrentUser();
    const role = currentUser?.role ?? "agent";
    const payload = buildPayload(record);

    try {
      const updated = await updateUser(editingRecord.id, payload, role);
      const nextRecords = records.map((r) => (r.id === editingRecord.id ? {
        ...r,
        name: updated.fullName,
        position: updated.email,
        username: updated.username,
        password: updated.passwordHash,
        role: updated.role === "admin" ? "Administrador" : updated.role === "supervisor" ? "Supervisor" : "Agente",
      } : r));
      persistRecords(nextRecords);
      setEditingRecord(null);
      setIsFormOpen(false);
      setStatusMessage("Ficha actualizada correctamente");
    } catch {
      const nextRecords = records.map((r) => (r.id === editingRecord.id ? { ...r, ...record, id: r.id } : r));
      persistRecords(nextRecords);
      setEditingRecord(null);
      setIsFormOpen(false);
      setStatusMessage("Se actualizó localmente porque el backend no respondió");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas actualizar el estado de esta ficha?")) {
      setIsSaving(true);
      setStatusMessage(null);
      const currentUser = getCurrentUser();
      const role = currentUser?.role ?? "agent";
      try {
        const updated = await updateUserStatus(id, "suspended", role);
        const nextRecords = records.map((record) => record.id === id ? { ...record, role: updated.status === "suspended" ? "Suspendido" as UserRole : record.role } : record);
        persistRecords(nextRecords);
        setStatusMessage("Estado actualizado correctamente");
      } catch {
        const nextRecords = records.map((record) => record.id === id ? { ...record, role: "Suspendido" as UserRole } : record);
        persistRecords(nextRecords);
        setStatusMessage("Se marcó localmente como suspendida");
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
            disabled={isSaving}
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
                  Ingreso: {new Date(record.entryDate).toLocaleDateString("es-MX")}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600">Serial 2:</span>
                <span className="font-mono font-semibold text-slate-900">{record.serialNumber2}</span>
              </div>
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
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => openEditForm(record)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-400"
              >
                <Pencil size={14} />
                Editar
              </button>
              <button
                onClick={() => handleDeleteRecord(record.id)}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-50 hover:border-red-300"
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
