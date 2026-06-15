import { useState } from "react";
import { Plus, Pencil, Trash2, Camera, Search } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { UserRecordForm } from "./UserRecordForm";

export interface UserRecord {
  id: string;
  position: string;
  assignedPhone: string;
  deviceModel: string;
  deviceNumber: string;
  serialNumber: string;
  photo?: string;
  entryDate: string;
  name: string;
  username: string;
  password: string;
  role: "Administrador" | "Supervisor" | "Agente" | "Suspendido";
}

const mockRecords: UserRecord[] = [
  {
    id: "1",
    name: "María González",
    position: "Ejecutivo de Ventas",
    assignedPhone: "+52 55 1234 5678",
    deviceModel: "iPhone 14 Pro",
    deviceNumber: "5512345678",
    serialNumber: "F2KXH9MNPQ3L",
    entryDate: "2024-01-15",
    username: "mgonzalez",
    password: "Pass@2026",
    role: "Agente",
  },
  {
    id: "2",
    name: "Juan Pérez",
    position: "Gerente de Zona",
    assignedPhone: "+52 55 8765 4321",
    deviceModel: "Samsung Galaxy S23",
    deviceNumber: "5587654321",
    serialNumber: "R58NVKDM9X2P",
    entryDate: "2023-08-22",
    username: "jperez",
    password: "Pass@2026",
    role: "Supervisor",
  },
  {
    id: "3",
    name: "Ana Martínez",
    position: "Soporte Técnico",
    assignedPhone: "+52 55 2468 1357",
    deviceModel: "iPhone 13",
    deviceNumber: "5524681357",
    serialNumber: "C3WYH7TLPK9M",
    entryDate: "2024-03-10",
    username: "amartinez",
    password: "Pass@2026",
    role: "Administrador",
  },
];

export function UserRecordManagement() {
  const [records, setRecords] = useState<UserRecord[]>(mockRecords);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<UserRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleAddRecord = (record: Omit<UserRecord, "id">) => {
    const newRecord = {
      ...record,
      id: String(Date.now()),
    };
    setRecords((prev) => [...prev, newRecord]);
    setIsFormOpen(false);
  };

  const handleEditRecord = (record: Omit<UserRecord, "id">) => {
    if (!editingRecord) return;
    setRecords((prev) =>
      prev.map((r) => (r.id === editingRecord.id ? { ...record, id: r.id } : r))
    );
    setEditingRecord(null);
    setIsFormOpen(false);
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta ficha?")) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
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
      record.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
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
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-[0.985]"
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
                <h3 className="truncate text-sm font-bold text-slate-800">{record.name}</h3>
                <p className="truncate text-xs text-slate-600">{record.position}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Ingreso: {new Date(record.entryDate).toLocaleDateString("es-MX")}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600">Usuario:</span>
                <span className="text-slate-800">{record.username}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600">Rol:</span>
                <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">{record.role}</span>
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
                <span className="font-medium text-slate-600">Número:</span>
                <span className="text-slate-800">{record.deviceNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600">Serial:</span>
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
