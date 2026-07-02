import { useState, useEffect } from "react";
import { Users, UserCheck, Search, MessageSquare } from "lucide-react";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { Sidebar } from "../components/dashboard/Sidebar";
import { AgentCard } from "../components/dashboard/AgentCard";
import { AgentChatTree } from "../components/dashboard/AgentChatTree";
import { KPICards } from "../components/dashboard/KPICards";
import { agentsData } from "../components/dashboard/agentsData";
import { fetchAgents } from "../services/dashboardApi";
import type { Agent } from "../components/dashboard/types";

export function DashboardPage() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [agentsError, setAgentsError] = useState<string | null>(null);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const data = await fetchAgents();
        setAgents(data);
        setAgentsError(null);
      } catch (error) {
        console.error("Error fetching agents:", error);
        setAgentsError(error instanceof Error ? error.message : "Error al cargar agentes");
        setAgents(agentsData);
      } finally {
        setIsLoadingAgents(false);
      }
    };

    loadAgents();
  }, []);

  const totalAgents = agents.length;
  const onlineAgents = agents.filter((a) => a.online).length;
  const offlineAgents = totalAgents - onlineAgents;

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "online" && agent.online) ||
      (statusFilter === "offline" && !agent.online);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar selectedNode="dashboard" onSelectNode={() => {}} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto px-6 py-5">
          <KPICards
            cards={[
              { icon: <Users size={20} />, label: "Total de Agentes", value: totalAgents, color: "blue" },
              { icon: <UserCheck size={20} />, label: "Agentes Conectados", value: onlineAgents, color: "emerald" },
              { icon: <Users size={20} />, label: "Agentes Desconectados", value: offlineAgents, color: "slate" },
            ]}
          />

          {agentsError && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Error al cargar agentes: {agentsError}. Usando datos de fallback.
            </div>
          )}

          {isLoadingAgents && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Cargando agentes desde la API...
            </div>
          )}

          {/* Section title + filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-slate-800">
              Agentes ({filteredAgents.length})
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar agente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                />
              </div>
              {(["all", "online", "offline"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={[
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    statusFilter === f
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {f === "all" ? "Todos" : f === "online" ? "Conectados" : "Desconectados"}
                </button>
              ))}
            </div>
          </div>

          {/* Agents grid */}
          {filteredAgents.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">
              No se encontraron agentes
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isSelected={selectedAgent?.id === agent.id}
                  onClick={(a) => setSelectedAgent(a)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Chat history modal — mounts once, swaps agent via key */}
      {selectedAgent && (
        <AgentChatTree
          key={selectedAgent.id}
          agent={selectedAgent}
          open={true}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
}
