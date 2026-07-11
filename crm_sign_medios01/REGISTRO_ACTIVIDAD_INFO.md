# Documentación de la Pantalla de Ajustes / Registro de Actividad y sus Funcionalidades

Este documento describe de manera exhaustiva el funcionamiento de la pantalla **Registro de actividad** (disponible a través de la pestaña `activity` en la pantalla de Ajustes) en la aplicación **CRM SIGN Medios**. Se cubre su interfaz de usuario, lógica de procesamiento y traducción de logs en React, APIs del backend, estructura en la base de datos PostgreSQL, y control de accesos por roles (RBAC).

---

## 1. Estructura Visual y Diseño

La pestaña de **Registro de actividad** ofrece una bitácora o panel de auditoría unificado para que los administradores y supervisores puedan monitorizar las acciones críticas de seguridad realizadas por los miembros del equipo:

1. **Estructura del Contenedor Principal (`rounded-xl border border-slate-200 bg-white p-6 shadow-sm`):**
   - El módulo se aloja en una tarjeta blanca elegante con sombra sutil y bordes redondeados.
2. **Cabecera del Módulo:**
   - Un icono de reloj de actividad (`Clock` de color gris pizarra).
   - Título de sección: `"Registro de actividad"`.
   - Descripción: `"Consulta los movimientos recientes de usuarios, roles y accesos."`.
3. **Lista Cronológica de Actividades:**
   - Se muestra un feed vertical de eventos apilados. Cada evento se renderiza en una tarjeta individual (`rounded-lg border border-slate-200 bg-slate-50 p-4`) con fondo sutil gris azulado:
     - **Usuario Ejecutor (`performedBy`):** Se destaca en negrita en la esquina superior izquierda el nombre del usuario o identificador que realizó la acción.
     - **Marca de Tiempo (`createdAt`):** Se visualiza a la derecha la fecha y hora exacta del evento, formateada al huso de Venezuela (`dd/mm/aaaa hh:mm`).
     - **Mensaje de Actividad Traducido:** Un párrafo descriptivo en español legible para humanos, que explica detalladamente la acción y los datos que cambiaron.

---

## 2. Gestión de Estados en React (SettingsPage.tsx)

La pestaña se alimenta de los siguientes estados reactivos de React:

- `activityLog` (`AuditLogDto[]`): Lista ordenada de registros de auditoría recuperados desde el backend.
- `isActivityLoading` (`boolean`): Bandera para renderizar un indicador de carga animado (*"Cargando actividad..."*) mientras se realiza la consulta asíncrona.
- `activityError` (`string | null`): Almacena y despliega el mensaje de error en pantalla en caso de que ocurra una falla de comunicación con la API.

### Carga de Datos:
Al activarse la pestaña o cargarse la página con autorización, se ejecuta un `useEffect` que llama de manera asíncrona a `fetchAuditLogs()`. Si tiene éxito, actualiza `activityLog` con los resultados; en caso de error, setea `activityError`.

---

## 3. Lógica de Parseo y Formateo Semántico (`formatActivityMessage`)

Los registros de auditoría almacenan la información detallada del cambio en formato JSON dentro de la columna `details` en la base de datos. Para convertir este JSON a una oración legible en español para el usuario en pantalla, el frontend utiliza la función helper `formatActivityMessage(item)`:

1. **Mapeo de Etiquetas de Acción Básicas:**
   Define traducciones amigables para las acciones de auditoría comunes:
   ```typescript
   const actionLabels: Record<string, string> = {
     create_user: "creó un usuario",
     update_user: "actualizó un usuario",
     delete_user: "eliminó un usuario",
     change_role: "cambió el rol",
     change_status: "cambió el estado",
     login: "inició sesión",
   };
   ```
