# Documentación de la Pantalla de Ajustes / Copias de Seguridad y sus Funcionalidades

Este documento detalla a fondo la pantalla **Ajustes** (especialmente la pestaña de **Copias de seguridad / Respaldos**) en la aplicación **CRM SIGN Medios**, cubriendo su interfaz de usuario, estados de React, API del backend, diseño de base de datos y modelo de permisos (RBAC).

---

## 1. Estructura Visual y Diseño

La pantalla de Ajustes ofrece un panel administrativo integrado compuesto de varias pestañas. Está construida usando **Tailwind CSS** y **Lucide Icons** para dar una apariencia profesional y moderna:

1. **Layout General:**
   - **Contenedor Principal (`flex h-screen overflow-hidden bg-slate-50`):** Mantiene una vista de pantalla completa sin scrolls externos repetidos.
   - **Sidebar (Izquierda):** Renderiza el menú de navegación con la opción "Ajustes" seleccionada (`selectedNode="ajustes"`).
   - **Área de Contenido (Derecha):** Contiene el `<DashboardHeader />` arriba y el contenedor principal con scroll vertical para el formulario y datos.

2. **Cabecera de la Sección:**
   - Título destacado: `"Ajustes"`.
   - Descripción: `"Administra tu equipo, permisos y copias de seguridad."`.

3. **Selector de Pestañas (Tabs):**
   - Una barra compacta horizontal que permite alternar entre:
     - **Copias de seguridad** (`backup`) — Icono `HardDrive`
     - **Equipo y permisos** (`team`) — Icono `Users`
     - **Registro de actividad** (`activity`) — Icono `Clock`

4. **Tarjetas de Estadísticas (Stats Cards):**
   Se muestran 4 métricas clave al principio de la pestaña de copias de seguridad:
   - **Total de Agentes** (Icono `Users`, fondo azul).
   - **Conversaciones** (Icono `MessageSquare`, fondo esmeralda).
   - **Mensajes Totales** (Icono `FileText`, fondo ámbar).
   - **Contactos** (Icono `Users`, fondo púrpura).

5. **Panel Principal de Respaldos (Dos Columnas en Desktop):**
   - **Columna de Generación de Copias (Izquierda, ancho 2/3):** Contiene las tres opciones de respaldos:
     - **Respaldo de Chats:** Permite seleccionar mediante un dropdown a un agente en específico, informando el número de conversaciones asociadas y un botón azul para "Descargar ZIP".
     - **Respaldo de Contactos:** Permite descargar los contactos de la plataforma en formato "CSV".
     - **Respaldo Completo:** Una tarjeta destacada con gradiente azul y bordes marcados para generar y descargar un paquete ZIP completo.
   - **Columna del Historial de Respaldos (Derecha, ancho 1/3):**
     - Muestra la lista cronológica de respaldos anteriores generados exitosamente, mostrando su icono correspondiente (chat, contactos o disco), nombre del archivo e indicador de éxito (check verde).
     - Incluye una nota informativa al final sugiriendo realizar un respaldo completo al menos una vez por semana.

---

## 2. Gestión de Estados en React (SettingsPage.tsx)

El componente principal gestiona un conjunto de estados reactivos para manejar la asincronía del backend, interacción con el DOM y renderizado condicional:

| Nombre del Estado | Tipo de Datos | Descripción |
| :--- | :--- | :--- |
| `activeTab` | `"backup" \| "team" \| "activity"` | Controla cuál pestaña está activa y visible en pantalla. |
| `isAuthorized` | `boolean` | Bandera de seguridad en frontend. Bloquea el renderizado de la página si el rol es "agente". |
| `chatsStatus` | `BackupStatus` | Estado del proceso de respaldo de chats (`idle`, `running`, `done`, `error`). |
| `contactsStatus` | `BackupStatus` | Estado del proceso de respaldo de contactos. |
| `fullStatus` | `BackupStatus` | Estado del proceso de respaldo completo. |
| `agents` | `Agent[]` | Lista de agentes cargados en el sistema. |
| `selectedAgentId` | `string` | ID del agente seleccionado para la descarga de chats. |
| `selectedAgentConversations` | `Conversation[]` | Lista de conversaciones pertenecientes al agente seleccionado. |
| `history` | `BackupRecord[]` | Registros históricos de respaldos consultados del backend. |
| `activityLog` | `AuditLogDto[]` | Listado de acciones registradas por el sistema de auditoría. |
| `historyError` / `activityError` | `string \| null` | Mensajes de error en caso de fallos en llamadas del backend. |
| `isHistoryLoading` / `isActivityLoading` | `boolean` | Indicadores de carga (loaders) para el historial y la auditoría. |
| `isAgentsLoading` | `boolean` | Indicador de carga para el dropdown de agentes. |

