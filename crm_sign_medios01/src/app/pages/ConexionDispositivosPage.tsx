import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { Sidebar } from "../components/dashboard/Sidebar";
import { getCurrentUser } from "../lib/auth";
import { AlertCircle } from "lucide-react";

export function ConexionDispositivosPage() {
  const user = getCurrentUser();
  const isAdmin = user?.role === "admin";
  const isSupervisor = user?.role === "supervisor";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar selectedNode="conexion-dispositivos" onSelectNode={() => {}} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto px-6 py-5">
          {!isAdmin && !isSupervisor ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-red-600" size={24} />
                <div>
                  <h1 className="text-xl font-semibold text-red-800">Acceso Restringido</h1>
                  <p className="mt-2 text-sm text-red-700">
                    Solo los administradores tienen permiso para conectar dispositivos.
                  </p>
                </div>
              </div>
            </div>
          ) : isAdmin ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <h1 className="text-xl font-semibold text-slate-800">Conexión de Dispositivos</h1>
              <p className="mt-4 text-sm text-slate-600">
                Esta sección mostrará el estado y la administración de los dispositivos conectados.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-amber-600" size={24} />
                <div>
                  <h1 className="text-xl font-semibold text-amber-800">Acceso Restringido</h1>
                  <p className="mt-2 text-sm text-amber-700">
                    Los supervisores pueden ver esta sección, pero no tienen permisos para ejecutar acciones de conexión de dispositivos.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
