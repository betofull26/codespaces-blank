import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { Sidebar } from "../components/dashboard/Sidebar";
import { UserRecordManagement } from "../components/dashboard/UserRecordManagement";
import { getCurrentUser } from "../lib/auth";

export function UserManagementPage() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate("/", { replace: true });
      return;
    }

    if (currentUser.role === "agent") {
      navigate("/dashboard", { replace: true });
      return;
    }

    setIsAuthorized(true);
  }, [navigate]);

  if (!isAuthorized) {
    return null;
  }
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <Sidebar selectedNode="gestion-fichas" onSelectNode={() => {}} />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Fichas</h1>
            <p className="mt-1 text-sm text-slate-600">
              Administración completa de usuarios y equipos asignados
            </p>
          </div>
          <UserRecordManagement />
        </main>
      </div>
    </div>
  );
}
