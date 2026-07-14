import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Home, BookUser, FileText, LogOut, SlidersHorizontal, MessageSquare, Smartphone, Users } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { AuthUser, clearCurrentUser, getCurrentUser } from "../../lib/auth";
import companyLogo from "../../../imports/IMG_20260602_130639_278.jpg";

interface SidebarProps {
  selectedNode: string;
}

export function Sidebar({ selectedNode }: SidebarProps) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const isAdminOrSupervisor = currentUser?.role === "admin" || currentUser?.role === "supervisor";

  if (!currentUser) {
    return null;
  }

  const handleLogout = async () => {
    await clearCurrentUser();
    setCurrentUser(null);
    navigate("/", { replace: true });
  };

  return (
    <aside className="flex w-72 flex-col border-r border-slate-200 bg-white shadow-sm">
      {/* Logo */}
      <div className="border-b border-slate-200 px-5 py-4">
        <ImageWithFallback
          src={companyLogo}
          alt="SIGN Medios"
          className="h-10 w-auto object-contain"
        />
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {/* Dashboard - Solo Admin/Supervisor */}
          {isAdminOrSupervisor && (
            <div
              className={[
                "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all",
                selectedNode === "dashboard"
                  ? "bg-blue-50 font-semibold text-blue-700"
                  : "text-slate-700 hover:bg-slate-100",
              ].join(" ")}
              onClick={() => navigate("/dashboard")}
            >
              <Home
                size={18}
                className={selectedNode === "dashboard" ? "text-blue-600" : "text-slate-500"}
              />
              <span className="flex-1 truncate">Dashboard</span>
              {selectedNode === "dashboard" && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
              )}
            </div>
          )}

          {/* Directorio - Todos */}
          <div
            className={[
              "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all",
              selectedNode === "directorio"
                ? "bg-blue-50 font-semibold text-blue-700"
                : "text-slate-700 hover:bg-slate-100",
            ].join(" ")}
            onClick={() => navigate("/directorio")}
          >
            <BookUser
              size={18}
              className={selectedNode === "directorio" ? "text-blue-600" : "text-slate-500"}
            />
            <span className="flex-1 truncate">Directorio</span>
            {selectedNode === "directorio" && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
            )}
          </div>

          {/* Chats - Todos */}
          <div
            className={[
              "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all",
              selectedNode === "chats"
                ? "bg-blue-50 font-semibold text-blue-700"
                : "text-slate-700 hover:bg-slate-100",
            ].join(" ")}
            onClick={() => navigate("/dashboard")}
          >
            <MessageSquare
              size={18}
              className={selectedNode === "chats" ? "text-blue-600" : "text-slate-500"}
            />
            <span className="flex-1 truncate">Chats</span>
            {selectedNode === "chats" && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
            )}
          </div>

          {/* Plantilladas - Todos */}
          <div
            className={[
              "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all",
              selectedNode === "plantilladas"
                ? "bg-blue-50 font-semibold text-blue-700"
                : "text-slate-700 hover:bg-slate-100",
            ].join(" ")}
            onClick={() => navigate("/plantilladas")}
          >
            <FileText
              size={18}
              className={selectedNode === "plantilladas" ? "text-blue-600" : "text-slate-500"}
            />
            <span className="flex-1 truncate">Plantilladas</span>
            {selectedNode === "plantilladas" && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
            )}
          </div>

          {/* Gestion de fichas - Solo Admin/Supervisor */}
          {isAdminOrSupervisor && (
            <div
              className={[
                "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all",
                selectedNode === "gestion-fichas"
                  ? "bg-blue-50 font-semibold text-blue-700"
                  : "text-slate-700 hover:bg-slate-100",
              ].join(" ")}
              onClick={() => navigate("/gestion-fichas")}
            >
              <Users
                size={18}
                className={selectedNode === "gestion-fichas" ? "text-blue-600" : "text-slate-500"}
              />
              <span className="flex-1 truncate">Gestión de fichas</span>
              {selectedNode === "gestion-fichas" && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
              )}
            </div>
          )}

          {/* Conexion de dispositivo - Solo Admin/Supervisor */}
          {isAdminOrSupervisor && (
            <div
              className={[
                "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all",
                selectedNode === "conexion-dispositivo"
                  ? "bg-blue-50 font-semibold text-blue-700"
                  : "text-slate-700 hover:bg-slate-100",
              ].join(" ")}
              onClick={() => navigate("/conexion-dispositivo")}
            >
              <Smartphone
                size={18}
                className={selectedNode === "conexion-dispositivo" ? "text-blue-600" : "text-slate-500"}
              />
              <span className="flex-1 truncate">Conexion de dispositivo</span>
              {selectedNode === "conexion-dispositivo" && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
              )}
            </div>
          )}

          {/* Ajustes - Solo Admin/Supervisor */}
          {isAdminOrSupervisor && (
            <div
              className={[
                "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all",
                selectedNode === "ajustes"
                  ? "bg-blue-50 font-semibold text-blue-700"
                  : "text-slate-700 hover:bg-slate-100",
              ].join(" ")}
              onClick={() => navigate("/ajustes")}
            >
              <SlidersHorizontal
                size={18}
                className={selectedNode === "ajustes" ? "text-blue-600" : "text-slate-500"}
              />
              <span className="flex-1 truncate">Ajustes</span>
              {selectedNode === "ajustes" && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* User profile — bottom of sidebar */}
      <div className="border-t border-slate-200 p-3">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                SM
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{currentUser.username}</p>
              </div>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[220px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
              sideOffset={8}
              side="top"
              align="start"
            >
              <DropdownMenu.Separator className="my-1.5 h-px bg-slate-200" />
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 outline-none transition-colors hover:bg-red-50 focus:bg-red-50"
                onSelect={handleLogout}
              >
                <LogOut size={15} />
                Cerrar sesión
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </aside>
  );
}
