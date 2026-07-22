# Guía Completa de Tablas de la Base de Datos - CRM SIGN Medios

Este documento explica de forma detallada el funcionamiento, estructura, relaciones y reglas de negocio de todas las tablas del sistema CRM bajo el nuevo diseño unificado de base de datos.

Este diseño optimiza la seguridad, elimina redundancias de datos (como el número de teléfono o foto duplicados) y separa elegantemente el hardware (dispositivos) del personal (usuarios/agentes), sin alterar la visualización unificada en el frontend.

---

## Mapa General de Relaciones (E-R)

1. Un Usuario/Agente (users) puede tener asignado un Dispositivo (dispositivos) (Relación 1:1 opcional).
2. Un Usuario/Agente (users) puede tener una cuenta de autenticación (auth_users) (Relación 1:1).
3. Un Usuario/Agente (users) atiende múltiples Conversaciones (conversaciones) (Relación 1:N).
4. Un Usuario/Agente (users) es responsable de múltiples Contactos (contacts) (Relación 1:N).
5. Una Conversación (conversaciones) contiene múltiples Mensajes (messages) (Relación 1:N).
6. Una cuenta de autenticación (auth_users con rol admin/supervisor) puede tener múltiples Sesiones Activas (user_sessions) (Relación 1:N).
7. Las acciones críticas realizadas por el personal quedan registradas en la tabla de Auditoría (audit_logs).

---

## Explicación Detallada de Cada Tabla

### 1. Tabla: users (Datos Personales del Personal)
Representa la ficha de la persona dentro del CRM: nombre, cargo, estado laboral y datos visuales del perfil. Esta tabla ya no almacena credenciales ni permisos de acceso.

* ¿Cómo funciona?
    * Cada persona del sistema se registra primero aquí con sus datos personales.
    * Si esa persona necesita acceder al panel, se crea una fila adicional en auth_users vinculada mediante user_id.
    * Los agentes que no requieren acceso al panel pueden existir en users sin tener una cuenta de autenticación asociada.
* Campos de la Tabla:
    * id (UUID, PRIMARY KEY): Identificador único del usuario personal.
    * full_name (TEXT, NOT NULL): Nombre y apellido completos.
    * position (TEXT): Puesto de trabajo (ej. "Agente de Soporte", "Coordinador").
    * entry_date (DATE): Fecha oficial de contratación o ingreso a la organización.
    * foto (TEXT): Ruta local o URL de la imagen de perfil del usuario.
    * initials (TEXT): Iniciales de visualización en la UI (ej. "LM").
    * online (BOOLEAN, NOT NULL DEFAULT FALSE): Indica si el usuario está conectado en tiempo real en la plataforma.
    * created_at (TIMESTAMP WITH TIME ZONE, NOT NULL): Fecha y hora de creación de la ficha.
    * updated_at (TIMESTAMP WITH TIME ZONE): Fecha y hora de la última actualización.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  position TEXT,
  entry_date DATE,
  foto TEXT,
  initials TEXT,
  online BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

---

### 2. Tabla: auth_users (Credenciales y Permisos de Acceso)
Almacena la identidad del sistema para iniciar sesión y los permisos que tiene cada persona dentro del CRM.

* ¿Cómo funciona?
    * Cada registro de auth_users está vinculado a una persona de users mediante user_id.
    * El rol, el estado de acceso y las credenciales de login se gestionan aquí, evitando mezclar datos de autenticación con datos de perfil.
* Campos de la Tabla:
    * id (UUID, PRIMARY KEY): Identificador único de la cuenta de autenticación.
    * user_id (UUID, NOT NULL, UNIQUE): Llave foránea que apunta a users(id). Relaciona la cuenta con la persona correspondiente.
    * username (TEXT, UNIQUE, Permite NULL): Nombre de usuario único para login.
    * password_hash (TEXT, Permite NULL): Contraseña encriptada de forma segura (con bcrypt).
    * role (TEXT, NOT NULL): Rol asignado ('admin', 'supervisor' o 'agent').
    * status (TEXT, NOT NULL DEFAULT 'active'): Estado de la cuenta ('active', 'inactive').
    * access_to_panel (BOOLEAN, NOT NULL DEFAULT FALSE): Control rápido de inicio de sesión.
    * created_at (DATETIME, NOT NULL): Fecha y hora de creación de la cuenta.
    * updated_at (DATETIME): Fecha y hora de la última actualización.

---

### 3. Tabla: dispositivos (Equipos Físicos y Líneas de WhatsApp)
Almacena las especificaciones del hardware móvil de la empresa y la línea de teléfono operativa del CRM.

* ¿Cómo funciona?
    * El número de teléfono del agente se guarda únicamente en esta tabla (assigned_phone). Se eliminó el campo redundante de la tabla users.
    * Cada dispositivo debe estar asociado obligatoriamente a un usuario/agente mediante user_id.
    * No debe existir un dispositivo sin propietario en el sistema.
    * El campo de auditoría de asignación assigned_at fue eliminado según las especificaciones.
