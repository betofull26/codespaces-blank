
# README: tabla clientes

Breve explicación:

- `clientes`: tabla que almacena clientes con los campos:
  - `id` (SERIAL PRIMARY KEY): identificador único del cliente.
  - `nombre` (TEXT): nombre del cliente.
  - `numero` (TEXT): teléfono del cliente.
  - `agente_id` (INTEGER): FK que referencia a `usuarios(id)` para asignar el cliente a un agente.

Relación:

- `agente_id` apunta a la tabla `usuarios` y permite vincular cada cliente con su agente responsable.

Nota: este README contiene únicamente la explicación breve solicitada.

-- Tablas adicionales añadidas y mapeo con el frontend

- `roles`: roles del sistema (Administrador, Agente, Supervisor). Mapeado desde las opciones de rol en Settings.
- `permissions` y `role_permissions`: permisos avanzados para roles (usado por el panel de permisos en Settings).
- `usuarios`: la entidad que representa a agentes/administradores; mapea campos mostrados en `agentsData`, `Settings` y `Login`.
- `conversaciones`: threads por cliente usados en `agentPanelData` y `agentsData` (topic, start_time, last_message, unread_count).
- `mensajes`: mensajes individuales dentro de `conversaciones` (tipo: whatsapp_in/out, internal_note), mapeados desde `agentPanelData`.
- `adjuntos`: archivos/attachments referenciados desde `mensajes`.
- `notas`: notas internas (pinned) asociadas a conversaciones, mapeadas desde `agentsData.*.notes`.
- `tickets`: fichas de soporte mostradas en `TicketManagement` (id, status, assignedTo, client, priority).
- `fichas_usuarios`: registros de equipo / fichas de usuario usados en `UserRecordManagement`.
- `respaldos`: registros de backups/exports generados en `SettingsPage` (tipo, label, file_url).

Cada tabla incorpora `agente_id` o `cliente_id` cuando corresponde para mantener consistencia con la asignación de contactos y conversaciones en el frontend.

Si quieres, genero además ejemplos `INSERT` con datos mock tomados de `agentsData` y `panelConversations` (no ejecutar). 
