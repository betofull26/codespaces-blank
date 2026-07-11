# Explicación de la Pantalla: Ajustes / Equipos y Permisos (Gestión de Fichas)

Este documento detalla el funcionamiento técnico, arquitectónico y operativo del módulo **Ajustes / Equipos y Permisos** dentro de **CRM SIGN Medios**. Explica la integración desde la interfaz de usuario en el frontend, pasando por los servicios de aplicación, middlewares de autorización y controladores del backend, hasta la capa de base de datos.

---

## 1. Propósito del Módulo

El objetivo primordial de esta pantalla es la **Gestión de Fichas de Usuario**, la cual asocia a los colaboradores de la empresa con sus respectivos dispositivos de comunicación asignados (teléfonos, modelos, números de serie) y define su rol de seguridad dentro de la plataforma (control de acceso basado en roles o **RBAC**).

Permite a los usuarios autorizados (principalmente el Administrador):
1. Registrar personal de ventas o agentes.
2. Asignar equipos físicos (teléfono, modelo, números de serie/IMEI).
3. Configurar credenciales y niveles de permisos para acceder al panel administrativo.
4. Auditar las actividades realizadas sobre estas fichas y las transiciones de roles/estados.

---

## 2. Modelo de Seguridad y Roles (RBAC)

El sistema define tres roles principales tanto en el Frontend como en el Backend:

| Rol (Frontend) | Rol (Backend) | Acceso al Panel Administrativo | Permisos Clave en la Pantalla |
| :--- | :--- | :---: | :--- |
| **Administrador** | `admin` | **Sí** | Acceso total: Crear, editar, suspender y eliminar fichas. Cambiar roles críticamente. |
| **Supervisor** | `supervisor` | **Sí** | Acceso de lectura y gestión limitada: Ver las fichas, pero **no** puede crear, editar o eliminarlas. No puede generar respaldos ni alterar configuraciones críticas. |
| **Agente** | `agent` | **No** | Bloqueado completamente de las secciones y APIs administrativas. |

### Reglas de Negocio Clave
- **Acceso al Panel (`accessToPanel`)**: Los usuarios creados con rol `Agente` no tienen acceso al panel web; se asumen como operadores de chats (focalizados en la atención por dispositivos vinculados, por ejemplo WhatsApp). Solo los usuarios con rol `admin` o `supervisor` pueden iniciar sesión en el panel administrativo.
- **Credenciales Condicionales**: Si una ficha se registra como `Agente`, el formulario de creación no requiere ni solicita un usuario (`username`) ni contraseña (`password`), ya que este no ingresará al panel. Si se cambia su rol a `Supervisor` o `Administrador`, se vuelve obligatorio registrar credenciales de acceso seguras.
- **Trazabilidad estricta**: Cada acción realizada sobre los usuarios (crear, modificar, cambiar rol, suspender, eliminar) genera una entrada de auditoría en la tabla `audit_log`, detallando quién realizó el cambio y los datos anteriores/nuevos.

---

## 3. Arquitectura del Frontend (UI)

La pantalla se ubica en el directorio `src/app/pages/SettingsPage.tsx` y se apoya en componentes especializados en `src/app/components/dashboard/`.

### 3.1 `SettingsPage.tsx`
Es la página principal del módulo de Ajustes.
- Maneja un menú de pestañas (**Tabs**):
  - **Copias de seguridad** (`backup`)
  - **Equipo y permisos** (`team`)
  - **Registro de actividad** (`activity`)
- Cuando se selecciona la pestaña **Equipo y permisos**, renderiza el componente central `<UserRecordManagement />`.
- A la derecha, muestra un componente informativo con los **Roles disponibles**, detallando los privilegios de cada rol.

### 3.2 `UserRecordManagement.tsx`
Es el coordinador de estado para la administración de las fichas de usuarios.
- **Carga de Datos**: Realiza un `useEffect` al montar el componente para consultar los usuarios mediante la función `fetchUsers` del API de integración (`dashboardApi.ts`).
- **Persistencia Local de Respaldo**: Sincroniza y fusiona los registros de usuario con el almacenamiento del navegador (`localStorage` con la clave `crm-sign-user-records`), garantizando que se conserven atributos específicos del frontend (como fotos en Base64 o contraseñas visuales) al emparejarse con el backend a través del identificador del usuario o su nombre de usuario.
- **Operaciones CRUD**:
  - `handleAddRecord`: Llama a `createUser` del API enviando el payload del usuario.
  - `handleEditRecord`: Llama a `updateUser` para modificar los datos del usuario.
  - `handleDeleteRecord`: Llama a `deleteUserById` tras una confirmación de seguridad.
