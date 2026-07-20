# Guía Completa de Tablas de la Base de Datos - CRM SIGN Medios

Este documento explica de forma detallada el funcionamiento, estructura, relaciones y reglas de negocio de **todas las tablas** del sistema CRM bajo el nuevo diseño unificado de base de datos.

Este diseño optimiza la seguridad, elimina redundancias de datos (como el número de teléfono o foto duplicados) y separa elegantemente el hardware (dispositivos) del personal (usuarios/agentes), sin alterar la visualización unificada en el frontend.

---

## Mapa General de Relaciones (E-R)

1.  Un **Usuario/Agente** (`users`) puede tener asignado un **Dispositivo** (`dispositivos`) (Relación 1:1 opcional).
2.  Un **Usuario/Agente** (`users`) atiende múltiples **Conversaciones** (`conversaciones`) (Relación 1:N).
3.  Un **Usuario/Agente** (`users`) es responsable de múltiples **Contactos** (`contacts`) (Relación 1:N).
4.  Una **Conversación** (`conversaciones`) contiene múltiples **Mensajes** (`messages`) (Relación 1:N).
5.  Un **Usuario** con acceso (`users` con rol `admin`/`supervisor`) puede tener múltiples **Sesiones Activas** (`user_sessions`) (Relación 1:N).
6.  Las acciones críticas realizadas por el personal quedan registradas en la tabla de **Auditoría** (`audit_logs`).

---

## Explicación Detallada de Cada Tabla

### 1. Tabla: `users` (El Personal: Administradores, Supervisores y Agentes)
Representa a toda la fuerza humana del CRM. Centraliza los datos del perfil y determina el acceso al sistema.

*   **¿Cómo funciona?**
    *   Si es un **agente**, sus campos `username` y `password_hash` se registran vacíos (`NULL`) y su rol se establece como `'agent'`. No puede iniciar sesión.
    *   Si es un **administrador** o **supervisor**, se le definen credenciales únicas de acceso y se marca su flag `access_to_panel = TRUE`.
*   **Campos de la Tabla:**
    *   `id` (`TEXT`, PRIMARY KEY): Identificador único del usuario (ej. UUID).
    *   `full_name` (`TEXT`, NOT NULL): Nombre y apellido completos.
    *   `username` (`TEXT`, UNIQUE, **Permite NULL**): Nombre de usuario único para login.
    *   `password_hash` (`TEXT`, **Permite NULL**): Contraseña encriptada de forma segura (con bcrypt).
    *   `role` (`TEXT`, NOT NULL): Rol asignado (`'admin'`, `'supervisor'` o `'agent'`).
    *   `status` (`TEXT`, NOT NULL DEFAULT `'active'`): Estado de la cuenta (`'active'`, `'inactive'`).
    *   `access_to_panel` (`BOOLEAN`, NOT NULL DEFAULT `FALSE`): Control rápido de inicio de sesión.
    *   `position` (`TEXT`): Puesto de trabajo (ej. *"Agente de Soporte"*, *"Coordinador"*).
    *   `entry_date` (`TEXT`): Fecha oficial de contratación o ingreso a la organización.
    *   `foto` (`TEXT`): Ruta local o URL de la imagen de perfil del usuario. **(¡Renombrado de avatar a foto!)**
    *   `initials` (`TEXT`): Iniciales de visualización en la UI (ej. *"LM"*).
    *   `online` (`BOOLEAN`, NOT NULL DEFAULT `FALSE`): Indica si el usuario está conectado en tiempo real en la plataforma.
    *   `created_at` y `updated_at` (`TEXT`): Trazabilidad de creación y actualización de la ficha.

---

### 2. Tabla: `dispositivos` (Equipos Físicos y Líneas de WhatsApp)
Almacena las especificaciones del hardware móvil de la empresa y la línea de teléfono operativa del CRM.

*   **¿Cómo funciona?**
    *   El número de teléfono del agente se guarda **únicamente** en esta tabla (`assigned_phone`). Se eliminó el campo redundante de la tabla `users`.
    *   Se relaciona con `users` a través de `user_id`. Si un equipo está en stock y no ha sido asignado a ningún agente, el campo `user_id` se queda en `NULL`.
    *   El campo de auditoría de asignación `assigned_at` fue eliminado según las especificaciones.
