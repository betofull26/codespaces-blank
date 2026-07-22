# 🏗️ Arquitectura del Nuevo Diseño de Base de Datos

## Tabla de Contenidos
1. [Visión General](#visión-general)
2. [Esquema de Base de Datos](#esquema-de-base-de-datos)
3. [Relaciones Entre Tablas](#relaciones-entre-tablas)
4. [Capas del Backend](#capas-del-backend)
5. [Flujos de Datos](#flujos-de-datos)
6. [Migración desde Legacy](#migración-desde-legacy)
7. [Operaciones CRUD](#operaciones-crud)
8. [Auditoría y Seguridad](#auditoría-y-seguridad)
9. [Disaster Recovery](#disaster-recovery)

---

## Visión General

El nuevo modelo de base de datos implementa una **arquitectura limpia (Clean Architecture)** con separación clara de responsabilidades:

```
┌─────────────────────────────────────────────────────────┐
│                    CAPA INTERFAZ (HTTP)                 │
│         Express.js Routes - API REST Endpoints          │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│               CAPA APLICACIÓN (Business Logic)          │
│  • userManagement.ts    • contactService.ts             │
│  • conversationService  • backupService.ts              │
│  • rollbackService.ts   • authorization.ts             │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                 CAPA DOMINIO (Models)                   │
│      Interfaces, Tipos, Reglas de Negocio             │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│            CAPA INFRAESTRUCTURA (Persistence)          │
│   PostgreSQL Repository - init.ts, rollback.ts         │
│   Database Connection Pool                             │
└─────────────────────────────────────────────────────────┘
```

---

## Esquema de Base de Datos

### 📊 Tablas del Sistema (11 tablas)

#### 1. **users** - Tabla Principal de Usuarios
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  access_to_panel BOOLEAN NOT NULL DEFAULT FALSE,
  position TEXT,
  entry_date TEXT,
  online BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```
**Propósito:** Almacenar identidad y datos básicos de usuarios.  
**Roles:** admin, supervisor, agent  
**Estado:** active, inactive, suspended

---

#### 2. **auth_users** - Tabla Nueva: Autenticación
```sql
CREATE TABLE auth_users (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'agent',
  status TEXT NOT NULL DEFAULT 'active',
  access_to_panel BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  CONSTRAINT fk_auth_users_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```
**Propósito:** Separar credenciales de identidad (segregación de responsabilidades).  
**Ventaja:** Seguridad aumentada, auditoría específica de login.  
**Relación:** 1 usuario = 1 registro auth_users (UNIQUE user_id)

---

#### 3. **devices** - Tabla Nueva: Dispositivos Asignados
```sql
CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  brand_model TEXT NOT NULL,
  serial_number_1 TEXT NOT NULL UNIQUE,
  serial_number_2 TEXT,
  assigned_phone TEXT NOT NULL UNIQUE,
  CONSTRAINT fk_devices_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```
**Propósito:** Rastrear dispositivos físicos asignados a usuarios.  
**Casos de Uso:**
- Control de acceso a recursos
- Auditoría de operaciones por dispositivo
- Bloqueo de acceso si dispositivo es robado/perdido

---

#### 4. **agents** - Agentes de Servicio (Legacy Adaptado)
```sql
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  initials TEXT,
  online BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_agents_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```
**Propósito:** Información operativa de agentes (estado online, avatar, etc).  
**Nota:** Mantiene relación débil con users para compatibilidad legacy.

---

#### 5. **contacts** - Contactos (Clientes/Prospectos)
```sql
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  agent_id TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT,
  position TEXT,
  created_at TEXT NOT NULL,
  CONSTRAINT fk_contacts_agent_user 
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE
);
```
**Propósito:** Base de datos de contactos de clientes.  
**Relación:** Cada contacto está asignado a un agent_id (usuario).

---

#### 6. **conversations** - Conversaciones Activas
```sql
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  contact_id TEXT,
  client_name TEXT NOT NULL,
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  start_time TEXT NOT NULL,
  phone TEXT,
  CONSTRAINT fk_conversations_agent_user
    FOREIGN KEY (agent_id) REFERENCES users(id),
  CONSTRAINT fk_conversations_contact
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);
```
**Propósito:** Gestionar conversaciones en tiempo real.  
**Estados:** active, waiting, closed, on-hold  
**Relaciones:** 
- Cada conversación pertenece a un agente
- Puede estar vinculada a un contacto (opcional)

---

#### 7. **messages** - Mensajes en Conversaciones
```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  text TEXT NOT NULL,
  time TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'dashboard',
  external_message_id TEXT,
  content_type TEXT NOT NULL DEFAULT 'text',
  text_body TEXT,
  media_file_id TEXT,
  channel TEXT NOT NULL DEFAULT 'dashboard',
  created_at TEXT NOT NULL DEFAULT now()::text,
  CONSTRAINT fk_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
```
**Propósito:** Historial completo de mensajes.  
**Canales:** dashboard, whatsapp, email, sms  
**Fuentes:** whatsapp, dashboard (manual)

---

#### 8. **media_files** - Tabla Nueva: Archivos Multimedia
```sql
CREATE TABLE media_files (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  created_at TEXT NOT NULL,
  CONSTRAINT fk_media_files_message 
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);
```
**Propósito:** Gestionar archivos adjuntos (imágenes, documentos, videos).  
**Ventaja:** Separación de metadatos de contenido.

---

#### 9. **audit_logs** - Registro de Auditoría
```sql
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  user_id TEXT,
  details TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```
**Propósito:** Trazabilidad completa de operaciones.  
**Entidades:** user, contact, conversation, message, device, credential, backup  
**Acciones:** create_user, login, delete_contact, create_conversation, etc.

---

#### 10. **backups** - Registros de Respaldos
```sql
CREATE TABLE backups (
  id TEXT PRIMARY KEY,
  backup_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  file_path TEXT,
  file_url TEXT
);
```
**Propósito:** Catálogo de respaldos para disaster recovery.  
**Tipos:** full, chats, contacts  
**Estados:** pending, success, failed

---

#### 11. **user_sessions** - Sesiones de Usuario
```sql
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  auth_user_id TEXT,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT,
  CONSTRAINT fk_user_sessions_auth_user 
    FOREIGN KEY (auth_user_id) REFERENCES auth_users(id),
  CONSTRAINT fk_user_sessions_user 
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```
**Propósito:** Gestión de tokens JWT activos.  
**Ventaja:** Posibilidad de revocar sesiones, auditoría de login.

---

## Relaciones Entre Tablas

### 📈 Diagrama ER (Entity-Relationship)

```
                    ┌──────────────┐
                    │    users     │
                    │   (PRIMARY)  │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────┐        ┌────────────┐    ┌──────────┐
   │auth_    │        │ devices    │    │ agents   │
   │users    │        │ (NEW)      │    │          │
   │(NEW)    │        └────────────┘    └──────────┘
   └─────────┘
        │
   ┌────┴────────────────────────┐
   │                             │
   ▼                             ▼
┌──────────┐         ┌─────────────────┐
│user_     │         │  contacts       │
│sessions  │         │                 │
└──────────┘         └────────┬────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ conversations    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  messages        │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ media_files(NEW) │
                    └──────────────────┘

┌──────────────────────────────────────┐
│  audit_logs (todas las entidades)   │
│  backups (disaster recovery)        │
└──────────────────────────────────────┘
```

### 🔗 Tipos de Relaciones

| Relación | Tipo | Ejemplo |
|----------|------|---------|
| users → auth_users | 1:1 | Un usuario = una identidad de auth |
| users → devices | 1:1 | Un usuario = un dispositivo asignado |
| users → contacts | 1:N | Un usuario puede tener múltiples contactos |
| users → conversations | 1:N | Un agente maneja múltiples conversaciones |
| contacts → conversations | 1:N | Un contacto puede estar en múltiples conversaciones |
| conversations → messages | 1:N | Una conversación tiene múltiples mensajes |
| messages → media_files | 1:N | Un mensaje puede tener múltiples archivos |

---

## Capas del Backend

### 🏛️ Clean Architecture (4 Capas)

#### **1. Capa Interface (HTTP/Express)**
📁 `backend/src/interface/`

**Responsabilidad:** Exponer API HTTP

```typescript
// app.ts - Configuración de Express
export const createApp = () => {
  const app = express();
  app.use('/api', userManagementRouter);
  app.use('/api', contactRouter);
  app.use('/api', agentConversationRouter);
  app.use('/api', auditRouter);
  app.use('/api', backupRouter);
  return app;
};
```

**Rutas Disponibles:**
- `POST /api/auth/login` - Autenticar usuario
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `GET /api/contacts` - Listar contactos
- `POST /api/contacts` - Crear contacto
- `GET /api/conversations` - Listar conversaciones
- `GET /api/audit-logs` - Ver auditoría
- `POST /api/backups` - Crear respaldo

---

#### **2. Capa Aplicación (Business Logic)**
📁 `backend/src/application/`

**Responsabilidad:** Implementar reglas de negocio

**Módulos Principales:**

```typescript
// userManagement.ts
export const createUser = async (repository, user, actorId) => {
  // 1. Hash de contraseña
  const passwordHash = await hashPasswordIfNeeded(user.passwordHash);
  
  // 2. Crear usuario en BD
  const created = await repository.createUser(userToCreate);
  
  // 3. Sincronizar auth_users y devices
  await syncAuthIdentityAndDevice(repository, created);
  
  // 4. Registrar en auditoría
  await logAuditEvent(repository, 'user', created.id, 'create_user', actorId, {...});
  
  return created;
};

export const loginUser = async (repository, username, password, actorId) => {
  // 1. Obtener auth_users por username
  const authUser = await repository.getAuthUserByUsername(username);
  
  // 2. Validar contraseña con bcrypt
  const matches = await bcrypt.compare(password, authUser.passwordHash);
  
  // 3. Crear sesión y token JWT
  const sessionToken = buildSessionToken(user.id, user.role);
  
  // 4. Registrar login en auditoría
  await logAuditEvent(repository, 'credential', user.id, 'login', actorId, {...});
  
  return { user, sessionToken };
};
```

**Módulos de Servicios:**

| Módulo | Responsabilidad | Métodos Principales |
|--------|-----------------|-------------------|
| `userManagement.ts` | CRUD usuarios, login, autorización | createUser, loginUser, changeUserRole |
| `contactService.ts` | CRUD contactos | createContact, updateContact, listContacts |
| `conversationService.ts` | CRUD conversaciones | createConversation, updateConversation |
| `backupService.ts` | Crear/gestionar respaldos | createBackup, listBackups |
| `rollbackService.ts` | Disaster recovery | executeRollbackMigration, verifyBackupIntegrity |
| `authorization.ts` | Control de acceso basado en rol | ensureAuthorized |
| `audit.ts` | Logging de eventos | logAuditEvent, createAuditEntry |

---

#### **3. Capa Dominio (Models & Rules)**
📁 `backend/src/domain/`

**Responsabilidad:** Definir entidades y contratos

```typescript
// models.ts
export interface UserModel {
  id: string;
  fullName: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'supervisor' | 'agent';
  status: 'active' | 'inactive' | 'suspended';
  accessToPanel: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUserModel {
  id: string;
  userId: string;
  username: string;
  passwordHash: string;
  role: string;
  status: string;
  accessToPanel: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceModel {
  id: string;
  userId: string;
  brandModel: string | null;
  serialNumber1: string | null;
  serialNumber2: string | null;
  assignedPhone: string | null;
}

export interface ConversationModel {
  id: string;
  agentId: string;
  contactId?: string;
  clientName: string;
  topic: string;
  status: 'active' | 'waiting' | 'closed';
  startTime: string;
  phone?: string;
}

// repositories.ts
export interface UserRepository {
  createUser(user: UserModel): Promise<UserModel>;
  getUserById(id: string): Promise<UserModel | null>;
  updateUser(user: UserModel): Promise<UserModel>;
  getAuthUserByUsername(username: string): Promise<AuthUserModel | null>;
  upsertAuthUser(auth: AuthUserModel): Promise<AuthUserModel>;
  upsertDevice(device: DeviceModel): Promise<DeviceModel>;
  // ... más métodos
}
```

---

#### **4. Capa Infraestructura (Persistence)**
📁 `backend/src/infrastructure/`

**Responsabilidad:** Acceso a BD, configuración de conexiones

```typescript
// database/init.ts - Inicialización de esquema
export const initializeDatabase = async () => {
  // 1. Conexión a PostgreSQL
  const client = await getDatabaseClient();
  
  // 2. Crear tablas (si no existen)
  // - users, auth_users, devices, agents
  // - contacts, conversations, messages, media_files
  // - audit_logs, backups, user_sessions
  
  // 3. Migración de datos legacy
  // - Copiar datos de tablas viejas a nuevas
  // - Sincronizar auth_users con usuarios existentes
  // - Crear records en devices
  
  // 4. Registrar checkpoints en audit_logs
  // - Timestamp pre-migración
  // - Timestamp post-migración
  
  // 5. Limpieza de schema legacy
  // - Eliminar columnas antiguas
  // - Eliminar tablas realmente obsoletas
};

// database/repositories.ts
export class PostgresUserRepository implements UserRepository {
  async createUser(user: UserModel): Promise<UserModel> {
    const query = `
      INSERT INTO users (id, full_name, username, password_hash, role, status, access_to_panel, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    
    const result = await this.client.query(query, [
      user.id,
      user.fullName,
      user.username,
      user.passwordHash,
      user.role,
      user.status,
      user.accessToPanel,
      user.createdAt,
      user.updatedAt
    ]);
    
    return mapRowToUser(result.rows[0]);
  }
  
  async getAuthUserByUsername(username: string): Promise<AuthUserModel | null> {
    const query = `SELECT * FROM auth_users WHERE username = $1;`;
    const result = await this.client.query(query, [username]);
    return result.rows[0] ? mapRowToAuthUser(result.rows[0]) : null;
  }
  
  async upsertAuthUser(auth: AuthUserModel): Promise<AuthUserModel> {
    const query = `
      INSERT INTO auth_users (id, user_id, username, password_hash, role, status, access_to_panel, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id) DO UPDATE SET
        username = EXCLUDED.username,
        password_hash = EXCLUDED.password_hash,
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;
    // ...
  }
}
```

---

## Flujos de Datos

### 🔄 Flujo: Crear Nuevo Usuario

```
API Request (POST /api/users)
    │
    ├─ {name, email, password, role, accessToPanel}
    │
    ▼
[userManagementRoute.ts]
    ├─ Mapear: name → fullName, password → passwordHash
    ├─ Extraer: username de email o generar automático
    │
    ▼
[createUser() en userManagement.ts]
    ├─ Hash de contraseña con bcrypt
    │
    ▼
[repository.createUser()]
    ├─ INSERT en tabla users
    │
    ▼
[syncAuthIdentityAndDevice()]
    ├─ INSERT en auth_users (credenciales)
    ├─ INSERT en devices (dispositivo asignado)
    │
    ▼
[logAuditEvent()]
    ├─ INSERT en audit_logs
    │   {action: 'create_user', entity_type: 'user', performed_by: 'admin', details: {...}}
    │
    ▼
Response: {success: true, data: {id, fullName, username, role, ...}}
```

### 🔄 Flujo: Login de Usuario

```
API Request (POST /api/auth/login)
    │
    ├─ {username, password}
    │
    ▼
[validateLoginPayload()]
    ├─ Validar que username y password existan
    │
    ▼
[loginUser() en userManagement.ts]
    ├─ repository.getAuthUserByUsername(username)
    │   └─ SELECT * FROM auth_users WHERE username = ?
    │
    ├─ Validar user.status = 'active' y user.accessToPanel = true
    │
    ├─ bcrypt.compare(password, storedHash)
    │   └─ Validar credenciales
    │
    ├─ Generar JWT token
    │   └─ buildSessionToken(userId, role)
    │
    ├─ createSessionRecord() en user_sessions
    │   └─ INSERT en user_sessions (para auditoría de sesiones)
    │
    ├─ logAuditEvent()
    │   └─ INSERT en audit_logs {action: 'login', username: '...'}
    │
    ▼
Response: {
  success: true,
  data: {
    user: {id, fullName, role, status, ...},
    sessionToken: "eyJhbGc..."
  }
}

Token se envía en:
├─ Cookie: crm_session (HttpOnly, Secure)
└─ Response JSON: sessionToken
```

### 🔄 Flujo: Crear Contacto

```
API Request (POST /api/contacts)
    │
    ├─ Headers: Authorization: Bearer <token>
    ├─ Body: {name, phone, company, ...}
    │
    ▼
[authenticateRequest()] - Middleware
    ├─ Validar token JWT
    ├─ Verificar user en user_sessions
    │
    ▼
[ensureAuthorized(role, 'manage-contacts')] - Authorization
    ├─ Admin, Supervisor: ✓ permitido
    ├─ Agent: ✗ denegado
    │
    ▼
[repository.createContact()]
    ├─ INSERT en contacts (con agent_id del usuario actual)
    │
    ▼
[logAuditEvent()]
    ├─ INSERT en audit_logs {action: 'create_contact', entity_id: contactId}
    │
    ▼
Response: {success: true, data: {id, name, phone, agent_id, ...}}
```

### 🔄 Flujo: Registrar Conversación y Mensaje

```
Webhook WhatsApp → Backend
    │
    ├─ Validar firma Meta (HMAC-SHA256)
    │
    ▼
[conversationService.ts]
    ├─ Verificar si conversación existe
    ├─ Si NO existe: INSERT en conversations
    │
    ▼
[messageService.ts]
    ├─ INSERT en messages (con conversation_id)
    ├─ Si tiene multimedia: INSERT en media_files
    │
    ▼
[logAuditEvent()]
    ├─ action: 'ingest_whatsapp_message'
    │
    ▼
[WebSocket Broadcasting]
    ├─ socket.emit('message:received', {conversationId, message})
    │   Notificar a agentes en tiempo real
    │
    ▼
Response: 200 OK (para Meta)
```

---

## Migración desde Legacy

### 📦 Proceso de Migración Automático

```
[Step 1] Crear nuevas tablas
         └─ auth_users, devices (si no existen)

[Step 2] Copiar datos legacy
         ├─ INSERT INTO users (para agentes nuevos si aplica)
         ├─ INSERT INTO auth_users (desde usuarios existentes)
         └─ INSERT INTO devices (crear registros vacíos)

[Step 3] Sincronizar relaciones
         ├─ Verificar foreign keys
         ├─ Corregir referencias huérfanas
         └─ Crear índices para performance

[Step 4] Registrar checkpoint PRE-MIGRACIÓN
         └─ audit_logs {action: 'pre_migration_checkpoint'}

[Step 5] Validar integridad
         ├─ Contar registros (antes = después)
         ├─ Verificar constraints
         └─ Detectar anomalías

[Step 6] Registrar checkpoint POST-MIGRACIÓN
         └─ audit_logs {action: 'post_migration_checkpoint'}

[Step 7] Preparar rollback (si falla)
         ├─ Crear SQL rollback reversible
         ├─ Guardar backup completo
         └─ Permitir restauración rápida
```

### 🔄 SQL de Migración

```sql
-- Paso 1: Crear auth_users desde usuarios existentes
INSERT INTO auth_users (id, user_id, username, password_hash, role, status, access_to_panel, created_at, updated_at)
SELECT
  concat('auth-', u.id),
  u.id,
  u.username,
  u.password_hash,
  u.role,
  u.status,
  u.access_to_panel,
  u.created_at,
  u.updated_at
FROM users u
LEFT JOIN auth_users au ON au.user_id = u.id
WHERE au.id IS NULL
ON CONFLICT (user_id) DO UPDATE SET
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash;

-- Paso 2: Crear devices para usuarios con rol = admin/supervisor/agent
INSERT INTO devices (id, user_id, brand_model, serial_number_1, serial_number_2, assigned_phone)
SELECT
  concat('device-', u.id),
  u.id,
  'Migrated from legacy system',
  concat('serial-', u.id),
  NULL,
  concat('+000000000', substr(u.id, 1, 3))
FROM users u
WHERE u.role IN ('admin', 'supervisor', 'agent')
ON CONFLICT (id) DO NOTHING;

-- Paso 3: Registrar checkpoint de migración
INSERT INTO audit_logs (id, entity_type, entity_id, action, performed_by, user_id, details, created_at)
VALUES (
  concat('audit-migration-', NOW()::TEXT),
  'system',
  'schema',
  'post_migration',
  'system',
  NULL,
  jsonb_build_object('status', 'completed', 'timestamp', NOW()::TEXT)::text,
  NOW()::TEXT
);
```

---

## Operaciones CRUD

### ✅ CREATE - Crear Entidades

#### Usuario
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "role": "supervisor",
    "accessToPanel": true,
    "phone": "+34600000000"
  }'
```

**Backend Logic:**
1. Map: name → fullName, password → passwordHash
2. Generate: username (from email)
3. Set defaults: status='active', role='supervisor'
4. Hash password con bcrypt (10 rounds)
5. INSERT en users, auth_users, devices (transacción)
6. Registrar en audit_logs

---

#### Contacto
```bash
curl -X POST http://localhost:3000/api/contacts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "phone": "+34912345678",
    "company": "Acme Inc",
    "email": "contact@acme.com"
  }'
```

**Backend Logic:**
1. Validar autorización (admin/supervisor)
2. Set: agent_id = usuario autenticado
3. INSERT en contacts
4. Registrar en audit_logs

---

### 📖 READ - Leer Entidades

#### Listar Usuarios (Solo Admin/Supervisor)
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer <token>"
```

**Backend Logic:**
1. Validar token JWT
2. Verificar rol (admin/supervisor)
3. SELECT * FROM users (con paginación opcional)
4. Excluir passwordHash de respuesta
5. Return JSON

---

#### Listar Conversaciones
```bash
curl -X GET http://localhost:3000/api/conversations \
  -H "Authorization: Bearer <token>"
```

**Backend Logic:**
1. Si role = 'agent': filtrar por agentId
2. Si role = 'supervisor/admin': mostrar todas
3. SELECT FROM conversations (con JOINs)
4. Incluir: agent info, contact info, último mensaje
5. Ordenar por start_time DESC

---

### ✏️ UPDATE - Modificar Entidades

#### Cambiar Rol de Usuario
```bash
curl -X PATCH http://localhost:3000/api/users/user-id/role \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "supervisor"}'
```

**Backend Logic:**
1. Verificar que solo admin puede cambiar roles
2. UPDATE users SET role = 'supervisor'
3. UPDATE auth_users SET role = 'supervisor'
4. Registrar en audit_logs con historial de cambios
5. Notificar vía WebSocket (si usuario activo)

---

### 🗑️ DELETE - Eliminar Entidades

#### Eliminar Usuario
```bash
curl -X DELETE http://localhost:3000/api/users/user-id \
  -H "Authorization: Bearer <token>"
```

**Backend Logic:**
1. Validar: solo admin puede eliminar
2. Verificar: usuario no está en conversaciones activas
3. DELETE FROM users (cascada: auth_users, devices)
4. Registrar en audit_logs {action: 'delete_user', details: {deleted_user_id, timestamp}}
5. Revocar todas las sesiones activas del usuario

---

## Auditoría y Seguridad

### 🔐 Capas de Seguridad

```
┌────────────────────────────────────────────────────────┐
│ 1. HTTPS/TLS - Transport Layer Security               │
│    (Conexiones cifradas entre cliente-servidor)       │
└────────────────────────────────────────────────────────┘
                          ▼
┌────────────────────────────────────────────────────────┐
│ 2. JWT Authentication - Session Management            │
│    (Token con expiración, revocación en BD)           │
└────────────────────────────────────────────────────────┘
                          ▼
┌────────────────────────────────────────────────────────┐
│ 3. Role-Based Access Control (RBAC)                   │
│    (admin, supervisor, agent - permisos específicos)  │
└────────────────────────────────────────────────────────┘
                          ▼
┌────────────────────────────────────────────────────────┐
│ 4. bcrypt Password Hashing - Credential Storage       │
│    (10 rounds, salted hashes)                         │
└────────────────────────────────────────────────────────┘
                          ▼
┌────────────────────────────────────────────────────────┐
│ 5. Complete Audit Logging - Accountability            │
│    (Todas las operaciones registradas)               │
└────────────────────────────────────────────────────────┘
```

### 📋 Esquema de Auditoría

```typescript
interface AuditLogEntry {
  id: string;                    // ID único
  entity_type: string;           // 'user', 'contact', 'conversation', 'device', etc.
  entity_id: string;             // ID de la entidad modificada
  action: string;                // 'create', 'update', 'delete', 'login', etc.
  performed_by: string;          // ID/username de quien ejecutó
  user_id?: string;              // Usuario afectado (opcional)
  details: {                      // JSON con información adicional
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
  };
  created_at: string;            // Timestamp ISO 8601
}
```

### 📊 Eventos Auditados

| Entidad | Acciones Auditadas |
|---------|-------------------|
| **user** | create_user, update_user, delete_user, change_role, change_status, login, logout |
| **contact** | create_contact, update_contact, delete_contact |
| **conversation** | create_conversation, update_status, close_conversation |
| **message** | ingest_whatsapp_message, send_message |
| **device** | update_device, assign_device |
| **backup** | create_backup, restore_backup, verify_backup |
| **credential** | password_change, login_failed |

### 🔍 Ejemplo: Auditoría de Login

```sql
-- Registro de login exitoso
INSERT INTO audit_logs (id, entity_type, entity_id, action, performed_by, user_id, details, created_at)
VALUES (
  'audit-login-user-admin-1-2026-07-22T17:30:00Z',
  'credential',
  'user-admin-1',
  'login',
  'user-admin-1',
  'user-admin-1',
  '{"username":"admin","ipAddress":"192.168.1.100","userAgent":"Mozilla/5.0","result":"success"}',
  '2026-07-22T17:30:00.000Z'
);

-- Registro de intento fallido
INSERT INTO audit_logs (id, entity_type, entity_id, action, performed_by, user_id, details, created_at)
VALUES (
  'audit-login-failed-2026-07-22T17:30:15Z',
  'credential',
  'unknown-user',
  'login_failed',
  'system',
  NULL,
  '{"username":"hacker","ipAddress":"203.0.113.50","reason":"invalid_credentials","attempts":3}',
  '2026-07-22T17:30:15.000Z'
);
```

---

## Disaster Recovery

### 🆘 Estrategia de Respaldo y Rollback

#### **Fase 1: Pre-Migración**

```typescript
// Crear checkpoint ANTES de hacer cambios
const preCheckpoint = await createMigrationCheckpoint(
  'pre_migration',
  'Before schema update - database state snapshot'
);
// Registra en audit_logs:
// {id: 'checkpoint-pre-migration-...', type: 'checkpoint', timestamp: ...}
```

#### **Fase 2: Migración**

```typescript
try {
  // Ejecutar migración
  await initializeDatabase();
  
  // Si éxito:
  await createMigrationCheckpoint('post_migration', 'Migration completed successfully');
  
} catch (error) {
  // Si falla:
  console.error('Migration failed:', error);
  
  // Opción 1: Rollback automático
  await executeRollbackMigration();
  
  // Opción 2: Restaurar desde backup
  await restoreFromBackup(latestBackupId);
}
```

#### **Fase 3: Respaldos**

```typescript
// Crear respaldo completo ANTES de producción
const backup = await backupService.createBackup('full');
// Genera ZIP con:
// ├─ contacts.csv
// ├─ users_export.csv
// ├─ audit_logs_export.csv
// └─ metadata.json

// Guardar en storage/backups/
// - Timestamp en nombre de archivo
// - Metadata en BD (backups table)
// - Verificación de integridad
```

#### **Fase 4: Rollback SQL Reversible**

```sql
-- Función PL/pgSQL para reverter cambios
CREATE OR REPLACE FUNCTION rollback_migration() RETURNS void AS $$
BEGIN
  -- Paso 1: Eliminar constraints nuevas (IF EXISTS)
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'fk_conversations_contact') THEN
    ALTER TABLE conversations DROP CONSTRAINT fk_conversations_contact;
  END IF;
  
  -- Paso 2: Restaurar columnas legacy (IF NOT EXISTS)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'email') THEN
    ALTER TABLE users ADD COLUMN email TEXT;
  END IF;
  
  -- Paso 3: Registrar rollback en audit_logs
  INSERT INTO audit_logs (id, entity_type, entity_id, action, performed_by, details, created_at)
  VALUES (
    concat('audit-rollback-', NOW()::TEXT),
    'system',
    'schema',
    'emergency_rollback',
    'system',
    jsonb_build_object('reason', 'disaster_recovery', 'timestamp', NOW()::TEXT)::text,
    NOW()::TEXT
  );
  
  RAISE NOTICE 'Database rolled back to previous state';
END;
$$ LANGUAGE plpgsql;

-- Ejecutar rollback
SELECT rollback_migration();
```

#### **Fase 5: Recuperación desde Backup**

```bash
#!/bin/bash
# restore-from-backup.sh

BACKUP_FILE="/storage/backups/deployment-control/backup-2026-07-22-173000.zip"
RESTORE_DB="crm_sign_medios_restored"

# 1. Descomprimir backup
unzip $BACKUP_FILE -d /tmp/restore/

# 2. Crear BD nueva
createdb $RESTORE_DB

# 3. Restaurar datos
psql -d $RESTORE_DB < /tmp/restore/database_dump.sql

# 4. Verificar integridad
psql -d $RESTORE_DB -c "SELECT COUNT(*) FROM users;"

# 5. Si OK, switchear
dropdb crm_sign_medios
createdb crm_sign_medios < $RESTORE_DB

# 6. Registrar en audit
echo "Backup restoration from $BACKUP_FILE completed at $(date)" >> /var/log/crm-restore.log
```

### 🛡️ CLI de Recuperación

```bash
# Ver backups disponibles
npm run rollback:verify-backup
# Output: Backups disponibles (últimos 20)

# Verificar integridad de datos
npm run rollback:consistency
# Output: Total users: 150, Users with auth: 150, ✓ Consistent

# Ver historial de migraciones
npm run rollback:history
# Output: [Últimos 50 eventos de migración/checkpoint]

# Ejecutar rollback de emergencia
npm run rollback:migration
# ⚠️  WARNING: This will revert database to previous state
# Confirmar antes de ejecutar
```

---

## Resumen Gráfico

### 🎯 Flujo Completo: Usuario → Conversación → Mensaje

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. REGISTRO DE USUARIO                                          │
│    POST /api/users → backend/interface/userManagementRoute.ts  │
│    → application/userManagement.ts → domain/models.ts         │
│    → infrastructure/database/repositories.ts                  │
│    └─ INSERT users, auth_users, devices + audit_logs         │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. LOGIN                                                         │
│    POST /api/auth/login → loginUser() en application/          │
│    SELECT * FROM auth_users WHERE username = ?                │
│    → bcrypt.compare(password, hash)                           │
│    → generateJWT() → INSERT user_sessions                     │
│    └─ Retorna: {user, sessionToken}                          │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. CREAR CONTACTO                                               │
│    POST /api/contacts (con token JWT en header)               │
│    → authenticateRequest() → ensureAuthorized('manage-contacts')│
│    → application/contactService.ts                           │
│    └─ INSERT contacts + audit_logs                           │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. RECIBIR MENSAJE WHATSAPP                                     │
│    Webhook Meta → /api/whatsapp/inbound                        │
│    → verifyWebhookSignature() → agentConversationRoute.ts     │
│    → conversationService.ts                                   │
│    ├─ Si conversación no existe: INSERT conversations        │
│    ├─ INSERT messages                                        │
│    ├─ Si media: INSERT media_files                           │
│    ├─ Broadcast vía WebSocket (real-time)                    │
│    └─ INSERT audit_logs {action: 'ingest_whatsapp_message'} │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. AUDITORÍA COMPLETA                                           │
│    Todas las operaciones registradas en audit_logs con:        │
│    - Quién: performed_by (usuario o sistema)                  │
│    - Qué: entity_type + entity_id                            │
│    - Cuándo: created_at (ISO 8601)                           │
│    - Detalles: oldValue, newValue, ipAddress, userAgent      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Conclusión

El nuevo diseño de base de datos implementa:

✅ **Clean Architecture** - Separación clara de responsabilidades  
✅ **Security First** - Autenticación JWT, bcrypt, roles  
✅ **Audit Trail** - Trazabilidad completa de operaciones  
✅ **Disaster Recovery** - Backups y rollback reversibles  
✅ **Performance** - Índices, constraints, normalized schema  
✅ **Scalability** - Diseño preparado para crecimiento  
✅ **Maintainability** - Código modular, testeable, documentado

Este modelo prepara el CRM-SIGN-MEDIOS para producción empresarial con máximas garantías de confiabilidad y seguridad.
