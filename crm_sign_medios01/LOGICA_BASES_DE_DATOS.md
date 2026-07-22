# Lógica de las Bases de Datos - CRM SIGN Medios

## 📋 Índice
1. [Visión General](#visión-general)
2. [Arquitectura de Tablas](#arquitectura-de-tablas)
3. [Flujos de Datos Principales](#flujos-de-datos-principales)
4. [Relaciones entre Tablas](#relaciones-entre-tablas)
5. [Ciclo de Vida de Datos](#ciclo-de-vida-de-datos)
6. [Seguridad e Integridad](#seguridad-e-integridad)

---

## 🎯 Visión General

El sistema CRM SIGN Medios utiliza una **arquitectura de base de datos normalizada** que separa claramente:
- **Datos de Personas** (users)
- **Credenciales y Permisos** (auth_users)
- **Hardware/Dispositivos** (devices)
- **Interacciones Comerciales** (conversations, messages, contacts)
- **Auditoría y Backups** (audit_logs, backups)

**Principios Clave:**
- ✅ Una tabla para cada responsabilidad
- ✅ Eliminación de redundancia de datos
- ✅ Integridad referencial mediante Foreign Keys
- ✅ Trazabilidad completa mediante audit_logs

---

## 🏗️ Arquitectura de Tablas

### Nivel 1: Base - Usuarios y Autenticación

#### `users` (Datos Personales)
```
Propósito: Almacenar información de personas en el sistema
├── id (UUID): Identificador único
├── full_name: Nombre completo
├── position: Puesto laboral
├── entry_date: Fecha de ingreso
├── foto: URL/ruta de foto de perfil
├── initials: Iniciales (para UI)
├── online: Estado de conexión
├── created_at: Fecha de creación
└── updated_at: Última actualización

Relaciones:
├── 1:1 → auth_users (si necesita acceso al panel)
├── 1:1 → devices (si se le asigna un dispositivo)
├── 1:N → contacts (puede ser responsable de varios contactos)
├── 1:N → conversations (puede tener varias conversaciones)
└── 1:N → audit_logs (sus acciones se registran)
```

**¿Cuándo se crea?**
- Al registrar un nuevo miembro del equipo (agente, supervisor, admin)

**¿Cuándo se modifica?**
- Cambios en datos personales (nombre, puesto, foto)
- Actualizaciones de estado (online/offline)

---

#### `auth_users` (Credenciales y Permisos)
```
Propósito: Gestionar acceso y permisos al sistema
├── id (UUID): Identificador único de cuenta
├── user_id (UUID FK): Vinculo con users
├── username: Usuario para login
├── password_hash: Contraseña encriptada (bcrypt)
├── role: Rol ('admin', 'supervisor', 'agent')
├── status: Estado ('active', 'inactive', 'suspended')
├── access_to_panel: Control de acceso
├── created_at: Creación de cuenta
└── updated_at: Última actualización

Relaciones:
├── 1:N → user_sessions (múltiples sesiones activas)
└── (FK) ← users
```

**¿Cuándo se crea?**
- Cuando un usuario necesita acceder al panel del CRM

**¿Cuándo se modifica?**
- Cambios de rol (ascenso/degradación)
- Cambios de contraseña
- Cambios de estado (suspensión, activación)
- Cambios de permisos

---

#### `devices` (Hardware Móvil)
```
Propósito: Asociar números de teléfono y hardware a usuarios
├── id (UUID): Identificador único del dispositivo
├── user_id (UUID FK UNIQUE): Un dispositivo por usuario
├── brand_model: Marca y modelo (Xiaomi, iPhone, etc.)
├── serial_number_1: IMEI principal
├── serial_number_2: IMEI secundario (opcional)
└── assigned_phone: Número de teléfono corporativo

Relaciones:
└── (FK) ← users (relación 1:1)
```

**¿Cuándo se crea?**
- Al asignar un dispositivo móvil a un agente

**¿Cuándo se modifica?**
- Cambio de dispositivo
- Cambio de número de teléfono corporativo

---

### Nivel 2: Gestión Comercial

#### `contacts` (Directorio de Clientes)
```
Propósito: Almacenar información de clientes
├── id (UUID): Identificador único del contacto
├── user_id (UUID FK): Agente responsable
├── name: Nombre del cliente
├── phone: Teléfono del cliente (único)
├── company: Empresa (opcional)
├── position: Cargo en su empresa (opcional)
└── created_at: Fecha de registro

Relaciones:
├── (FK) ← users (responsable/agente)
└── 1:N → conversations (cliente puede tener múltiples chats)
```

**¿Cuándo se crea?**
- Nuevo cliente agregado al directorio
- Importación de contactos

**¿Cuándo se modifica?**
- Actualización de datos del cliente
- Reasignación a otro agente 

**¿Cuándo se elimina?**
- Cliente inactivo o duplicado

---

#### `conversations` (Hilos de Chat)
```
Propósito: Agrupar mensajes por conversación
├── id (UUID): Identificador de la conversación
├── user_id (UUID FK): Agente responsable
├── contact_id (UUID FK): Cliente/contacto asociado
├── topic: Asunto del chat (Presupuesto, Soporte, etc.)
└── start_time: Cuándo comenzó

Relaciones:
├── (FK) ← users (agente atendedor)
├── (FK) ← contacts (cliente)
└── 1:N → messages (múltiples mensajes)
```

**¿Cuándo se crea?**
- Nuevo chat iniciado (por cliente o agente)
- Integración con WhatsApp Business API

**¿Cuándo se modifica?**
- Cambio de agente responsable
- Cambio de asunto/tema

**¿Cuándo se cierra?**
- Conversación completada o archivada

---

#### `messages` (Mensajes Individuales)
```
Propósito: Registrar contenido textual o multimedia
├── id (UUID): Identificador único del mensaje
├── conversation_id (UUID FK): Conversación padre
├── content_type: 'text' o 'media'
├── text_body: Contenido textual
├── media_file_id (UUID FK): Referencia a archivo
├── channel: Origen ('dashboard' o 'whatsapp')
└── created_at: Cuándo se recibió/envió

Relaciones:
├── (FK) ← conversations
└── (FK) → media_files (si es multimedia)
```

**¿Cuándo se crea?**
- Mensaje enviado por agente
- Mensaje recibido de cliente (WhatsApp)

**¿Cuándo se modifica?**
- Raramente (historial inmutable)

---

#### `media_files` (Archivos Adjuntos)
```
Propósito: Metadatos de archivos multimedia
├── id (UUID): Identificador único del archivo
├── message_id (UUID FK): Mensaje que lo contiene
├── file_name: Nombre original del archivo
├── mime_type: Tipo (image/jpeg, application/pdf, etc.)
├── file_type: Categoría (sticker, image, video, audio, document)
├── file_path: Ruta física en servidor
├── file_size: Tamaño en bytes
└── created_at: Cuándo se recibió

Relaciones:
└── (FK) ← messages
```

**¿Cuándo se crea?**
- Archivo adjunto en mensaje
- Upload de documento por agente

---

### Nivel 3: Sesiones y Auditoría

#### `user_sessions` (Sesiones Activas)
```
Propósito: Controlar acceso y tokens de autenticación
├── id (UUID): Identificador único de sesión
├── auth_user_id (UUID FK): Usuario autenticado
├── token_hash: Token encriptado (para seguridad)
├── expires_at: Cuándo expira la sesión
├── created_at: Cuándo inició sesión
├── updated_at: Última actividad
└── revoked_at: Cuándo se cerró (logout)

Relaciones:
└── (FK) ← auth_users
```

**¿Cuándo se crea?**
- Usuario hace login exitoso

**¿Cuándo se revoca?**
- Usuario hace logout
- Cambio de permisos (revocación inmediata)
- Timeout de sesión (8 horas)

**Lógica Clave:**
```
Middleware de autenticación:
1. Recibe token del cliente
2. Busca en user_sessions
3. Valida que no esté revocado
4. Busca rol actualizado en auth_users
5. Permite/deniega acceso
```

---

#### `audit_logs` (Bitácora de Auditoría)
```
Propósito: Registro inmutable de todas las acciones
├── id (UUID): Identificador único
├── entity_type: Tipo de recurso ('user', 'contact', 'device', etc.)
├── entity_id (UUID): ID del recurso afectado
├── action: Acción realizada ('LOGIN', 'CREATE', 'UPDATE', etc.)
├── user_id (UUID FK): Quién ejecutó la acción
├── details: JSON con detalles del cambio
└── created_at: Cuándo ocurrió

Relaciones:
└── (FK) ← users (quién realizó la acción)
```

**¿Cuándo se registra?**
- Cada acción crítica del sistema
- Logins y logouts
- Creación/modificación/eliminación de usuarios
- Cambios de permisos
- Cambios en contactos y dispositivos

**¿Por qué es importante?**
- Trazabilidad completa
- Cumplimiento normativo
- Detección de anomalías
- Recuperación ante errores

---

#### `backups` (Historial de Respaldos)
```
Propósito: Registrar copias de seguridad de la BD
├── id (UUID): Identificador único del backup
├── backup_type: 'sql' o 'csv'
├── file_name: Nombre del archivo
├── created_at: Cuándo se creó
├── status: 'pending', 'success' o 'failed'
├── file_path: Ruta física en servidor
└── file_url: URL para descargar

Relaciones:
└── (Independiente - sin FK)
```

**¿Cuándo se crea?**
- Backup manual por administrador
- Backups automáticos programados

---

## 🔄 Flujos de Datos Principales

### Flujo 1: Registro y Onboarding de Agente

```
1. Administrador crea usuario
   ├── INSERT INTO users (full_name, position, foto, created_at)
   └── Resultado: usuario_id

2. Si necesita acceso al panel
   ├── INSERT INTO auth_users (user_id, username, password_hash, role)
   └── Resultado: auth_user_id
   
3. Si recibe dispositivo móvil
   ├── INSERT INTO devices (user_id, brand_model, assigned_phone)
   └── Resultado: device_id

4. Auditoría registra todo
   ├── INSERT INTO audit_logs (entity_type='user', action='CREATE', user_id=admin_id)
   └── Se registra quién, qué y cuándo
```

---

### Flujo 2: Inicio de Sesión

```
1. Usuario ingresa credentials (username + password)
   ├── SELECT * FROM auth_users WHERE username = ?
   └── Validar password_hash

2. Si es válido
   ├── INSERT INTO user_sessions (auth_user_id, token_hash, expires_at)
   └── Resultado: nuevo token

3. Middleware verifica token en futuras requests
   ├── SELECT * FROM user_sessions WHERE token_hash = ?
   ├── Verificar no revocado y no expirado
   ├── SELECT * FROM auth_users WHERE id = ?
   └── Autorizar según role actual

4. Auditoría registra
   ├── INSERT INTO audit_logs (entity_type='credential', action='LOGIN')
   └── Queda registro de quién y cuándo
```

**Ventaja:** Si un admin revoca permisos, se refleja **inmediatamente** en el siguiente request.

---

### Flujo 3: Cliente Envía Mensaje (WhatsApp → CRM)

```
1. Webhook de WhatsApp recibe mensaje
   ├── Buscar/crear contact por phone
   └── SELECT * FROM contacts WHERE phone = ?

2. Buscar conversación existente
   ├── SELECT * FROM conversations WHERE contact_id = ? 
   └── Si no existe, CREAR una nueva

3. Guardar mensaje
   ├── INSERT INTO messages (conversation_id, content_type, text_body, channel='whatsapp', created_at)
   └── Si tiene adjunto: INSERT INTO media_files

4. Asignar a agente (automático o por cola)
   ├── UPDATE conversations SET user_id = agente_id
   └── Agente ve chat en su dashboard

5. Registrar en auditoría
   ├── INSERT INTO audit_logs (entity_type='conversation', action='CREATE')
   └── Rastro de origen
```

---

### Flujo 4: Agente Responde

```
1. Agente escribe respuesta en dashboard
   ├── INSERT INTO messages (conversation_id, content_type='text', text_body, channel='dashboard')
   └── Si hay archivo: INSERT INTO media_files

2. Sistema envía por WhatsApp Business API
   ├── Usa assigned_phone del device del agente
   ├── Usa número del cliente de contacts
   └── Si envío exitoso: update message status

3. Auditoría registra
   ├── INSERT INTO audit_logs (entity_type='message', action='CREATE', user_id=agente_id)
   └── Queda registro de agente que respondió
```

---

### Flujo 5: Cierre de Sesión

```
1. Usuario hace logout
   ├── UPDATE user_sessions SET revoked_at = NOW() WHERE token_hash = ?
   └── Token ya no es válido

2. Auditoría registra
   ├── INSERT INTO audit_logs (entity_type='credential', action='LOGOUT')
   └── Queda registro de desconexión

3. Cualquier request con token revocado
   ├── Middleware rechaza acceso
   ├── Cliente redirige a login
   └── Seguridad garantizada
```

---

## 🔗 Relaciones entre Tablas

### Diagrama Entidad-Relación Simplificado

```
┌─────────────────┐
│     users       │ ← Base de datos de personas
│ (ID, nombre)    │
└────────┬────────┘
         │
    ┌────┴─────────────────┬─────────────┬─────────────┐
    │                      │             │             │
┌───▼──────────┐  ┌────────▼────┐  ┌────▼──────┐  ┌──▼────────────┐
│  auth_users  │  │   devices   │  │ contacts  │  │ conversations │
│ (credentials)│  │(phones/IMEI)│  │(clientes) │  │  (chats)      │
└───┬──────────┘  └─────────────┘  └───────────┘  └──┬─────────────┘
    │                                                 │
┌───▼──────────────┐                            ┌────▼─────────┐
│  user_sessions   │                            │   messages    │
│(active tokens)   │                            │(text/media)   │
└──────────────────┘                            └────┬──────────┘
                                                     │
                                              ┌──────▼──────────┐
                                              │  media_files    │
                                              │(attachments)    │
                                              └─────────────────┘

┌────────────────────────────────────────────────────┐
│          audit_logs (registra TODO)                │
│  ├─ user LOGIN/LOGOUT                             │
│  ├─ CREATE/UPDATE/DELETE users                    │
│  ├─ CREATE/UPDATE/DELETE contacts                 │
│  ├─ CREATE messages                               │
│  └─ Cualquier cambio importante                   │
└────────────────────────────────────────────────────┘

┌────────────────────┐
│     backups        │
│  (snapshots BD)    │
└────────────────────┘
```

---

## 🔐 Ciclo de Vida de Datos

### Usuario/Agente

```
CREACIÓN
  ↓
[users] ← datos personales
  ↓
¿Necesita panel? SÍ/NO
  ├─ SÍ → [auth_users] ← credenciales
  │        ↓
  │      [user_sessions] ← cuando hace login
  │        ↓ (múltiples sesiones posibles)
  │      [audit_logs] ← registra login/logout
  │
  └─ NO → FIN (solo data de persona, sin acceso)
  
¿Se le asigna dispositivo? SÍ/NO
  ├─ SÍ → [devices] ← phone, IMEI
  │        ↓
  │      Puede atender chats de WhatsApp
  │        ↓
  │      [conversations] + [messages]
  │
  └─ NO → Solo puede usar dashboard
  
MODIFICACIÓN
  ↓
UPDATE en [users], [auth_users], [devices]
  ↓
[audit_logs] registra cambios

ELIMINACIÓN (soft delete en la mayoría de casos)
  ↓
UPDATE status = 'inactive' en [auth_users]
  ↓
Session se revoca automáticamente
  ↓
[audit_logs] registra desactivación
```

### Conversación/Chat

```
CREACIÓN
  ↓
Cliente inicia chat (WhatsApp) o agente crea desde dashboard
  ↓
INSERT [conversations] con:
  ├─ contact_id → cliente
  ├─ user_id → agente asignado
  ├─ topic → asunto
  └─ start_time → inicio

ADICIÓN DE MENSAJES
  ↓
Cada mensaje:
  ├─ INSERT [messages] con contenido
  ├─ Si tiene adjunto: INSERT [media_files]
  └─ INSERT [audit_logs] registra quién envió

MODIFICACIÓN
  ↓
Cambio de agente responsable
  ├─ UPDATE conversations SET user_id = nuevo_agente
  └─ [audit_logs] registra cambio

CIERRE
  ↓
Status = 'closed' o archivado
  ├─ Datos permanecen en BD
  └─ Accesibles para consultas históricas
```

---

## 🛡️ Seguridad e Integridad

### Foreign Keys (Restricciones de Integridad)

```sql
-- Un usuario sin registro en users NO puede:
├─ Tener auth_users
├─ Tener dispositivo asignado
├─ Ser responsable de contactos
└─ Tener sesiones activas

-- Una conversación sin contact_id válido NO puede existir
-- Un mensaje sin conversation_id válido NO puede existir
-- Un media_file sin message_id válido NO puede existir
```

### Cascada de Cambios

```
Cuando se ELIMINA un usuario:
  ├─ ON DELETE CASCADE en devices
  ├─ ON DELETE CASCADE en contacts
  ├─ ON DELETE CASCADE en conversations (user_id)
  ├─ ON DELETE CASCADE en user_sessions
  ├─ ON DELETE CASCADE en audit_logs
  └─ BD se mantiene consistente

Cuando se ELIMINA una conversación:
  ├─ ON DELETE CASCADE en messages
  ├─ ON DELETE CASCADE en media_files
  └─ Todo limpio automáticamente
```

### Datos Inmutables

```
audit_logs:
├─ Una vez insertados, NUNCA se modifican
├─ Registro histórico completo
└─ Imposible "borrar pruebas"

messages:
├─ Se insertan con content_type, text_body, channel
├─ No se modifican (crear nuevos si hay correcciones)
└─ Historial 100% confiable
```

### Encriptación

```
Contraseñas:
  ├─ bcrypt hash en password_hash
  ├─ Irreversible (no se puede recuperar)
  └─ Debe reset si usuario olvida

Tokens de sesión:
  ├─ hashToken() encriptación
  ├─ Nunca se transmiten sin HTTPS
  └─ Expiran automáticamente (8 horas)

Datos sensibles:
  ├─ Teléfono en devices (asignado_a_usuario_específico)
  └─ Permisos en auth_users (requiere revisión de permisos)
```

---

## 📊 Consultas Comunes por Caso de Uso

### 1. "¿Cuáles son todas mis conversaciones?"
```sql
SELECT c.*, cont.name, cont.phone
FROM conversations c
LEFT JOIN contacts cont ON c.contact_id = cont.id
WHERE c.user_id = ?
ORDER BY c.start_time DESC
```

### 2. "¿Quién envió este mensaje?"
```sql
SELECT m.*, u.full_name, u.foto
FROM messages m
LEFT JOIN conversations c ON m.conversation_id = c.id
LEFT JOIN users u ON c.user_id = u.id
WHERE m.id = ?
```

### 3. "¿Qué acciones realizó este usuario hoy?"
```sql
SELECT * FROM audit_logs
WHERE user_id = ? 
  AND created_at >= TODAY()
ORDER BY created_at DESC
```

### 4. "¿Cuál es el número del agente?"
```sql
SELECT d.assigned_phone
FROM devices d
LEFT JOIN conversations c ON d.user_id = c.user_id
WHERE c.id = ?
```

### 5. "¿Cuáles sesiones están activas?"
```sql
SELECT * FROM user_sessions
WHERE revoked_at IS NULL
  AND expires_at > NOW()
ORDER BY created_at DESC
```

---

## 🎓 Resumen de Lógica

### Principio General
**"Una tabla, una responsabilidad"**

- `users` → Solo datos de personas
- `auth_users` → Solo acceso y credenciales
- `devices` → Solo hardware y teléfono
- `conversations` → Solo metadatos de chat
- `messages` → Solo contenido del chat
- `media_files` → Solo metadatos de archivos
- `audit_logs` → Registro de TODA actividad
- `user_sessions` → Control de sesiones activas
- `contacts` → Directorio de clientes
- `backups` → Historial de respaldos

### Ventajas

✅ **Consistencia:** Foreign keys garantizan integridad  
✅ **Seguridad:** Cada dato en su lugar, difícil de manipular  
✅ **Auditoría:** Trazabilidad completa de cambios  
✅ **Performance:** Queries optimizadas, índices en PK/FK  
✅ **Mantenibilidad:** Cambios en un área no afectan otras  
✅ **Recuperabilidad:** Backups y logs permiten rollback  

---

## 📝 Notas Importantes

1. **Nada se borra de verdad:** Se usa soft delete (status='inactive')
2. **Timestamps en UTC:** Todos con timezone para consistencia global
3. **UUIDs en lugar de secuencias:** Evita colisiones distribuidas
4. **JSON en details:** Permite capturar cambios complejos en auditoría
5. **No hay "undo" manual:** Solo through audit_logs + admin override

---

**Documento actualizado:** 2026-07-22  
**Versión:** 1.0  
**Estado:** Documentación de Producción