* Campos de la Tabla:
    * id (UUID, PRIMARY KEY): Identificador único del dispositivo físico.
    * user_id (UUID, NOT NULL, UNIQUE): Llave foránea que apunta a users(id). Un dispositivo pertenece únicamente a un usuario activo.
    * brand_model (TEXT, NOT NULL): Marca y modelo del celular (ej. "Xiaomi Redmi Note 13").
    * serial_number_1 (VARCHAR(20), NOT NULL, UNIQUE): Número de serie principal o IMEI 1 del dispositivo.
    * serial_number_2 (VARCHAR(20)): Número de serie secundario o IMEI 2 (opcional).
    * assigned_phone (TEXT, NOT NULL, UNIQUE): Número de teléfono corporativo asignado al dispositivo (ej. +584145550102). Es el único campo de toda la base de datos donde reside el teléfono operativo.

---

### 4. Tabla: conversaciones (Hilos de Chats)
Registra las interacciones iniciadas entre un cliente externo y un agente de la plataforma.

* ¿Cómo funciona?
    * Toda conversación está vinculada a un agente mediante agent_id (que apunta directamente a users(id)).
    * Además, cada conversación puede relacionarse con un contacto existente en contacts mediante contact_id, de modo que el número telefónico del cliente se obtiene desde la tabla de contactos y no se duplica en esta tabla.
    * Cuando un agente atiende un chat de WhatsApp, el sistema sabe cuál es su número telefónico uniendo esta tabla con la de dispositivos mediante la relación del usuario y, de forma adicional, con contacts a través de contact_id.
* Campos de la Tabla:
    * id (UUID, PRIMARY KEY): Identificador único del hilo de chat.
    * agent_id (UUID, NOT NULL): Llave foránea que apunta a users(id). Vincula el chat al agente responsable.
    * contact_id (UUID): Llave foránea que apunta to contacts(id). Relaciona la conversación con el contacto correspondiente.
    * topic (TEXT, NOT NULL): Asunto o etiqueta rápida del chat (ej. "Presupuesto de Campaña").
    * start_time (DATETIME, NOT NULL): Fecha y hora en que se inició la conversación.

---

### 5. Tabla: messages (Mensajes de Chat)
Almacena los mensajes individuales que componen cada conversación activa o histórica, incluyendo texto y referencias a contenido multimedia cuando aplica.

* ¿Cómo funciona?
    * Cada mensaje pertenece a una conversación mediante conversation_id.
    * Puede almacenar contenido textual directamente en text_body o referenciar un archivo adjunto mediante media_file_id.
    * El canal de origen se registra con channel para saber si el mensaje vino desde dashboard o WhatsApp.
* Campos de la Tabla:
    * id (UUID, PRIMARY KEY): Identificador único del mensaje.
    * conversation_id (UUID, NOT NULL): Llave foránea que apunta a conversaciones(id).
    * content_type (TEXT, NOT NULL): Tipo de contenido del mensaje ('text' o 'media').
    * text_body (TEXT): Contenido textual del mensaje cuando content_type = 'text'.
    * media_file_id (UUID): Referencia al archivo adjunto cuando content_type = 'media' (por ejemplo, sticker, emoji, imagen o documento).
    * channel (TEXT, NOT NULL DEFAULT 'dashboard'): Canal de origen ('dashboard' o 'whatsapp').
    * created_at (DATETIME, NOT NULL): Fecha y hora en que se registró el mensaje.

---

### 6. Tabla: media_files (Archivos Multimedia y Documentos)
Almacena los archivos adjuntos asociados a un mensaje, como stickers, emojis, imágenes, audios, videos, PDFs y documentos de oficina.

* ¿Cómo funciona?
    * Cada archivo está asociado a un mensaje mediante message_id, para mantener trazabilidad del contenido enviado.
    * El archivo físico se guarda en una carpeta local del VPS, mientras que la base de datos solo almacena la referencia del archivo y sus metadatos.
    * Esto permite separar claramente el contenido textual del contenido multimedia y evitar sobrecargar la base de datos con archivos binarios.
* Campos de la Tabla:
    * id (UUID, PRIMARY KEY): Identificador único del archivo adjunto.
    * message_id (UUID, NOT NULL): Llave foránea que apunta a messages(id). Relaciona el archivo con el mensaje correspondiente.
    * file_name (TEXT, NOT NULL): Nombre original del archivo.
    * mime_type (TEXT, NOT NULL): Tipo MIME del archivo (ej. image/jpeg, video/mp4, application/pdf).
    * file_type (TEXT, NOT NULL): Categoría del archivo ('sticker', 'emoji', 'image', 'video', 'audio', 'document').
    * file_path (TEXT, NOT NULL): Ruta física del archivo dentro del VPS.
    * file_size (INTEGER): Tamaño del archivo en bytes.
    * created_at (DATETIME, NOT NULL): Fecha y hora en que se recibió o subió el archivo.

---

### 7. Tabla: contacts (Directorio de Clientes)
La agenda centralizada de contactos de la empresa.

* ¿Cómo funciona?
    * Cada contacto está asignado a un miembro del personal de ventas (agent_id apuntando a users(id)).
