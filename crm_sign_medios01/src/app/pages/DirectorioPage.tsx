import { useState } from "react";
import { BookUser, Shuffle } from "lucide-react";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { Sidebar } from "../components/dashboard/Sidebar";
import { DirectorioManagement } from "../components/dashboard/DirectorioManagement";
import { ReasignacionConversaciones } from "../components/dashboard/ReasignacionConversaciones";

const TABS = [
  { id: "directorio",    label: "Directorio de Contactos",      icon: <BookUser size={15} /> },
  { id: "reasignacion",  label: "Reasignación de Conversaciones", icon: <Shuffle size={15} /> },
] as const;

type Tab = (typeof TABS)[number]["id"];

export function DirectorioPage() {
  const [activeTab, setActiveTab] = useState<Tab>("directorio");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar selectedNode="directorio" onSelectNode={() => {}} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto px-6 py-5">
          {/* Page title */}
          <div className="mb-5">
            <h1 className="text-xl font-bold text-slate-800">Directorio</h1>
            <p className="mt-1 text-sm text-slate-500">
              Gestión de contactos y reasignación de conversaciones entre agentes.
            </p>
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
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "directorio"   && <DirectorioManagement />}
          {activeTab === "reasignacion" && <ReasignacionConversaciones />}
        </main>
      </div>
    </div>
  );
}
