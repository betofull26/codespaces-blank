import { createBrowserRouter } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { DirectorioPage } from "./pages/DirectorioPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AgentPanelPage } from "./pages/AgentPanelPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginPage,
  },
  {
    path: "/dashboard",
    Component: DashboardPage,
  },
  {
    path: "/gestion-fichas",
    Component: UserManagementPage,
  },
  {
    path: "/directorio",
    Component: DirectorioPage,
  },
  {
    path: "/ajustes",
    Component: SettingsPage,
  },
  {
    path: "/panel-agente",
    Component: AgentPanelPage,
  },
]);