- **Búsqueda e Interfaz**: Proporciona un buscador en tiempo real que filtra las fichas por nombre, cargo, usuario o números de serie. Renderiza la lista en una cuadrícula (grid) responsive.
- **Manejo de Diálogos**: Integra un cuadro de diálogo modal usando `@radix-ui/react-dialog` que contiene el formulario `<UserRecordForm />`.

### 3.3 `UserRecordForm.tsx`
Es el formulario de entrada de datos para añadir o editar una ficha de usuario.
- **Campos del Formulario**:
  - Foto de Perfil (con previsualización y conversión a Base64).
  - Nombre y Apellidos (se manejan por separado en el formulario y se unifican al guardar).
  - Cargo (Puesto).
  - Fecha de Ingreso (con validación de que no sea superior a la fecha actual).
  - Teléfono Asignado.
  - Modelo de Dispositivo.
  - Número de Serie 1 y Número de Serie 2 (normalizados a mayúsculas para mantener consistencia de inventario).
  - Rol (Administrador, Supervisor, Agente, Suspendido).
  - **Usuario y Contraseña** (Se muestran condicionalmente si el rol seleccionado es distinto de `Agente`).
- **Validaciones Integradas**:
  - Los campos principales son obligatorios.
  - Contraseña obligatoria para personal del panel, la cual debe tener **entre 8 y 16 caracteres**.
  - La fecha de ingreso no puede estar en el futuro.

---

## 4. Arquitectura del Backend y Capa de Dominio

El backend sigue los principios de la **Clean Architecture** (Arquitectura Limpia), separando la lógica pura de negocio de la infraestructura y el transporte HTTP.

```
backend/src/
├── domain/               # Entidades y contratos de repositorios (Puro, sin dependencias externas)
├── application/          # Lógica de negocio (Casos de uso: userManagement, authorization)
├── infrastructure/       # Implementaciones concretas (Bases de datos, HTTP/Express, WhatsApp)
└── interface/            # Rutas y controladores de Express, DTOs de entrada/salida
```

### 4.1 Capa de Autorización (`authorization.ts`)
Ubicada en `application/authorization.ts`. Define las funciones centrales de validación de acceso:
- `canAccessAdminModule(role)`: Determina que solo `admin` y `supervisor` pueden ver el panel.
- `canManageUsers(role)`: Determina que únicamente el rol `admin` puede realizar escrituras.
- `ensureAuthorized(role, action)`: Lanza una excepción `Error('Unauthorized')` si el rol de la sesión actual no tiene permitido realizar la acción indicada (ej: `manage-users`, `view-users`, etc.).

### 4.2 Servicio de Gestión de Usuarios (`userManagement.ts`)
Ubicado en `application/userManagement.ts`. Implementa los casos de uso principales:
- **Encriptación de Contraseñas**: Usa `bcrypt` para aplicar un hash seguro (`hashPasswordIfNeeded`) a las contraseñas antes de almacenarlas en la base de datos, evitando guardar texto plano.
- **Creación de Fichas (`createUser`)**:
  - Genera un ID único para el usuario.
  - Genera el hash de la contraseña si se especificó.
  - Llama al repositorio para insertar el registro.
  - Crea un registro de auditoría (`create_user`) y lo guarda en el log de auditoría.
- **Actualización de Fichas (`updateUser`)**:
  - Busca el usuario en la base de datos.
  - Actualiza la contraseña en hash si ha cambiado.
  - Actualiza sus campos y guarda un log de auditoría (`update_user`) registrando el cambio de nombre de usuario de ser el caso.
- **Cambio de Rol y Estado (`changeUserRole` y `changeUserStatus`)**:
  - Actualizan por separado los campos correspondientes.
  - Crean entradas específicas de auditoría para guardar la trazabilidad del cambio de rol (ej: `previousRole` y `newRole`).
- **Eliminación (`deleteUser`)**:
  - Elimina el usuario del repositorio físico.
  - Crea un registro de auditoría (`delete_user`) indicando que el acceso al panel ha sido revocado.

---

## 5. Rutas de Transporte e Integración API

Ubicadas en `backend/src/infrastructure/http/routes/userManagementRoute.ts`. Expone los endpoints de Express protegidos bajo el middleware de autenticación por Token de Sesión (`authenticateRequest`):

