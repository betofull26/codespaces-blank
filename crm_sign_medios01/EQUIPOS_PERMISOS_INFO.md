# Documentación de la Pantalla de Ajustes / Equipos y Permisos y sus Funcionalidades

Este documento describe detalladamente el funcionamiento de la pantalla **Equipos y permisos** (especialmente a través del módulo **Gestión de Fichas** en `SettingsPage` -> Pestaña `team`) en la aplicación **CRM SIGN Medios**, abarcando su diseño visual, estados en React, validaciones de formularios, integraciones con la API del backend, almacenamiento y el modelo de control de accesos basados en roles (RBAC).

---

## 1. Estructura Visual y Diseño

La interfaz se integra bajo la pestaña "Equipo y permisos" (`activeTab === "team"`) en la página general de Ajustes. Presenta un diseño de **dos columnas** en desktop para optimizar el espacio:

### A. Columna de Gestión de Fichas (Izquierda - Ancho 2/3):
Es el área principal gobernada por el componente `<UserRecordManagement />`:
1. **Cabecera de Fichas:**
   - Título: `"Gestión de Fichas"` (y descripción: `"Administración completa de usuarios y equipos asignados"`).
   - Botón **"Añadir Ficha"** (azul con icono `Plus`): Despliega un diálogo modal para crear un registro desde cero. Solo se habilita si el usuario tiene rol de Administrador.
2. **Barra de Búsqueda:**
   - Un campo de búsqueda integrado con el icono de lupa (`Search`) que filtra dinámicamente las fichas en pantalla según el nombre del usuario, cargo, número de serie, o nombre de usuario de login.
3. **Rejilla de Fichas (Grid):**
   - Muestra las fichas existentes distribuidas en tarjetas responsivas (`grid md:grid-cols-2 lg:grid-cols-3`). Cada tarjeta contiene:
     - **Foto de Perfil:** Imagen circular o el icono de una cámara fotográfica (`Camera`) si no hay foto subida.
     - **Información Personal:** Nombre del empleado, rol de sistema en una etiqueta destacada (ej. `Administrador`, `Supervisor`, `Agente`) y su cargo dentro de la empresa.
     - **Fecha de Ingreso:** Formateada según el estándar de fecha local (`dd/mm/aaaa`).
     - **Detalles del Equipo:** Teléfono asignado, modelo de celular y los dos números de serie/identificación física (`Serial 1` y `Serial 2`).
     - **Botones de Acción:** Acciones para **Editar** (icono de lápiz `Pencil`) y **Eliminar** (icono de papelera roja `Trash2`).

### B. Columna de Roles Disponibles (Derecha - Ancho 1/3):
Muestra un panel informativo y descriptivo sobre los roles disponibles en la plataforma para educar al usuario:
- **Administrador:** Acceso total al sistema (usuarios, ajustes, respaldos y permisos).
- **Supervisor:** Puede visualizar todos los agentes, chats y gestionar fichas (pero con limitaciones de escritura).
- **Agente / Suspendido:** No poseen accesos al panel administrativo.
- **Nota de Advertencia:** Un contenedor de color azul sutil con el icono de controles (`SlidersHorizontal`) que aclara que *"Solo el Administrador puede modificar roles, suspender accesos y enviar invitaciones."*

---

## 2. Gestión de Estados en React (`UserRecordManagement.tsx` y `UserRecordForm.tsx`)

La lógica de la pantalla se compone de múltiples variables de estado para gobernar las peticiones asíncronas, modales y validaciones:

### En `UserRecordManagement.tsx`:
- `records` (`UserRecord[]`): Arreglo con la lista de fichas locales que combina los metadatos de hardware con la información de los usuarios del backend.
- `isFormOpen` (`boolean`): Abre o cierra el modal de diálogo de Radix UI (`@radix-ui/react-dialog`) que alberga el formulario.
- `editingRecord` (`UserRecord | null`): Apunta al registro que se está editando en ese momento. Si es `null`, el formulario actúa en modo de creación.
- `searchTerm` (`string`): Filtro de texto escrito por el usuario.
- `isSaving` (`boolean`): Bandera para deshabilitar botones y evitar dobles envíos durante llamadas de API de creación o actualización.
- `statusMessage` (`string | null`): Almacena avisos temporales de éxito o error.

