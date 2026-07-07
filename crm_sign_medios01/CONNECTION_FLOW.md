# 🔗 Flujo de Conexión - Frontend ↔ Backend ↔ PostgreSQL

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      NAVEGADOR (Localhost:5173)             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  React App                                          │    │
│  │  - src/app/pages/LoginPage.tsx                      │    │
│  │  - src/app/services/apiClient.ts                    │    │
│  │  - Hace fetch a VITE_API_BASE                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           │ HTTP GET/POST                    │
│                           │ Content-Type: application/json   │
│                           │                                  │
│                           ▼                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              BACKEND (http://localhost:3000)                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Express Server (backend/src/main.ts)               │    │
│  │  - CORS configurado                                 │    │
│  │  - Routes en backend/src/interface/app.ts           │    │
│  │  - Controllers en backend/src/interface/           │    │
│  │  - Business Logic en backend/src/application/      │    │
│  │  - Database Client en backend/src/infra/db/       │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           │ SQL Queries                      │
│                           │ Connection String:               │
│                           │ postgres://user:password@        │
│                           │ localhost:5432/crm_sign_medios   │
│                           ▼                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│          POSTGRESQL DATABASE (localhost:5432)               │
│          [Docker Container: crm-sign-postgres]              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Tablas:                                            │    │
│  │  - agents                                           │    │
│  │  - conversations                                    │    │
│  │  - messages                                         │    │
│  │  - users                                            │    │
│  │  - audit_logs                                       │    │
│  │  - backups                                          │    │
│  │  - contacts                                         │    │
│  │  - user_sessions                                    │    │
│  │  - ...                                              │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo de una Solicitud (Ejemplo: Login)

### 1️⃣ Frontend Inicia (Vite Dev Server)

```
Archivo: src/main.tsx
├─ Inicia en http://localhost:5173
├─ Carga src/app/App.tsx
└─ Renderiza LoginPage en src/app/pages/LoginPage.tsx
```

### 2️⃣ Usuario Completa el Login

```
Archivo: src/app/pages/LoginPage.tsx
│
├─ Obtiene credenciales del formulario
│
├─ Llama a apiClient.ts
│  └─ requestJson('POST', '/login', { username, password })
│
└─ Que genera URL completa:
   VITE_API_BASE + '/login'
   = http://localhost:3000/api + '/login'
   = http://localhost:3000/api/login
```

### 3️⃣ Solicitud HTTP al Backend

```
POST http://localhost:3000/api/login HTTP/1.1
Content-Type: application/json
Content-Length: 45

{"username": "admin", "password": "password"}
```

### 4️⃣ Backend Recibe y Procesa

```
Archivo: backend/src/interface/app.ts
│
├─ Express Router recibe POST /api/login
│
├─ Controller (backend/src/interface/)
│  └─ validateUserLogin(username, password)
│
├─ Application Service (backend/src/application/)
│  └─ userManagement.authenticate(username, password)
│
├─ Domain Logic (backend/src/domain/)
│  └─ compara hash con bcrypt
│
└─ Infrastructure Database (backend/src/infrastructure/database/)
   └─ getDatabaseClient().query('SELECT * FROM users WHERE username = ...')
```

### 5️⃣ Backend Consulta PostgreSQL

```
SQL Query (ejecutado en pool de conexiones):

SELECT id, username, password_hash, role, status, created_at, updated_at
FROM users
WHERE username = 'admin'
LIMIT 1;

Connection String: postgres://user:password@localhost:5432/crm_sign_medios
```

### 6️⃣ PostgreSQL Retorna Resultado

```
Result:
{
  id: 'user-123',
  username: 'admin',
  password_hash: '$2b$10$...',
  role: 'admin',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}
```

### 7️⃣ Backend Genera Respuesta

```
Archivo: backend/src/interface/app.ts
│
├─ Compara password enviado con password_hash en BD
│
├─ Si es válido:
│  └─ Genera JWT token
│
└─ Retorna JSON con token
```

### 8️⃣ Frontend Recibe Respuesta

```
Response:
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-123",
      "username": "admin",
      "role": "admin"
    }
  }
}
```

### 9️⃣ Frontend Almacena Token

```
Archivo: src/app/pages/LoginPage.tsx o LoginCard.tsx
│
├─ window.localStorage.setItem('crm_session_token', token)
│
└─ Redirige a /dashboard (DashboardPage.tsx)
```

## 🔐 Variables de Entorno Clave

### Frontend (`.env` en raíz)
```env
VITE_API_BASE=http://localhost:3000/api
VITE_API_PROXY_TARGET=http://localhost:3000
```

### Backend (`backend/.env`)
```env
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/crm_sign_medios
JWT_SECRET=dev-secret
```

### Docker/PostgreSQL (`docker-compose.yml`)
```yaml
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=crm_sign_medios
```

## 🌐 Endpoints Principales del Backend

```
POST   /api/login              - Login de usuario
GET    /api/user              - Obtener usuario actual
GET    /api/conversations     - Obtener conversaciones
POST   /api/conversations     - Crear conversación
GET    /api/messages/:conv_id - Obtener mensajes
POST   /api/messages          - Enviar mensaje
...
```

## 📁 Estructura de Archivos Clave

```
Frontend (src/):
├─ main.tsx                           - Entry point
├─ app/
│  ├─ App.tsx                        - Root component
│  ├─ routes.tsx                     - Rutas
│  ├─ pages/
│  │  ├─ LoginPage.tsx              - Página de login
│  │  ├─ DashboardPage.tsx          - Dashboard principal
│  │  └─ ...
│  ├─ services/
│  │  ├─ apiClient.ts               - 🔑 Cliente HTTP
│  │  ├─ dashboardApi.ts            - Endpoints del dashboard
│  │  └─ ...
│  └─ components/
│     ├─ LoginForm.tsx
│     └─ ...

Backend (backend/src/):
├─ main.ts                           - Entry point + Server setup
├─ interface/
│  ├─ app.ts                        - 🔑 Express app + routes
│  ├─ dtos.ts                       - Data Transfer Objects
│  └─ ...
├─ application/
│  ├─ userManagement.ts             - Lógica de usuarios
│  ├─ conversationService.ts        - Lógica de conversaciones
│  └─ ...
├─ domain/
│  ├─ models.ts                     - Entities/Models
│  └─ repositories.ts               - Interfaces de datos
├─ infrastructure/
│  └─ database/
│     ├─ connection.ts              - 🔑 Pool de conexión
│     ├─ init.ts                    - Inicialización
│     └─ init.sql                   - DDL de tablas
└─ common/
   └─ config.ts                     - Configuración global
```

## 🔑 Puntos de Integración

### 1. Cliente API (Frontend)
**Archivo:** `src/app/services/apiClient.ts`
- Función: `getApiBaseUrl()` - Lee `VITE_API_BASE`
- Función: `requestJson()` - Hace fetch + agrega token
- Usa: `window.localStorage.getItem('crm_session_token')`

### 2. Servidor Express (Backend)
**Archivo:** `backend/src/interface/app.ts`
- Configura CORS para `http://localhost:5173`
- Define todas las rutas REST
- Middleware: parsers, autenticación, logging

### 3. Pool de Conexión PostgreSQL (Backend)
**Archivo:** `backend/src/infrastructure/database/connection.ts`
- Lee `DATABASE_URL` de `.env`
- Crea pool de 20 conexiones máximo
- Maneja reconexión automática

## ✅ Verificar Conexiones

### ¿Frontend conectado a Backend?
```
1. Abre DevTools (F12)
2. Pestaña Network
3. Haz login
4. Busca request a http://localhost:3000/api/login
5. Si ves 200 OK → ✅ Conectado
```

### ¿Backend conectado a PostgreSQL?
```
1. Revisa la salida del terminal del backend
2. Debería mostrar: "✅ Database initialized successfully"
3. Si hay error → Revisa que docker-compose está up
```

### Verificar manualmente en terminal:
```bash
# Test frontend
curl http://localhost:5173  # Debería retornar HTML

# Test backend
curl http://localhost:3000/api/health  # Debería retornar JSON

# Test PostgreSQL
docker-compose exec postgres psql -U user -d crm_sign_medios -c "SELECT 1;"
```

## 🚀 Próximos Pasos de Desarrollo

1. **Autenticación:** Revisa `backend/src/application/authorization.ts`
2. **Conversaciones:** Revisa `backend/src/application/conversationService.ts`
3. **WebSockets (Realtime):** Revisa `backend/src/infrastructure/realtime/socket.ts`
4. **Componentes UI:** Revisa `src/app/components/`
5. **Tests:** Ejecuta `pnpm test` en cada directorio
