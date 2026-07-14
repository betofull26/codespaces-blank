import { createBrowserRouter, redirect } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { DirectorioPage } from "./pages/DirectorioPage";
import { PlantilladasPage } from "./pages/PlantilladasPage";
import { SettingsPage } from "./pages/SettingsPage";
import { DeviceConnectionPage } from "./pages/DeviceConnectionPage";
import { clearCurrentUser, getCurrentUser, isSessionExpired } from "./lib/auth";

const requireAuth = () => {
  const user = getCurrentUser();
  if (!user || isSessionExpired()) {
    clearCurrentUser();
    throw redirect("/");
  }

  if (user.role === "agent") {
    clearCurrentUser();
    throw redirect("/");
  }

  return null;
};

const requireAdminOrSupervisor = () => {
  const user = getCurrentUser();
  
  if (!user || isSessionExpired()) {
    clearCurrentUser();
    throw redirect("/");
  }

  if (user.role !== "admin" && user.role !== "supervisor") {
    throw redirect("/directorio");
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
    loader: requireAdminOrSupervisor,
  },
  {
    path: "/gestion-fichas",
    Component: UserManagementPage,
    loader: requireAdminOrSupervisor,
  },
  {
    path: "/directorio",
    Component: DirectorioPage,
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
    loader: requireAdminOrSupervisor,
  },
  {
    path: "/conexion-dispositivo",
    Component: DeviceConnectionPage,
    loader: requireAdminOrSupervisor,
  },
]);