* Campos de la Tabla:
    * id (UUID, PRIMARY KEY): Identificador único del contacto.
    * agent_id (UUID): Llave foránea que apunta a users(id). Permite asignar una cartera de clientes a cada usuario.
    * name (TEXT, NOT NULL): Nombre completo del cliente.
    * phone (VARCHAR(20), NOT NULL): Teléfono de contacto personal. Es el dato principal y preferible para representar el número del cliente, evitando duplicación si conversaciones puede referenciar este registro.
    * company (TEXT): Empresa a la que pertenece (opcional).
    * position (TEXT): Cargo del contacto en su empresa (opcional).
    * created_at (DATETIME, NOT NULL): Fecha y hora en la que fue registrado en la agenda.

---

### 8. Tabla: user_sessions (Sesiones Activas y Tokens)
Garantiza que solo las personas autorizadas mantengan conexiones seguras al panel del CRM.

* ¿Cómo funciona?
    * Cuando un administrador o supervisor inicia sesión, se genera un registro en esta tabla con un token único y seguro.
    * El middleware de autorización consulta el rol y la información de acceso desde auth_users mediante la llave auth_user_id en tiempo real. Esto garantiza que cualquier cambio de rol o revocación por parte del administrador bloquee accesos de inmediato, evitando problemas de permisos desactualizados.
* Campos de la Tabla:
    * id (UUID, PRIMARY KEY): Identificador único de sesión.
    * auth_user_id (UUID, NOT NULL): Llave foránea que apunta a auth_users(id).
    * token_hash (TEXT, NOT NULL, UNIQUE): Token de sesión encriptado para máxima seguridad de transporte.
    * expires_at (DATETIME, NOT NULL): Fecha de expiración de la sesión.
    * created_at (DATETIME, NOT NULL): Fecha y hora de creación de la sesión.
    * updated_at (DATETIME): Fecha y hora de la última actualización de la sesión.
    * revoked_at (DATETIME): Fecha de cierre de sesión (si el usuario hace deslogueo manual).

---

### 9. Tabla: audit_logs (Bitácora de Auditoría y Actividad)
Registra de forma inmutable las acciones de auditoría más relevantes del sistema, enfocadas en identificar quién realizó un cambio y qué ocurrió.

* ¿Cómo funciona?
    * Se registran eventos clave como el inicio de sesión y cierre de sesión, la creación de usuarios nuevos, los cambios de roles y permisos, así como la creación, edición y eliminación de fichas de agentes, contactos.
    * Cada evento queda asociado a un usuario mediante user_id y a un recurso concreto mediante entity_type y entity_id.
    * El campo details permite conservar un resumen claro del cambio realizado.
* Campos de la Tabla:
    * id (UUID, PRIMARY KEY): Identificador único del log de auditoría.
    * entity_type (TEXT, NOT NULL): Tipo de recurso afectado (ej. 'user', 'contact', 'device').
    * entity_id (UUID, NOT NULL): ID del elemento modificado.
    * action (TEXT, NOT NULL): Acción realizada (ej. 'LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'UPDATE_ROLE').
    * user_id (UUID, NOT NULL): Llave foránea que apunta a users(id). Identifica al usuario que ejecutó la acción.
    * details (TEXT, NOT NULL): Detalles específicos del cambio formateados en formato JSON o texto claro.
    * created_at (DATETIME, NOT NULL): Fecha y hora exacta de la acción.

---

### 10. Tabla: backups (Historial de Copias de Seguridad)
Almacena el registro de los respaldos de base de datos creados por la administración.

* Campos de la Tabla:
    * id (UUID, PRIMARY KEY): ID del registro de respaldo.
    * backup_type (TEXT, NOT NULL): Tipo de copia de seguridad ('sql', 'csv').
    * file_name (TEXT, NOT NULL): Nombre del archivo generado físicamente en disco.
    * created_at (DATETIME, NOT NULL): Fecha de creación del respaldo.
    * status (TEXT, NOT NULL DEFAULT 'pending'): Estado del proceso ('pending', 'success', 'failed').
    * file_path (TEXT): Ruta física del archivo en el servidor.
    * file_url (TEXT): Enlace de descarga seguro para el administrador en el panel.

---

## 4. Resumen de Flujos Integrados en la Base de Datos

### Flujo de Promoción y Asignación de Hardware
1. Creación de Ficha del Agente: Se crea primero la ficha personal en users con su foto de perfil, cargo (position), fecha de ingreso (entry_date) y demás datos básicos del agente.
2. Creación del Usuario Nuevo en el Sistema: Si el agente debe acceder al panel, se crea también una fila relacionada en auth_users para registrar su usuario, contraseña encriptada, rol y permisos de acceso.
3. Asignación de Teléfono Corporativo: Se inserta una fila en dispositivos con la marca, IMEI y el número de teléfono del agente en assigned_phone, vinculándolo a través del campo user_id de la tabla users creada en el paso anterior.
4. Promoción por el Administrador: Si el administrador decide otorgarle acceso superior, realiza un UPDATE en auth_users para cambiar su rol a 'admin' o 'supervisor', actualizar username y password_hash según corresponda, manteniendo el vínculo con dispositivos y con el historial de chats del agente.
