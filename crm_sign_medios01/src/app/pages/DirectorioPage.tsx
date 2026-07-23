import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { Sidebar } from "../components/dashboard/Sidebar";
import { getCurrentUser } from "../lib/auth";
import { useEffect, useState } from "react";
import { UserPlus, Pencil, Trash2 } from "lucide-react";
import { fetchAgents, fetchContacts, createContact, updateContact, deleteContact } from "../services/dashboardApi";
import type { Agent } from "../components/dashboard/types";

export function DirectorioPage() {
  const currentUser = getCurrentUser();
  const isSupervisor = currentUser?.role === "supervisor";
  const [agents, setAgents] = useState<Agent[]>([]);
  const [contacts, setContacts] = useState<{ id: string; name: string; phone: string; company: string | null; position: string | null; createdAt: string; userId: string | null }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactCompany, setNewContactCompany] = useState('');
  const [newContactPosition, setNewContactPosition] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await fetchAgents();
        const allContacts = await fetchContacts();
        if (!active) return;
        setAgents(data);
        setContacts(allContacts);
      } catch {
        setAgents([]);
        setContacts([]);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const onAddNumber = () => {
    setShowAddForm(true);
  };

  const cancelAddContact = () => {
    setShowAddForm(false);
    setEditingContactId(null);
    setNewContactName('');
    setNewContactPhone('');
    setNewContactCompany('');
    setNewContactPosition('');
  };

  const startEditContact = (contactId: string, name: string, phone: string, company: string | null, position: string | null) => {
    setEditingContactId(contactId);
    setNewContactName(name);
    setNewContactPhone(phone);
    setNewContactCompany(company ?? '');
    setNewContactPosition(position ?? '');
    setShowAddForm(true);
  };

  const saveContact = async () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      alert('Completa nombre y teléfono antes de guardar.');
      return;
    }

    try {
      if (editingContactId) {
        await updateContact(editingContactId, newContactName.trim(), newContactPhone.trim(), newContactCompany.trim(), newContactPosition.trim());
      } else {
        await createContact(newContactName.trim(), newContactPhone.trim(), newContactCompany.trim(), newContactPosition.trim());
      }
      const updated = await fetchContacts();
      setContacts(updated);
      setNewContactName('');
      setNewContactPhone('');
      setNewContactCompany('');
      setNewContactPosition('');
      setShowAddForm(false);
      setEditingContactId(null);
      alert(editingContactId ? 'Contacto actualizado' : 'Contacto añadido');
    } catch (err) {
      alert(editingContactId ? 'No se pudo actualizar el contacto' : 'No se pudo añadir el contacto');
    }
  };

  const removeContact = async (contactId: string) => {
    if (!confirm('¿Seguro que deseas eliminar este contacto?')) return;
    try {
      await deleteContact(contactId);
      const updated = await fetchContacts();
      setContacts(updated);
    } catch {
      alert('No se pudo eliminar el contacto');
    }
  };

  const agentMap = new Map<string, Agent>(agents.map((agent) => [agent.id, agent]));

  const combinedContacts = contacts.map((contact) => {
    const agent = agentMap.get(contact.userId ?? '');
    return {
      ...contact,
      agentName: agent?.name ?? 'Directorio',
      agentPhone: agent?.phone ?? '—',
    };
  });

  const filteredContacts = combinedContacts.filter((contact) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch = !q || contact.name.toLowerCase().includes(q) || contact.phone.includes(q) || (contact.company ?? '').toLowerCase().includes(q) || (contact.position ?? '').toLowerCase().includes(q);
    const matchesAgent = !selectedUserId || contact.userId === selectedUserId;
    return matchesSearch && matchesAgent;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar selectedNode="directorio" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-slate-800">Directorio</h1>
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                placeholder="🔍 Buscar contacto por nombre"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-3 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                onClick={onAddNumber}
              >
                <UserPlus size={16} />
              </button>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
              >
                <option value="">Todas las cuentas</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} — {agent.phone ?? 'sin WhatsApp'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {showAddForm && (
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 text-sm font-semibold text-slate-800">Nuevo contacto</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm text-slate-700">
                  Nombre
                  <input
                    type="text"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-slate-700">
                  Teléfono
                  <input
                    type="text"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-slate-700">
                  Empresa
                  <input
                    type="text"
                    value={newContactCompany}
                    onChange={(e) => setNewContactCompany(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-slate-700">
                  Cargo
                  <input
                    type="text"
                    value={newContactPosition}
                    onChange={(e) => setNewContactPosition(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  onClick={saveContact}
                >
                  Guardar
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  onClick={cancelAddContact}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 grid gap-3 text-xs uppercase tracking-wide text-slate-500 sm:grid-cols-[2fr_1fr_1fr]">
              <span>Contacto</span>
              <span>Teléfono</span>
              <span>Cuenta</span>
            </div>
            <div className="space-y-2">
              {filteredContacts.length === 0 ? (
                <p className="text-sm text-slate-400">No hay contactos que coincidan.</p>
              ) : (
                filteredContacts.map((contact) => (
                  <div key={`${contact.userId}-${contact.id}`} className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-center">
                    <div>
                      <p className="font-medium text-slate-800">{contact.name}</p>
                      {(contact.company || contact.position) && (
                        <p className="text-xs text-slate-500">
                          {[contact.company, contact.position].filter(Boolean).join(' - ')}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">{contact.agentName}</p>
                    </div>
                    <p className="text-sm text-slate-700">{contact.phone}</p>
                    <p className="text-sm text-slate-700">{contact.agentPhone}</p>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 transition hover:bg-amber-200"
                        onClick={() => startEditContact(contact.id, contact.name, contact.phone, contact.company, contact.position)}
                        aria-label="Editar contacto"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-700 transition hover:bg-red-200"
                        onClick={() => removeContact(contact.id)}
                        aria-label="Eliminar contacto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