---

## 3. Lógica de Negocio y Funcionalidades de Copia de Seguridad

### A. Respaldo de Chats de un Agente (ZIP)
- El usuario selecciona un agente del dropdown.
- Se ejecuta la función asíncrona `backupChatsZip()`:
  1. Cambia `chatsStatus` a `"running"`.
  2. Invoca a `createBackup("chats", selectedAgentId)` en el backend, el cual genera un archivo ZIP.
  3. Ejecuta `downloadBackup(id)` para obtener el archivo binario (`Blob`).
  4. Dispara la descarga del navegador de forma programática.
  5. Agrega el nuevo registro arriba del historial localmente y pasa el estado a `"done"` (mostrando un check verde temporal de éxito).

### B. Respaldo de Contactos (CSV)
- Invoca a `backupContactsCSV()`:
  1. Llama a `createBackup("contacts")` que consolida la base de datos de contactos a CSV.
  2. Descarga el `Blob` resultante y simula un enlace de descarga en el navegador con el nombre de archivo correspondiente.
  3. Actualiza el historial e informa del éxito de la operación.

### C. Respaldo Completo (ZIP)
- El botón de "Descargar respaldo completo" invoca `backupFullZip()`:
  1. Consolida toda la base de datos de chats, contactos, logs y configuraciones en un archivo ZIP masivo en el servidor.
  2. Se descarga a través de un stream de `Blob` al ordenador del usuario.

---

## 4. Integración con el Backend (API)

Las operaciones de respaldos se integran con los siguientes endpoints en la capa de servicios y controladores del backend (`backupRoute.ts`):

- **`GET /api/backups` (fetchBackups):** Retorna la lista de todas las copias de seguridad creadas anteriormente en la base de datos con su estado de procesamiento.
- **`POST /api/backups` (createBackup):** Inicia la creación física de la copia de seguridad basándose en el parámetro `backupType` (`chats`, `contacts`, o `full`).
- **`GET /api/backups/download/:backupId` (downloadBackup):** Descarga el archivo generado por el servidor transmitiendo el archivo binario correspondiente. Requiere la cabecera `Authorization: Bearer <Token>`.

---

## 5. Diseño de Base de Datos y Persistencia

En la base de datos PostgreSQL, la tabla `backups` mantiene el registro persistente de todos los archivos de respaldo generados en el sistema (definida en `init.sql`):

```sql
CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY,
  backup_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  file_path TEXT,
  file_url TEXT
);
```

### Campos:
- **`id`:** Identificador único generado con un prefijo descriptivo.
- **`backup_type`:** Indica el tipo de respaldo (`chats`, `contacts`, `full`).
- **`file_name`:** Nombre asignado al archivo descargable (ej. `backup-chats-17123456789.zip`).
- **`status`:** Estado del proceso en el backend (`pending`, `completed`, `failed`).
- **`file_path` / `file_url`:** Ruta local o URL de almacenamiento de la copia en el disco del servidor (`storage/backups`).

---

## 6. Control de Accesos y Seguridad (RBAC)

La pantalla y sus acciones críticas están sujetas a un estricto control de accesos basado en roles (RBAC):

1. **Restricción por Rol de Agente:**
   - Si un usuario con el rol **"agente"** intenta entrar a la URL de Ajustes, el `useEffect` detecta su rol mediante `getCurrentUser()` y lo redirige automáticamente a la pantalla del `/dashboard`.
   - Los agentes tienen prohibido por diseño acceder a la configuración del sistema.

2. **Diferencias entre Administrador y Supervisor:**
   - **Administrador:** Posee permisos ilimitados de lectura y escritura. Puede crear y descargar copias de seguridad de cualquier tipo sin restricciones.
   - **Supervisor:** El supervisor tiene un acceso de **Solo Lectura** (`isSupervisor === true`) en la pestaña de copias de seguridad.
     - **Inhabilitación visual:** Los botones de descarga e inicio de copias de seguridad se deshabilitan o no ejecutan funciones si es supervisor.
     - **Validación del Backend:** El backend valida el token de sesión. Si un supervisor intenta llamar a la API de creación (`POST /api/backups`), el middleware o el controlador de autorización rechazará la solicitud devolviendo un código `403 Forbidden` o `401 Unauthorized`.
     - **Mensajes de Advertencia:** Si un supervisor intenta generar una acción, se muestra el mensaje de error: `"No tienes permisos para generar respaldos."` o el aviso `"Solo los administradores pueden generar respaldos."`.