- `GET /api/users`: Lista todos los usuarios (Requiere rol de `admin` o `supervisor`).
- `GET /api/users/:id`: Obtiene el detalle de un usuario específico.
- `POST /api/users`: Crea un usuario (Solo permitido para `admin`).
- `PUT /api/users/:id`: Modifica un usuario (Solo permitido para `admin`).
- `DELETE /api/users/:id`: Elimina permanentemente a un usuario (Solo permitido para `admin`).
- `PATCH /api/users/:id/role`: Cambia el rol de un usuario (Solo para `admin`).
- `PATCH /api/users/:id/status`: Activa, inactiva o suspende una ficha (Solo para `admin`).

---

## 6. Persistencia y Base de Datos

La persistencia es manejada por el repositorio PostgreSQL (`PostgresUserRepository` en `backend/src/infrastructure/database/repositories.ts`). Las tablas clave involucradas son:

### 6.1 Tabla `users` (Fichas y Credenciales)
Almacena la información de los usuarios y dispositivos asignados. Contiene campos de negocio tales como:
- `id` (UUID o cadena identificadora única)
- `fullName` (Nombre completo del colaborador)
- `username` (Único para login del panel)
- `passwordHash` (Hash Bcrypt de la contraseña)
- `role` (`admin`, `supervisor`, `agent`)
- `status` (`active`, `inactive`, `suspended`)
- `accessToPanel` (Booleano que permite o deniega el acceso a la interfaz web)
- `createdAt` y `updatedAt`

### 6.2 Tabla `audit_log` (Trazabilidad)
Guarda un rastro inmutable de las operaciones críticas realizadas en la pantalla.
- `id`: Identificador único de auditoría.
- `entityType`: Tipo de entidad afectada (`user`, `credential`, etc.).
- `entityId`: ID del usuario afectado.
- `action`: Acción realizada (`create_user`, `update_user`, `delete_user`, `change_role`, `change_status`, `login`).
- `performedBy`: ID del usuario administrador que realizó el cambio.
- `details`: JSON serializado con los detalles antes y después de la operación (ej: `{"previousStatus":"active","newStatus":"suspended"}`).
- `createdAt`: Fecha y hora exacta de la acción.

---

## 7. Flujos de Interacción Paso a Paso

### 7.1 Flujo de Creación de Ficha
```
[Administrador en Frontend]
       │
       ▼ Llenar campos en Formulario (Si es Supervisor/Admin pide usuario/pass de 8-16 carac.)
[Botón "Crear Ficha"]
       │
       ▼ Llama a POST /api/users (con token del Administrador)
[Ruta del Backend]
       │
       ▼ Middleware `requireAuth` valida sesión y `ensureAuthorized` valida rol 'admin'
[Servicio userManagement.ts]
       │
       ▼ Genera ID, encripta pass con Bcrypt, crea la Ficha, guarda Auditoría ('create_user')
[Base de Datos PostgreSQL]
       │
       ▼ Retorna éxito. El Frontend actualiza el Grid y el localStorage.
```

### 7.2 Flujo de Modificación de Rol
```
[Administrador en Frontend]
       │
       ▼ Modifica el Rol de un usuario de "Agente" a "Administrador"
[Botón "Guardar Cambios"]
       │
       ▼ Llama a PUT /api/users/:id con payload del rol nuevo y credenciales
[Ruta del Backend]
       │
       ▼ Middleware valida rol 'admin'
[Servicio userManagement.ts]
       │
       ▼ Actualiza la ficha, encripta nueva contraseña y registra Auditoría ('update_user' y 'change_role')
[Base de Datos PostgreSQL]
       │
       ▼ Se confirman los cambios en la DB. El usuario ahora puede iniciar sesión en el panel.
```

### 7.3 Flujo de Restricción del Panel
```
[Usuario con rol 'Agente' intenta iniciar sesión]
       │
       ▼ Llama a POST /api/auth/login
[Backend: loginUser]
       │
       ▼ Valida credenciales. Encuentra que user.accessToPanel es FALSE
       ▼ Detiene el proceso con error "Unauthorized"
[Frontend]
       │
       ▼ Muestra mensaje genérico de error de autenticación y bloquea el acceso.
```

---

Este diseño robusto desacopla completamente las responsabilidades, asegura que las contraseñas nunca estén desprotegidas, restringe de forma estricta las operaciones de escritura según el rol activo y permite reconstruir cualquier incidente de seguridad gracias al log detallado de auditoría.
