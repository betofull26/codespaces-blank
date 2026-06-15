import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Plus, Pencil, Trash2, Phone, Search, User, Users } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { DirectorioForm } from "./DirectorioForm";
import { DraggableContact } from "./DraggableContact";
import { AgentDropZone } from "./AgentDropZone";

export interface ClientContact {
  id: string;
  name: string;
  phone: string;
  assignedTo?: string;
}

export interface Agent {
  id: string;
  name: string;
  color: string;
}

const mockContacts: ClientContact[] = [
  {
    id: "1",
    name: "María González",
    phone: "+52 55 1234 5678",
  },
  {
    id: "2",
    name: "Juan Pérez",
    phone: "+52 55 8765 4321",
  },
  {
    id: "3",
    name: "Ana Martínez",
    phone: "+52 55 2468 1357",
  },
  {
    id: "4",
    name: "Carlos López",
    phone: "+52 55 9876 5432",
  },
  {
    id: "5",
    name: "Laura Fernández",
    phone: "+52 55 3691 2580",
  },
];

const agents: Agent[] = [
  { id: "agent-1", name: "Roberto Sánchez", color: "bg-blue-500" },
  { id: "agent-2", name: "Patricia Ruiz", color: "bg-emerald-500" },
  { id: "agent-3", name: "Miguel Torres", color: "bg-purple-500" },
  { id: "agent-4", name: "Sofía Vargas", color: "bg-amber-500" },
];

export function DirectorioManagement() {
  const [contacts, setContacts] = useState<ClientContact[]>(mockContacts);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ClientContact | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleAddContact = (contact: Omit<ClientContact, "id">) => {
    const newContact = {
      ...contact,
      id: String(Date.now()),
    };
    setContacts((prev) => [...prev, newContact]);
    setIsFormOpen(false);
  };

  const handleEditContact = (contact: Omit<ClientContact, "id">) => {
    if (!editingContact) return;
    setContacts((prev) =>
      prev.map((c) => (c.id === editingContact.id ? { ...contact, id: c.id } : c))
    );
    setEditingContact(null);
    setIsFormOpen(false);
  };

  const handleDeleteContact = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este contacto?")) {
      setContacts((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleAssignContact = (contactId: string, agentId: string | null) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, assignedTo: agentId || undefined } : c))
    );
  };

  const openAddForm = () => {
    setEditingContact(null);
    setIsFormOpen(true);
  };

  const openEditForm = (contact: ClientContact) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  };

  const unassignedContacts = contacts.filter((c) => !c.assignedTo);
  const filteredUnassigned = unassignedContacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm)
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Unassigned Contacts */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-1">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Contactos Disponibles</h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  {unassignedContacts.length} sin asignar
                </p>
              </div>
              <button
                onClick={openAddForm}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-[0.985]"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="max-h-[calc(100vh-20rem)] overflow-y-auto p-3">
            <div className="space-y-2">
              {filteredUnassigned.map((contact) => (
                <DraggableContact
                  key={contact.id}
                  contact={contact}
                  onEdit={openEditForm}
                  onDelete={handleDeleteContact}
                />
              ))}
            </div>

            {filteredUnassigned.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <User size={24} />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-600">
                  {searchTerm ? "No hay resultados" : "Todos asignados"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Agents */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <Users size={20} className="text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Asignación de Contactos por Agente
              </p>
              <p className="text-xs text-slate-600">
                Arrastra contactos a los agentes para asignarlos
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {agents.map((agent) => (
              <AgentDropZone
                key={agent.id}
                agent={agent}
                contacts={contacts.filter((c) => c.assignedTo === agent.id)}
                onAssign={handleAssignContact}
                onEdit={openEditForm}
                onDelete={handleDeleteContact}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <Dialog.Title className="text-xl font-bold text-slate-800">
              {editingContact ? "Editar Contacto" : "Añadir Nuevo Contacto"}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-slate-600">
              {editingContact
                ? "Actualiza la información del contacto"
                : "Completa los datos del nuevo contacto"}
            </Dialog.Description>

            <DirectorioForm
              initialData={editingContact || undefined}
              onSubmit={editingContact ? handleEditContact : handleAddContact}
              onCancel={() => setIsFormOpen(false)}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </DndProvider>
  );
}