*   **Campos de la Tabla:**
    *   `id` (`TEXT`, PRIMARY KEY): Identificador único del dispositivo físico.
    *   `user_id` (`TEXT`, UNIQUE, **Permite NULL**): Llave foránea que apunta a `users(id)`. Un dispositivo pertenece únicamente a un usuario activo.
    *   `brand_model` (`TEXT`, NOT NULL): Marca y modelo del celular (ej. *"Xiaomi Redmi Note 13"*).
    *   `serial_number_1` (`TEXT`, NOT NULL, UNIQUE): Número de serie principal o IMEI 1 del dispositivo.
    *   `serial_number_2` (`TEXT`): Número de serie secundario o IMEI 2 (opcional).
    *   `assigned_phone` (`TEXT`, NOT NULL, UNIQUE): Número de teléfono corporativo asignado al dispositivo (ej. `+584145550102`). **Es el único campo de toda la base de datos donde reside el teléfono operativo.**

---

### 3. Tabla: `conversaciones` (Hilos de Chats)
Registra las interacciones iniciadas entre un cliente externo y un agente de la plataforma.

*   **¿Cómo funciona?**
    *   Toda conversación está vinculada a un agente mediante `agent_id` (que apunta directamente a `users(id)`).
    *   Cuando un agente atiende un chat de WhatsApp, el sistema sabe cuál es su número telefónico uniendo esta tabla con la de `dispositivos` mediante la relación del usuario.
*   **Campos de la Tabla:**
    *   `id` (`TEXT`, PRIMARY KEY): Identificador único del hilo de chat.
    *   `agent_id` (`TEXT`, NOT NULL): Llave foránea que apunta a `users(id)`. Vincula el chat al agente responsable.
    *   `client_name` (`TEXT`, NOT NULL): Nombre del cliente o prospecto externo.
    *   `topic` (`TEXT`, NOT NULL): Asunto o etiqueta rápida del chat (ej. *"Presupuesto de Campaña"*).
    *   `status` (`TEXT`, NOT NULL DEFAULT `'active'`): Estado de la conversación (`'active'`, `'waiting'`, `'closed'`).
    *   `start_time` (`TEXT`, NOT NULL): Fecha y hora en que se inició la conversación.
    *   `phone` (`TEXT`): Número de teléfono del cliente con el que se chatea.

---

### 4. Tabla: `messages` (Mensajes de Chat)
Almacena los mensajes individuales que componen cada una de las conversaciones activas o históricas.

*   **¿Cómo funciona?**
    *   Pertenece a una conversación mediante `conversation_id`.
    *   Guarda mensajes entrantes (enviados por el cliente vía WhatsApp) o salientes (enviados por el agente desde el dashboard).
*   **Campos de la Tabla:**
    *   `id` (`TEXT`, PRIMARY KEY): Identificador único del mensaje.
    *   `conversation_id` (`TEXT`, NOT NULL): Llave foránea que apunta a `conversaciones(id)`.
    *   `sender` (`TEXT`, NOT NULL): Quién envió el mensaje (`'client'` o `'agent'`).
    *   `text` (`TEXT`, NOT NULL): El contenido textual del mensaje de chat.
    *   `time` (`TEXT`, NOT NULL): Marca de tiempo del mensaje.
    *   `source` (`TEXT`, NOT NULL DEFAULT `'dashboard'`): Canal de origen (`'dashboard'` o `'whatsapp'`).
    *   `external_message_id` (`TEXT`): ID único que proporciona la API de WhatsApp Business para evitar duplicación de mensajes entrantes.

---

### 5. Tabla: `contacts` (Directorio de Clientes)
La agenda centralizada de contactos de la empresa.

*   **¿Cómo funciona?**
    *   Cada contacto está asignado a un miembro del personal de ventas (`agent_id` apuntando a `users(id)`).
*   **Campos de la Tabla:**
    *   `id` (`TEXT`, PRIMARY KEY): Identificador único del contacto.
    *   `agent_id` (`TEXT`): Llave foránea que apunta a `users(id)`. Permite asignar una cartera de clientes a cada usuario.
    *   `name` (`TEXT`, NOT NULL): Nombre completo del cliente.
    *   `phone` (`TEXT`, NOT NULL): Teléfono de contacto personal.
    *   `company` (`TEXT`): Empresa a la que pertenece (opcional).
    *   `position` (`TEXT`): Cargo del contacto en su empresa (opcional).
    *   `created_at` (`TEXT`, NOT NULL): Fecha en la que fue registrado en la agenda.

---

### 6. Tabla: `user_sessions` (Sesiones Activas y Tokens)
Garantiza que solo las personas autorizadas mantengan conexiones seguras al panel del CRM.