2. **Decodificación del JSON de Detalles:**
   La función intenta deserializar `item.details` usando `JSON.parse(item.details)`. Si la estructura de datos coincide con una acción conocida, formatea el texto semánticamente:
   - **`create_user` (Creación de usuario):** Extrae el nombre de usuario, rol y el estado del acceso al panel administrativo para componer el texto:
     * *Ejemplo:* `"El usuario carmendoza con rol agent y acceso al panel deshabilitado."`
   - **`update_user` (Actualización de usuario):** Compara el nombre anterior con el nuevo nombre:
     * *Ejemplo:* `"Actualizó la información de carmendoza y la dejó como carlosmendoza."`
   - **`delete_user` (Eliminación de usuario):** Extrae el nombre del usuario borrado:
     * *Ejemplo:* `"Eliminó a Carlos Mendoza del sistema."`
   - **`change_role` (Cambio de rol):** Extrae los roles anteriores y nuevos:
     * *Ejemplo:* `"Cambié el rol de un usuario de Agente a Supervisor."`
   - **`change_status` (Cambio de estado de la cuenta):** Mapea la transición de estados (ej. activo, inactivo, suspendido):
     * *Ejemplo:* `"Cambié el estado de un usuario de active a suspended."`
   - **`login` (Inicio de sesión):** Comprime a un mensaje estático:
     * *Ejemplo:* `"Inició sesión en el sistema."`
   - **Acción por defecto / Fallo de Parseo:** Si la acción es desconocida o el campo de detalles no es un JSON válido, formatea de forma genérica quitando guiones bajos:
     * *Ejemplo:* `"Realizó la acción: [nombre_de_accion]"`

---

## 4. Integración con el Backend (API)

El frontend se comunica con el endpoint del backend definido en `auditRoute.ts`:

- **Servicio en Frontend:** `fetchAuditLogs()` en `dashboardApi.ts` realiza un `GET /api/audit-logs`.
- **Ruta de la API en el Backend (`GET /api/audit-logs`):**
  1. Aplica el middleware `requireAuthAndAuditAccess`.
  2. Verifica que la tabla `audit_logs` exista físicamente en PostgreSQL mediante `ensureAuditTableExists()`.
  3. Ejecuta una consulta SQL a la base de datos limitando la respuesta a los **100 registros más recientes** ordenados por fecha descendenete para evitar sobrecarga:
     ```sql
     SELECT id, entity_type AS "entityType", entity_id AS "entityId", action, performed_by AS "performedBy", details, created_at AS "createdAt"
     FROM audit_logs
     ORDER BY created_at DESC
     LIMIT 100
     ```
  4. Devuelve el arreglo JSON con una firma de éxito `200 OK`.

---

## 5. Estructura de Base de Datos y Persistencia (PostgreSQL)

La persistencia de las actividades de auditoría se aloja en la tabla `audit_logs` (definida en `init.sql`):

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

### Explicación de Columnas:
- **`id`:** Clave primaria única (con formato `audit-` o `audit-update-`).
- **`entity_type`:** Tipo de módulo afectado (ej. `"user"`, `"credential"`, `"backup"`, etc.).
- **`entity_id`:** El ID del registro específico que fue afectado.
- **`action`:** Identificador técnico de la acción ejecutada (ej. `"create_user"`, `"login"`).
- **`performed_by`:** El ID o username del usuario administrador/supervisor que llevó a cabo la acción.
- **`details`:** Cadena de texto JSON que guarda los metadatos y valores anteriores/nuevos correspondientes a la acción.
- **`created_at`:** Marca de tiempo ISO string del momento de ocurrencia.

---

## 6. Control de Accesos y Seguridad (RBAC)

El acceso al registro de auditoría es un privilegio de alta seguridad regulado rigurosamente:

1. **Agentes:**
   - No tienen acceso a la ruta de Ajustes en frontend. El backend además bloquea cualquier llamada de agentes devolviendo error.
2. **Restricción Centrada en el Backend (`requireAuthAndAuditAccess`):**
   - El backend utiliza la función `ensureAuthorized` para certificar que el usuario posee el permiso `'view-audit-logs'`:
     ```typescript
     ensureAuthorized(req.user?.role, 'view-audit-logs');
     ```
   - En la matriz de seguridad del archivo central de autorización del backend (`authorization.ts`):
     - **Administrador:** Tiene acceso completo (`true`).
     - **Supervisor:** Tiene acceso completo (`true`) para ver los logs, permitiéndole fiscalizar los movimientos de la plataforma de manera transparente.
     - **Agente:** Retorna `false` de manera permanente. Si un agente de alguna forma intenta consultar el endpoint a través de herramientas de consola, la API le denegará la petición devolviendo un código de estado **`403 Forbidden`** con el mensaje: `"No tienes permisos para ver el registro de actividad"`.
