import { useEffect, useState } from "react";
import { Sidebar } from "../components/dashboard/Sidebar";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { fetchConversations } from "../services/dashboardApi";
import type { Conversation } from "../components/dashboard/types";

export function DashboardPage() {
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

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar selectedNode="dashboard" onSelectNode={() => {}} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto px-6 py-5">
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

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-slate-600">
            {conversations.length === 0 && !isLoadingConversations ? (
              <p>No hay conversaciones disponibles.</p>
            ) : (
              <p>El panel de detalle de chat ha sido removido.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
