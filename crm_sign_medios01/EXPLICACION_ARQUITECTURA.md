# Arquitectura y Lógica de CRM SIGN Medios

Este documento explica de forma detallada cómo funciona el nuevo diseño de la base de datos, la estructura del backend y la del frontend en la aplicación.

## 1. Diseño de la Nueva Base de Datos (PostgreSQL)

El nuevo modelo implementa una **Arquitectura Limpia (Clean Architecture)** orientada a la segregación de responsabilidades. Se acabaron los diseños acoplados; ahora cada tabla tiene un propósito único e indiscutible, lo que otorga mayor seguridad, escalabilidad y facilidad de mantenimiento.

### Tablas Principales y su Lógica:

- **`users` (Datos Personales):** Almacena únicamente información personal y de perfil (nombre, posición, foto, estado online, etc.). No guarda contraseñas ni accesos.
- **`auth_users` (Autenticación y Permisos):** Gestiona las credenciales (usuario, hash de contraseña) y los roles (`admin`, `supervisor`, `agent`). Tiene una relación `1:1` con `users`. Esto permite que un usuario exista sin tener acceso al panel (por ejemplo, agentes legacy) o revocar permisos aislando la capa de seguridad.
- **`user_sessions` (Sesiones):** Controla los tokens de autenticación activos. Permite rastrear inicios de sesión, expiración de tokens y forzar cierres de sesión (revocación).
- **`devices` (Dispositivos Físicos):** Registra el hardware (teléfonos, IMEI) asignado a los usuarios y sus números de teléfono.
- **`contacts` (Clientes):** Directorio de clientes o prospectos, vinculados al usuario (agente) que los gestiona.
- **`conversations` y `messages`:** Las interacciones comunicativas. Una `conversation` vincula a un agente (`users`) con un cliente (`contacts`). Los `messages` pertenecen a una conversación y soportan tanto texto como multimedia.
- **`media_files`:** Almacena los metadatos de los archivos adjuntos en los mensajes.
- **`audit_logs` (Auditoría):** Tabla inmutable que registra cada acción crítica (creación de usuarios, cambios de roles, inicios de sesión, eliminación de registros). Asegura la trazabilidad y el cumplimiento normativo.

**Flujo de Integridad:** Se utilizan llaves foráneas (`Foreign Keys`) con borrado en cascada (`ON DELETE CASCADE`) donde aplica, para mantener la coherencia (ej. borrar un usuario elimina sus sesiones y dispositivos asignados).

---

## 2. Lógica del Backend

El backend está desarrollado en **Node.js, Express y TypeScript**. Adopta el patrón de **Clean Architecture** estructurado en cuatro capas claramente separadas (`backend/src`):

1. **Capa de Interfaz (`interface/`):**
   - Aquí residen los controladores (Routers de Express) y la configuración del servidor (`app.ts`).
   - Es el punto de entrada de las peticiones HTTP y maneja las respuestas al cliente.
2. **Capa de Aplicación (`application/`):**
   - Contiene la **lógica de negocio** (`userManagement.ts`, `contactService.ts`, `conversationService.ts`, etc.).
   - Dicta las reglas sobre cómo se crean los usuarios, cómo se validan las contraseñas (`bcrypt`), y registra los eventos en la auditoría (`audit.ts`).
3. **Capa de Dominio (`domain/`):**
   - El corazón de la aplicación. Define los Modelos e Interfaces (`models.ts`) y los contratos para los repositorios (`repositories.ts`).
   - No depende de ninguna base de datos ni de Express.
4. **Capa de Infraestructura (`infrastructure/`):**
   - Implementa los repositorios (ej. `PostgresUserRepository`) ejecutando consultas SQL directas con la librería `pg`.
   - Contiene la inicialización y migración de la base de datos (`init.ts`), así como la implementación de WebSockets (`socket.io` en `realtime/`) para la emisión de mensajes en tiempo real.

**Flujo de ejemplo (Login):**
`Request HTTP` -> `Interface (Router)` -> `Application (userManagement.ts valida credenciales y crea token)` -> `Infrastructure (PostgresUserRepository consulta auth_users y guarda user_sessions)` -> `Response al Frontend`.

---

## 3. Lógica del Frontend

El frontend es una Single Page Application (SPA) moderna, rápida y reactiva, construida con las siguientes tecnologías:
- **Core:** React 18, TypeScript, Vite.
- **Rutas:** React Router v7.
- **Estilos y UI:** Tailwind CSS, Material UI (MUI) y Radix UI (para accesibilidad y componentes sin estilo).

### Estructura y Flujo:
- Reside principalmente en la carpeta `src/app`.
- **Rutas (`routes.tsx`):**
  - Utiliza `createBrowserRouter` para gestionar la navegación.
  - Integra **Loaders de validación** (`requireAuth`, `requireAdminOrSupervisor`) que protegen las rutas antes de que se rendericen. Verifican el rol del usuario mediante funciones de sesión (`getCurrentUser`, `isSessionExpired`).
  - Define páginas como `/dashboard` (DashboardPage), `/gestion-fichas` (UserManagementPage), y `/directorio`.
- **Páginas y Componentes (`pages/` y `components/`):**
  - La interfaz está dividida en componentes reutilizables. Utilizan Tailwind para diseño utilitario y componentes pre-diseñados (MUI/Radix) para componentes complejos como menús, modales o avatares.
- **Conexión en Tiempo Real:**
  - Incluye `socket.io-client` para escuchar y enviar eventos en tiempo real, lo que es vital para la sincronización de mensajes (`conversations` y `messages`) entre el agente y los clientes de WhatsApp.

**En resumen:**
El frontend actúa como una capa de presentación interactiva, completamente separada del backend, que se comunica a través de la API REST (para operaciones CRUD) y WebSockets (para actualizaciones en tiempo real y mensajería), garantizando una experiencia fluida, segura y escalable.
