import { createBrowserRouter, redirect } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { DirectorioPage } from "./pages/DirectorioPage";
import { ConexionDispositivosPage } from "./pages/ConexionDispositivosPage";
import { PlantilladasPage } from "./pages/PlantilladasPage";
import { SettingsPage } from "./pages/SettingsPage";
import { clearCurrentUser, getCurrentUser, isSessionExpired } from "./lib/auth";

const requireAuth = () => {
  const user = getCurrentUser();
  if (!user || isSessionExpired()) {
    clearCurrentUser();
    throw redirect("/");
  }

  return null;
};

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginPage,
  },
  {
    path: "/dashboard",
    Component: DashboardPage,
    loader: requireAuth,
  },
  {
    path: "/gestion-fichas",
    Component: UserManagementPage,
    loader: requireAuth,
  },
  {
    path: "/directorio",
    Component: DirectorioPage,
    loader: requireAuth,
  },
  {
    path: "/conexion-dispositivos",
    Component: ConexionDispositivosPage,
    loader: requireAuth,
  },
  {
    path: "/plantilladas",
    Component: PlantilladasPage,
    loader: requireAuth,
  },
  {
    path: "/ajustes",
    Component: SettingsPage,
    loader: requireAuth,
  },
]);