### En `UserRecordForm.tsx`:
- `formData`: Almacena de forma reactiva cada uno de los campos modificables de la ficha de usuario:
  - `firstName` y `lastName` (cargados dividiendo el campo `name` completo).
  - `position`, `assignedPhone`, `deviceModel`, `serialNumber`, `serialNumber2`, `photo`, `entryDate`.
  - `username` y `password` (credenciales para iniciar sesión).
  - `role` (`Administrador`, `Supervisor`, `Agente` o `Suspendido`).
- `photoPreview` (`string | undefined`): URL de datos base64 para previsualizar la foto de perfil subida.
- `showPassword` (`boolean`): Alterna entre ocultar o revelar la contraseña mediante el icono de ojo (`Eye` / `EyeOff`).

---

## 3. Lógica de Sincronización y Persistencia de Datos

El CRM utiliza una arquitectura híbrida de almacenamiento para las fichas de usuario:
1. **Base de Datos (Backend):** Guarda la información de cuenta (ID, nombre completo, nombre de usuario, rol, estado y permisos de panel).
2. **LocalStorage (Navegador):** Almacena los metadatos específicos del equipo físico y de la ficha bajo la clave `crm-sign-user-records` (ya que PostgreSQL no requiere duplicar el hardware en su tabla de `users` base).

### Fusión de Datos (`mergeRecordsWithBackendUsers`):
Al cargar la página, se llama a `fetchUsers()` en el backend:
- Se realiza un emparejamiento inteligente usando el `id` o el `username` para combinar los detalles físicos del LocalStorage con los datos actualizados de roles y nombres reales de la base de datos PostgreSQL.
- Los registros huérfanos se limpian o reconcilian para garantizar la consistencia en el navegador del administrador.

---

## 4. Validaciones de Formulario Estrictas

El formulario realiza validaciones exhaustivas antes de permitir el envío del payload:
1. **Obligatoriedad de Campos:** Nombre, apellidos, cargo y fecha de ingreso son estrictamente requeridos.
2. **Credenciales de Acceso:** Si el rol seleccionado requiere acceso al panel (es decir, **Administrador** o **Supervisor**), se vuelve obligatorio ingresar un `username` y una `password`.
3. **Validación de Contraseña:** Debe tener una longitud de **entre 8 y 16 caracteres**.
4. **Validación de Fecha de Ingreso:** La fecha ingresada no puede ser superior a la fecha actual del sistema.

---

## 5. Integración con el Backend (API)

Las acciones de la pantalla gatillan peticiones HTTP a la API del backend:

- **Crear Ficha:** `POST /api/users`
  - Se genera un payload con `{ fullName, username, passwordHash, role, status, accessToPanel: role !== "agent" }`.
  - El backend inserta al usuario, escribe un log de auditoría (`create_user`) y encripta la contraseña de forma segura.
- **Editar Ficha:** `PUT /api/users/:userId`
  - Actualiza la información básica del usuario de forma persistente.
  - El backend registra la acción `update_user` en la tabla de auditorías.
- **Eliminar Ficha:** `DELETE /api/users/:userId`
  - Remueve al usuario del sistema y revoca de inmediato cualquier sesión activa o permiso de panel.
  - Se registra el log de auditoría `delete_user`.

---

## 6. Control de Accesos y Seguridad (RBAC)

La pantalla de gestión de fichas es un módulo altamente protegido que aplica validaciones tanto en el cliente como en el servidor:

1. **Restricción de Entrada:**
   - Solo los usuarios logueados con el rol de **Administrador** o **Supervisor** pueden ingresar a la vista de Ajustes.
   - Los **Agentes** son expulsados de forma inmediata.

2. **Diferencias de Acción (Admin vs. Supervisor):**
   - **Administrador (`canManageUsers === true`):**
     - Tiene control total. Puede ver, crear, editar y eliminar fichas.
     - El botón "Añadir Ficha" y los botones de la tarjeta de usuario ("Editar" y "Eliminar") están completamente habilitados.
   - **Supervisor (`isSupervisor === true`):**
     - Tiene acceso de **Solo Lectura** a las fichas.
     - El botón de "Añadir Ficha" está deshabilitado.
     - Los botones de "Editar" y "Eliminar" en las tarjetas individuales se deshabilitan automáticamente en base a su rol.
     - Un supervisor que intente llamar a los endpoints de escritura obtendrá un error `403 Forbidden` en su consola o una notificación de bloqueo directo en la UI.
