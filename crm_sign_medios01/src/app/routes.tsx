import { createBrowserRouter } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { DirectorioPage } from "./pages/DirectorioPage";
import { ConexionDispositivosPage } from "./pages/ConexionDispositivosPage";
import { PlantilladasPage } from "./pages/PlantilladasPage";
import { SettingsPage } from "./pages/SettingsPage";

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
    path: "/conexion-dispositivos",
    Component: ConexionDispositivosPage,
  },
  {
    path: "/plantilladas",
    Component: PlantilladasPage,
  },
  {
    path: "/ajustes",
    Component: SettingsPage,
  },
]);
