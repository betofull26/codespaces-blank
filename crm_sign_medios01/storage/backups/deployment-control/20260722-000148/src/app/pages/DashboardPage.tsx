import { useEffect, useState } from "react";
import { Sidebar } from "../components/dashboard/Sidebar";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { Users } from "lucide-react";
import { fetchAgents, fetchConversations } from "../services/dashboardApi";
import type { Conversation } from "../components/dashboard/types";

export function DashboardPage() {
  const [agentsCount, setAgentsCount] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [conversationsError, setConversationsError] = useState<string | null>(null);

  useEffect(() => {
    const loadConversations = async () => {
      setIsLoadingConversations(true);
      setConversationsError(null);

      try {
        const data = await fetchConversations();
        setConversations(data);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        setConversationsError(error instanceof Error ? error.message : "Error al cargar conversaciones");
        setConversations([]);
      } finally {
        setIsLoadingConversations(false);
      }
    };

    loadConversations();
  }, []);

  useEffect(() => {
    let active = true;

    const loadAgents = async () => {
      try {
        const agents = await fetchAgents();
        if (!active) return;
        setAgentsCount(agents.length);
      } catch {
        if (!active) return;
        setAgentsCount(0);
      }
    };

    void loadAgents();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar selectedNode="dashboard" />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Users size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{agentsCount}</p>
                <p className="text-sm text-slate-500">Agentes</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <Users size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">0</p>
                <p className="text-sm text-slate-500">Agentes conectados</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
                <Users size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">0</p>
                <p className="text-sm text-slate-500">Agentes desconectados</p>
              </div>
            </div>
          </div>

          {conversationsError && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Error al cargar conversaciones: {conversationsError}
            </div>
          )}

          {isLoadingConversations && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Cargando conversaciones desde el backend...
            </div>
          )}

          {!conversationsError && !isLoadingConversations && conversations.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-slate-600">
              <p>No hay conversaciones disponibles.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
