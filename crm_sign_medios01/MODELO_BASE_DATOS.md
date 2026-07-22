# Modelo de base de datos del proyecto

Este documento explica, de forma práctica, cómo funciona el nuevo modelo de base de datos del proyecto y por qué se organizó así.

## 1. Objetivo del nuevo modelo

El nuevo diseño busca separar las responsabilidades del sistema para que la base de datos sea más clara, más segura y más fácil de mantener.

En lugar de tener toda la lógica mezclada en una sola tabla, ahora el modelo distingue entre:

- identidad del usuario,
- autenticación,
- dispositivos asignados,
- agentes operativos,
- contactos,
- conversaciones,
- mensajes,
- archivos adjuntos,
- auditoría,
- sesiones y respaldos.

## 2. Estructura general

La arquitectura del modelo se apoya en estas tablas principales:

- users: almacena la identidad general del usuario.
- auth_users: guarda las credenciales y datos de acceso.
- devices: registra los dispositivos físicos asignados a un usuario.
- agents: representa la vista operativa del agente en el panel. //esto no va 
- contacts: guarda los clientes o prospectos.
- conversations: representa conversaciones activas o históricas.
- messages: guarda cada mensaje dentro de una conversación.
- media_files: almacena archivos adjuntos de mensajes.
- audit_logs: registra acciones del sistema para trazabilidad.
- backups: guarda información de respaldos.
- user_sessions: controla las sesiones activas y los tokens.

## 3. Cómo se relacionan las tablas

### 3.1 Usuarios y autenticación

La tabla users es el centro del modelo.

- Un usuario tiene un registro en users.
- Ese mismo usuario puede tener un registro relacionado en auth_users.
- La relación es 1 a 1: un usuario tiene una sola entrada de autenticación.

Esto permite separar dos conceptos importantes:

- la identidad del usuario en el sistema,
- sus credenciales para ingresar.

### 3.2 Usuarios y dispositivos

Cada usuario puede tener un dispositivo asignado.

- users -> devices: relación 1 a 1.
- Esto sirve para controlar equipos, auditoría o bloquear accesos si el dispositivo cambia o se pierde.

### 3.3 Usuarios y agentes // no me cuadra

La tabla agents se usa para representar el perfil operativo del agente en la interfaz.

- Un agente puede estar ligado a un usuario.
- Esto permite que el panel use información de estado, avatar, teléfono y disponibilidad sin mezclarla con los datos de acceso.

### 3.4 Contactos y conversaciones

Los contactos representan a los clientes o prospectos.

- Un contacto puede estar asociado a un agente.
- Una conversación pertenece a un agente y puede estar vinculada a un contacto.

Esto permite modelar el flujo de atención:

1. se crea un contacto,
2. se inicia una conversación,
3. se registran mensajes,
4. se puede auditar la actividad.

### 3.5 Conversaciones y mensajes

Una conversación puede tener muchos mensajes.

- conversations -> messages: relación 1 a N.
- Cada mensaje pertenece a una conversación específica.

Esto es fundamental para mantener el historial de chat y poder consultar mensajes por hilo.

### 3.6 Mensajes y archivos adjuntos

Los mensajes pueden llevar contenido multimedia.

- messages -> media_files: relación 1 a N.
- Un mensaje puede tener varios archivos asociados.

La tabla media_files guarda metadatos como nombre, tipo MIME, ruta del archivo y tamaño.

## 4. Qué guarda cada tabla

### users

Representa al usuario principal del sistema.

Campos importantes:

- id: identificador único.
- full_name: nombre completo.
- username: nombre de usuario.
- role: rol del usuario.
- status: estado activo/inactivo/suspendido.
- access_to_panel: si puede acceder al panel.
- created_at, updated_at: control de auditoría.

### auth_users

Se usa para separar las credenciales del resto de la información del usuario.

Campos importantes:

- user_id: referencia al usuario real.
- username: nombre usado para login.
- password_hash: hash de la contraseña.
- role, status, access_to_panel.

### devices

Guarda información del hardware o del equipo asociado.

Ejemplos de uso:

- control de accesos,
- trazabilidad de operaciones,
- seguridad por dispositivo.

### agents

Mantiene datos operativos del agente para la interfaz.

Incluye:

- nombre,
- teléfono,
- avatar,
- estado online,
- relación con el usuario.

### contacts

Guarda los clientes o prospectos del sistema.

Incluye:

- nombre,
- teléfono,
- empresa,
- cargo,
- fecha de creación.

### conversations

Representa un hilo de atención o conversación.

Incluye:

- agente responsable,
- contacto vinculado,
- tema,
- estado,
- hora de inicio,
- teléfono asociado.

### messages

Guarda los mensajes individuales.

Incluye:

- texto,
- remitente,
- hora,
- canal,
- tipo de contenido,
- referencia a conversación.

### media_files

Se usa para los archivos adjuntos de un mensaje.

### audit_logs

Es una tabla de trazabilidad.

Cada cambio importante puede registrarse aquí con:

- entidad afectada,
- acción realizada,
- usuario que la hizo,
- detalles del cambio,
- fecha.

### backups

Guarda los registros de respaldos del sistema.

### user_sessions

Gestiona las sesiones activas y los tokens de acceso.

Permite:

- revocar sesiones,
- auditar accesos,
- controlar expiración.

## 5. Cómo funciona el flujo real del sistema

### Flujo de login

1. El sistema crea o valida un registro en users.
2. Se sincroniza la autenticación en auth_users.
3. Se crea una sesión en user_sessions.
4. Se registra la acción en audit_logs.

### Flujo de atención a un cliente

1. Se crea o selecciona un contact.
2. Se inicia una conversation.
3. Se agregan messages.
4. Si el mensaje trae archivo, se guarda en media_files.
5. La actividad queda registrada en audit_logs.

## 6. Cómo se migra desde el esquema anterior

El proyecto incluye scripts de migración para adaptar el modelo antiguo al nuevo.

En el backend, la migración:

- agrega columnas nuevas,
- crea tablas nuevas,
- ajusta relaciones entre tablas,
- rellena datos antiguos en las nuevas tablas,
- y deja preparada la base para la nueva arquitectura.

Los archivos clave son:

- backend/src/infrastructure/database/init.ts
- backend/src/infrastructure/database/init.sql
- backend/src/infrastructure/database/schema.ts

La migración está diseñada para ser repetible, es decir, puede ejecutarse varias veces sin romper el esquema.

## 7. Por qué este modelo es mejor

Este enfoque aporta varias ventajas:

- mejor separación entre identidad y autenticación,
- trazabilidad más clara con audit_logs,
- soporte más limpio para conversaciones y mensajes,
- manejo de adjuntos mediante media_files,
- mejor preparación para copias de seguridad y recuperación,
- mayor escalabilidad para futuras funciones.

## 8. Resumen breve

El nuevo modelo de base de datos organiza la información en bloques claros:

- usuarios y acceso,
- agentes y operaciones,
- clientes y conversaciones,
- mensajes y archivos,
- auditoría y seguridad.

Eso hace que el sistema sea más ordenado, más seguro y más fácil de evolucionar.
