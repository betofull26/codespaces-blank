# Documentación de la Base de Datos - CRM SIGN Medios

Este documento describe la arquitectura, lógica y estructura de la base de datos de CRM SIGN Medios, diseñada para soportar una arquitectura limpia y una gestión de mensajería multi-canal.

## 1. Arquitectura y Lógica General

La base de datos utiliza **PostgreSQL** como motor relacional. La lógica de persistencia está desacoplada del negocio mediante el patrón **Repository**, lo que permite que el dominio del sistema sea independiente de la implementación específica de SQL.

### Principios de Diseño:
- **Relacional:** Mantiene una integridad referencial estricta entre agentes, conversaciones y mensajes.
- **Auditable:** Cada acción crítica en la gestión de usuarios queda registrada para trazabilidad.
- **Escalable:** Incluye índices en campos de búsqueda frecuentes como `username`, `agent_id` y `conversation_id`.
- **Híbrida:** Almacena estados de tiempo real (como la conexión de agentes) y persistencia histórica de mensajes.

---

## 2. Desglose de Tablas (9 tablas principales)

### 2.1. Gestión de Agentes y Contactos
- **`agents`**: Almacena los perfiles de los agentes que operan en el dashboard.
  - *Campos clave:* `id`, `name`, `role`, `online` (estado de conexión).
- **`contacts`**: Directorio de clientes o contactos externos asociados o no a un agente.
  - *Relación:* `agent_id` (FK a `agents`).

### 2.2. Comunicación y Mensajería
- **`conversations`**: Cabeceras de los hilos de comunicación entre un agente y un cliente.
  - *Campos clave:* `status` (active, waiting, closed), `topic`, `phone`.
  - *Relación:* `agent_id` (FK a `agents`).
- **`messages`**: Contenido individual de cada comunicación.
  - *Campos clave:* `source` (whatsapp, dashboard, internal), `sender` (agent, client, supervisor), `external_message_id`.
  - *Relación:* `conversation_id` (FK a `conversations`).

### 2.3. Seguridad y Usuarios
- **`users`**: Usuarios del sistema con acceso al panel administrativo o de supervisión.
  - *Campos clave:* `username`, `password_hash`, `role` (admin, supervisor, agent), `access_to_panel`.
- **`user_sessions`**: Gestión de tokens de sesión y persistencia de login.
  - *Campos clave:* `token_hash`, `expires_at`, `revoked_at`.
  - *Relación:* `user_id` (FK a `users`).

### 2.4. Control y Mantenimiento
- **`audit_logs`**: Registro histórico de cambios y acciones realizadas por usuarios.
  - *Campos clave:* `entity_type`, `action`, `performed_by`, `details`.
- **`backups`**: Registro de las copias de seguridad generadas por el sistema.
  - *Campos clave:* `file_path`, `status`, `backup_type`.

---

## 3. Flujos de Datos Críticos

### Inicio de Sesión (Login)
1. Se consulta la tabla `users` por `username`.
2. Se valida el hash de la contraseña.
3. Se crea un registro en `user_sessions` con un token único y fecha de expiración.

### Recepción de Mensaje (WhatsApp)
1. El webhook recibe el mensaje y busca en `conversations` por el número de teléfono (`phone`).
2. Si no existe, se crea una nueva conversación.
3. Se inserta el mensaje en `messages` con `source = 'whatsapp'` y se vincula al `id` de la conversación.

---

## 4. Sugerencias de Mejora y Escalabilidad

1. **Particionamiento de Mensajes:** Si el volumen de mensajes crece exponencialmente (millones de registros), se sugiere particionar la tabla `messages` por fecha (ej. particiones mensuales).
2. **Normalización de Roles:** Actualmente los roles se manejan como texto plano. Crear una tabla `roles` dedicada permitiría una gestión de permisos más dinámica (ACL).
3. **Optimización de Búsqueda:** Implementar búsqueda de texto completo (Full Text Search) en la tabla `messages` para permitir a los supervisores buscar palabras clave rápidamente en el historial.
4. **Soft Deletes:** Actualmente algunas tablas usan borrado físico. Implementar un campo `deleted_at` permitiría recuperar datos borrados accidentalmente y mejorar la integridad de los registros históricos de auditoría.
5. **Tipado de Tiempos:** El esquema actual usa `TEXT` para campos de tiempo. Se recomienda migrar a `TIMESTAMPTZ` para aprovechar las funciones nativas de PostgreSQL para manejo de zonas horarias y cálculos de intervalos de tiempo.
