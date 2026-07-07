import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { Sidebar } from "../components/dashboard/Sidebar";
import { getCurrentUser } from "../lib/auth";
import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { fetchAgents, fetchContacts, createContact } from "../services/dashboardApi";
import type { Agent } from "../components/dashboard/types";

export function DirectorioPage() {
  const currentUser = getCurrentUser();
  const isSupervisor = currentUser?.role === "supervisor";
  const [agents, setAgents] = useState<Agent[]>([]);
  const [contacts, setContacts] = useState<{ id: string; name: string; phone: string; createdAt: string; agentId: string | null }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

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
    setNewContactName('');
    setNewContactPhone('');
  };

  const saveContact = async () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      alert('Completa nombre y teléfono antes de guardar.');
      return;
    }

    try {
      await createContact(newContactName.trim(), newContactPhone.trim());
      const updated = await fetchContacts();
      setContacts(updated);
      setNewContactName('');
      setNewContactPhone('');
      setShowAddForm(false);
      alert('Contacto añadido');
    } catch (err) {
      alert('No se pudo añadir el contacto');
    }
  };

  const agentMap = new Map<string, Agent>(agents.map((agent) => [agent.id, agent]));

  const combinedContacts = contacts.map((contact) => {
    const agent = agentMap.get(contact.agentId);
    return {
      ...contact,
      agentName: agent?.name ?? 'Directorio',
      agentPhone: agent?.phone ?? '—',
    };
  });

  const filteredContacts = combinedContacts.filter((contact) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch = !q || contact.name.toLowerCase().includes(q) || contact.phone.includes(q);
    const matchesAgent = !selectedAgentId || contact.agentId === selectedAgentId;
    return matchesSearch && matchesAgent;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar selectedNode="directorio" onSelectNode={() => {}} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-slate-800">Directorio</h1>
            <p className="mt-1 text-sm text-slate-600">Contactos organizados por cuenta de WhatsApp del agente.</p>
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                placeholder="Buscar contactos por nombre o teléfono..."
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
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
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
                  <div key={`${contact.agentId}-${contact.id}`} className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 sm:grid-cols-[2fr_1fr_1fr]">
                    <div>
                      <p className="font-medium text-slate-800">{contact.name}</p>
                      <p className="text-xs text-slate-500">{contact.agentName}</p>
                    </div>
                    <p className="text-sm text-slate-700">{contact.phone}</p>
                    <p className="text-sm text-slate-700">{contact.agentPhone}</p>
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
