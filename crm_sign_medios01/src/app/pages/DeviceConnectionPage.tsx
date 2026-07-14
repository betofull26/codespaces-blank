import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { Sidebar } from "../components/dashboard/Sidebar";

export function DeviceConnectionPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar selectedNode="conexion-dispositivo" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto px-6 py-5">
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-800">Conexión de dispositivo</h1>
            <p className="mt-2 text-sm text-slate-600">
              Aquí podrás gestionar la conexión de dispositivos para la plataforma.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
