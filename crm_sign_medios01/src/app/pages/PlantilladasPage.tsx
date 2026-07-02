import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { Sidebar } from "../components/dashboard/Sidebar";

export function PlantilladasPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar selectedNode="plantilladas" onSelectNode={() => {}} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto px-6 py-5">
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-slate-800">Plantilladas</h1>
            <p className="mt-4 text-sm text-slate-600">
              Esta sección se reservará para las plantillas y workflows predefinidos.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