*   **¿Cómo funciona?**
    *   Cuando un administrador o supervisor inicia sesión, se genera un registro en esta tabla con un token único y seguro.
    *   El middleware del backend valida este token en cada acción. Si el usuario pertenece a una sesión revocada o expirada, se le deniega el acceso de inmediato.
*   **Campos de la Tabla:**
    *   `id` (`TEXT`, PRIMARY KEY): Identificador único de sesión.
    *   `user_id` (`TEXT`, NOT NULL): Llave foránea que apunta a `users(id)`.
    *   `token_hash` (`TEXT`, NOT NULL, UNIQUE): Token de sesión encriptado para máxima seguridad de transporte.
    *   `role` (`TEXT`, NOT NULL): El rol del usuario al momento de iniciar la sesión (`'admin'` o `'supervisor'`).
    *   `expires_at` (`TEXT`, NOT NULL): Fecha de expiración de la sesión.
    *   `created_at` y `updated_at` (`TEXT`): Registro temporal de actividad de la sesión.
    *   `revoked_at` (`TEXT`): Fecha de cierre de sesión (si el usuario hace deslogueo manual).

---

### 7. Tabla: `audit_logs` (Bitácora de Auditoría y Actividad)
Registra de forma inmutable todas las acciones críticas e importantes realizadas en el panel por los administradores y supervisores.

*   **¿Cómo funciona?**
    *   Cada vez que se crea, edita o elimina una ficha de usuario, se asigna un rol, o se modifica un dispositivo, el sistema registra quién lo hizo (`performed_by`) y el detalle exacto del cambio en esta tabla.
*   **Campos de la Tabla:**
    *   `id` (`TEXT`, PRIMARY KEY): Identificador único del log de auditoría.
    *   `entity_type` (`TEXT`, NOT NULL): Tipo de recurso modificado (ej. `'user'`, `'device'`).
    *   `entity_id` (`TEXT`, NOT NULL): ID del elemento modificado.
    *   `action` (`TEXT`, NOT NULL): Acción realizada (ej. `'CREATE'`, `'UPDATE_ROLE'`, `'DELETE'`).
    *   `performed_by` (`TEXT`, NOT NULL): Nombre del usuario que ejecutó la acción (ej. *"Administrador"*).
    *   `details` (`TEXT`, NOT NULL): Detalles específicos del cambio formateados en formato JSON o texto claro (ej. *"Cambio de rol de agente a administrador y asignación de credenciales"*).
    *   `created_at` (`TEXT`, NOT NULL): Fecha y hora exacta de la acción.

---

### 8. Tabla: `backups` (Historial de Copias de Seguridad)
Almacena el registro de los respaldos de base de datos creados por la administración.

*   **Campos de la Tabla:**
    *   `id` (`TEXT`, PRIMARY KEY): ID del registro de respaldo.
    *   `backup_type` (`TEXT`, NOT NULL): Tipo de copia de seguridad (`'sql'`, `'csv'`).
    *   `file_name` (`TEXT`, NOT NULL): Nombre del archivo generado físicamente en disco.
    *   `created_at` (`TEXT`, NOT NULL): Fecha de creación del respaldo.
    *   `status` (`TEXT`, NOT NULL DEFAULT `'pending'`): Estado del proceso (`'pending'`, `'success'`, `'failed'`).
    *   `file_path` (`TEXT`): Ruta física del archivo en el servidor.
    *   `file_url` (`TEXT`): Enlace de descarga seguro para el administrador en el panel.

---

## 4. Resumen de Flujos Integrados en la Base de Datos

### Flujo de Promoción y Asignación de Hardware
1.  **Ingreso de Nuevo Agente:** Se inserta una fila en `users` con rol `'agent'`, guardando su `foto` de perfil, su cargo (`position`) y su `entry_date`. Sus credenciales de login se mantienen vacías (`NULL`).
2.  **Asignación de Teléfono Corporativo:** Se inserta una fila en `dispositivos` con la marca, IMEI, y el número de teléfono del agente en `assigned_phone`, vinculándolo a través del campo `user_id` de la tabla `users` creada en el paso anterior.
3.  **Promoción por el Administrador:** Si el administrador decide darle acceso al panel al agente, realiza un `UPDATE` en la tabla `users` para actualizar su rol a `'admin'` o `'supervisor'`, llenando un nuevo nombre de usuario único en `username` y la contraseña encriptada en `password_hash`. El teléfono en `dispositivos` se mantiene vinculado automáticamente por medio de la llave foránea `user_id`. No se pierde ningún dato ni historial de chats del agente.
