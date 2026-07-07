import { useNavigate } from "react-router";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { Sidebar } from "../components/dashboard/Sidebar";
import { BookUser, FileText, MessageCircle } from "lucide-react";
import { getCurrentUser } from "../lib/auth";

export function AgentHomePage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar selectedNode="home" onSelectNode={() => {}} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto px-6 py-5">
          {/* Bienvenida */}
          <div className="mb-8 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-blue-900">
              ¡Bienvenido, {currentUser?.title}!
            </h1>
            <p className="mt-2 text-blue-700">
              Desde aquí puedes gestionar tus contactos y plantillas.
            </p>
          </div>

          {/* Opciones rápidas */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Directorio */}
            <button
              onClick={() => navigate("/directorio")}
              className="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-3">
                  <BookUser size={24} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Directorio</h2>
                  <p className="text-sm text-slate-600">Gestiona tus contactos</p>
                </div>
              </div>
            </button>

            {/* Plantilladas */}
            <button
              onClick={() => navigate("/plantilladas")}
              className="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-3">
                  <FileText size={24} className="text-green-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Plantilladas</h2>
                  <p className="text-sm text-slate-600">Ver plantillas de mensajes</p>
                </div>
              </div>
            </button>
          </div>

          {/* Información */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <MessageCircle size={20} className="mt-0.5 text-slate-500" />
              <div>
                <h3 className="font-semibold text-slate-900">¿Qué puedo hacer?</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Crear y gestionar contactos en el Directorio
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Usar plantillas predefinidas para responder mensajes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Recepcionar mensajes de clientes vía WhatsApp
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
